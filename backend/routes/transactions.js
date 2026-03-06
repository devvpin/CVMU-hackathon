import express from 'express';
import { db } from '../config/firebase.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);

// Get all transactions for a user
router.get('/', async (req, res) => {
    try {
        const { uid } = req.user;
        const transactionsRef = db.collection('transactions').where('userId', '==', uid);
        const snapshot = await transactionsRef.get();

        if (snapshot.empty) {
            return res.status(200).json([]);
        }

        let transactions = [];
        snapshot.forEach(doc => {
            transactions.push({ id: doc.id, ...doc.data() });
        });

        // Sort by date descending (could also do in query if index exists)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Helper function to update or create budgets
const autoGenerateBudgets = async (uid, incomeAmount, date) => {
    try {
        // Extract YYYY-MM from date
        const month = date.substring(0, 7);

        // 50/30/20 Rule
        const allocations = [
            { category: 'Needs', amount: incomeAmount * 0.50 },
            { category: 'Wants', amount: incomeAmount * 0.30 },
            { category: 'Savings & Investments', amount: incomeAmount * 0.20 }
        ];

        for (const allocation of allocations) {
            const snapshot = await db.collection('budgets')
                .where('userId', '==', uid)
                .where('category', '==', allocation.category)
                .where('month', '==', month)
                .get();

            if (!snapshot.empty) {
                // Budget exists for this month/category, add to it
                const docRef = snapshot.docs[0].ref;
                const currentAmount = snapshot.docs[0].data().amount || 0;
                await docRef.update({ amount: currentAmount + allocation.amount });
            } else {
                // Create new budget
                await db.collection('budgets').add({
                    userId: uid,
                    category: allocation.category,
                    amount: allocation.amount,
                    month: month,
                    createdAt: new Date().toISOString()
                });
            }
        }
        console.log(`Auto-generated budgets for ${uid} based on income ${incomeAmount}`);
    } catch (error) {
        console.error('Error auto-generating budgets:', error);
        // We don't throw here to avoid failing the main transaction creation
    }
};

// Add a transaction
router.post('/', async (req, res) => {
    try {
        const { uid } = req.user;
        const {
            type, amount, category, subcategory, description, note, date,
            recurring, recurringType, walletId,
            ...metadata
        } = req.body;

        if (!type || !amount || !category || !date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const numericAmount = Number(amount);

        const newTransaction = {
            userId: uid,
            type, // 'income' or 'expense'
            amount: numericAmount,
            category,
            subcategory: subcategory || '',
            note: note || description || '', // fallback to description for older clients
            recurring: !!recurring,
            recurringType: recurringType || null,
            lastProcessedDate: recurring ? date : null, // Track when it was last processed
            date, // YYYY-MM-DD format
            walletId: walletId || null,
            metadata: metadata || {},
            createdAt: new Date().toISOString()
        };

        const batch = db.batch();
        const docRef = db.collection('transactions').doc();
        batch.set(docRef, newTransaction);

        // Adjust wallet balance if walletId is present
        if (walletId) {
            const walletRef = db.collection('wallets').doc(walletId);
            const walletDoc = await walletRef.get();
            if (walletDoc.exists && walletDoc.data().userId === uid) {
                const currentBalance = walletDoc.data().balance || 0;
                const balanceChange = type === 'income' ? numericAmount : -numericAmount;
                batch.update(walletRef, { balance: currentBalance + balanceChange });
            }
        }

        await batch.commit();

        // Auto-budget generation for income
        if (type === 'income') {
            await autoGenerateBudgets(uid, numericAmount, date);
        }

        res.status(201).json({ id: docRef.id, ...newTransaction });
    } catch (error) {
        console.error('Error adding transaction:', error);
        res.status(500).json({ error: 'Failed to add transaction' });
    }
});

// Update a transaction
router.put('/:id', async (req, res) => {
    try {
        const { uid } = req.user;
        const { id } = req.params;
        const updateData = req.body;

        const docRef = db.collection('transactions').doc(id);
        const doc = await docRef.get();

        const oldData = doc.data();

        // Complex: Calculate wallet changes if amount, type, or walletId changed
        const batch = db.batch();
        batch.update(docRef, updateData);

        const oldWalletId = oldData.walletId;
        const newWalletId = updateData.walletId !== undefined ? updateData.walletId : oldWalletId;

        const oldType = oldData.type;
        const newType = updateData.type || oldType;

        const oldAmount = oldData.amount;
        const newAmount = updateData.amount !== undefined ? Number(updateData.amount) : oldAmount;

        // If it was attached to a wallet, revert the old transaction's effect
        if (oldWalletId) {
            const oldWalletRef = db.collection('wallets').doc(oldWalletId);
            const oldWalletDoc = await oldWalletRef.get();
            if (oldWalletDoc.exists) {
                const oldBal = oldWalletDoc.data().balance || 0;
                const revertChange = oldType === 'income' ? -oldAmount : oldAmount;
                batch.update(oldWalletRef, { balance: oldBal + revertChange });
            }
        }

        // Apply new transaction's effect to the new wallet
        if (newWalletId) {
            const newWalletRef = db.collection('wallets').doc(newWalletId);
            const newWalletDoc = await newWalletRef.get();
            if (newWalletDoc.exists) {
                // We must re-fetch or use the updated balance if oldWalletId === newWalletId
                // For simplicity, we just use Firestore field increments, but let's do it cleanly:
                const shift = newType === 'income' ? newAmount : -newAmount;
                // Since this might hit the same wallet twice in one batch, it's better to use FieldValue.increment
                // Wait, if we use FieldValue.increment, we don't need to read!
                // Let's refactor slightly using increment for the new wallet:
                const admin = await import('firebase-admin');
                batch.update(newWalletRef, { balance: admin.firestore.FieldValue.increment(shift) });
            }
        }

        // And we should change the old wallet revert to use increment too
        if (oldWalletId) {
            const oldWalletRef = db.collection('wallets').doc(oldWalletId);
            const admin = await import('firebase-admin');
            const revertShift = oldType === 'income' ? -oldAmount : oldAmount;
            batch.update(oldWalletRef, { balance: admin.firestore.FieldValue.increment(revertShift) });
        }

        await batch.commit();
        res.status(200).json({ id, ...oldData, ...updateData });
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});

// Delete a transaction
router.delete('/:id', async (req, res) => {
    try {
        const { uid } = req.user;
        const { id } = req.params;

        const docRef = db.collection('transactions').doc(id);
        const doc = await docRef.get();

        const transactionData = doc.data();

        const batch = db.batch();
        batch.delete(docRef);

        // Revert wallet balance if transaction had a wallet
        if (transactionData.walletId) {
            const walletRef = db.collection('wallets').doc(transactionData.walletId);
            const admin = await import('firebase-admin');
            const revertShift = transactionData.type === 'income' ? -transactionData.amount : transactionData.amount;
            batch.update(walletRef, { balance: admin.firestore.FieldValue.increment(revertShift) });
        }

        await batch.commit();
        res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});

// ==========================================
// RECURRING TRANSACTIONS ENGINE
// ==========================================
router.get('/process-recurring', async (req, res) => {
    try {
        const { uid } = req.user;

        // Find all recurring transactions for this user
        const recurringRef = db.collection('transactions')
            .where('userId', '==', uid)
            .where('recurring', '==', true);

        const snapshot = await recurringRef.get();
        if (snapshot.empty) {
            return res.status(200).json({ processed: 0, message: "No recurring transactions found." });
        }

        const today = new Date();
        // Zero out time for accurate date comparison
        today.setHours(0, 0, 0, 0);

        const batch = db.batch();
        let processedCount = 0;

        // Keep track of budgets to generate later
        let incomeToAutoBudget = 0;

        for (const doc of snapshot.docs) {
            const data = doc.data();

            // Skip invalid ones
            if (!data.recurringType || !data.lastProcessedDate) continue;

            let lastDate = new Date(data.lastProcessedDate);
            let nextDate = new Date(lastDate);

            // Calculate next expected date
            if (data.recurringType === 'monthly') {
                nextDate.setMonth(nextDate.getMonth() + 1);
            } else if (data.recurringType === 'weekly') {
                nextDate.setDate(nextDate.getDate() + 7);
            } else if (data.recurringType === 'yearly') {
                nextDate.setFullYear(nextDate.getFullYear() + 1);
            }

            // If the next expected date is today or in the past, generate new entries
            // We use a while loop to catch up if multiple periods were missed
            while (nextDate <= today) {
                processedCount++;

                // 1. Create the new transaction
                const newTxRef = db.collection('transactions').doc();
                const newDateStr = nextDate.toISOString().split('T')[0];

                batch.set(newTxRef, {
                    ...data,
                    date: newDateStr,
                    lastProcessedDate: newDateStr, // Important: set this to current cycle date
                    createdAt: new Date().toISOString()
                });

                // 2. Adjust wallet if exists
                if (data.walletId) {
                    const walletRef = db.collection('wallets').doc(data.walletId);
                    const admin = await import('firebase-admin');
                    const shift = data.type === 'income' ? data.amount : -data.amount;
                    batch.update(walletRef, { balance: admin.firestore.FieldValue.increment(shift) });
                }

                if (data.type === 'income') {
                    incomeToAutoBudget += data.amount;
                }

                // Step forward to next period
                lastDate = new Date(nextDate);
                if (data.recurringType === 'monthly') {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                } else if (data.recurringType === 'weekly') {
                    nextDate.setDate(nextDate.getDate() + 7);
                } else if (data.recurringType === 'yearly') {
                    nextDate.setFullYear(nextDate.getFullYear() + 1);
                }
            }

            // Update the master recurring template's lastProcessedDate so we don't process it again
            if (lastDate.getTime() !== new Date(data.lastProcessedDate).getTime()) {
                batch.update(doc.ref, {
                    lastProcessedDate: lastDate.toISOString().split('T')[0]
                });
            }
        }

        if (processedCount > 0) {
            await batch.commit();

            // Generate budgets if needed
            if (incomeToAutoBudget > 0) {
                const currentMonthStr = today.toISOString().substring(0, 7);
                await autoGenerateBudgets(uid, incomeToAutoBudget, currentMonthStr);
            }
        }

        res.status(200).json({ processed: processedCount, message: `Processed ${processedCount} recurring transactions.` });

    } catch (error) {
        console.error('Error processing recurring transactions:', error);
        res.status(500).json({ error: 'Failed to process recurring transactions' });
    }
});

export default router;
