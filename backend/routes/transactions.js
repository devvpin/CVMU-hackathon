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
        const { type, amount, category, subcategory, description, note, date, recurring, recurringType } = req.body;

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
            date, // YYYY-MM-DD format
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('transactions').add(newTransaction);

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

        if (!doc.exists || doc.data().userId !== uid) {
            return res.status(404).json({ error: 'Transaction not found or unauthorized' });
        }

        await docRef.update(updateData);
        res.status(200).json({ id, ...doc.data(), ...updateData });
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

        if (!doc.exists || doc.data().userId !== uid) {
            return res.status(404).json({ error: 'Transaction not found or unauthorized' });
        }

        await docRef.delete();
        res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});

export default router;
