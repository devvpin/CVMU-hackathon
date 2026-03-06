import express from 'express';
import { db } from '../config/firebase.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);

// Get all wallets for a user
router.get('/', async (req, res) => {
    try {
        const { uid } = req.user;
        const walletsRef = db.collection('wallets').where('userId', '==', uid);
        const snapshot = await walletsRef.get();

        if (snapshot.empty) {
            return res.status(200).json([]);
        }

        let wallets = [];
        snapshot.forEach(doc => {
            wallets.push({ id: doc.id, ...doc.data() });
        });

        // Sort by name
        wallets.sort((a, b) => a.name.localeCompare(b.name));

        res.status(200).json(wallets);
    } catch (error) {
        console.error('Error fetching wallets:', error);
        res.status(500).json({ error: 'Failed to fetch wallets' });
    }
});

// Add a new wallet
router.post('/', async (req, res) => {
    try {
        const { uid } = req.user;
        const { name, type, balance } = req.body;

        if (!name || type === undefined || balance === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newWallet = {
            userId: uid,
            name,
            type, // 'bank', 'credit_card', 'gpay', 'cash', etc.
            balance: Number(balance),
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('wallets').add(newWallet);
        res.status(201).json({ id: docRef.id, ...newWallet });
    } catch (error) {
        console.error('Error adding wallet:', error);
        res.status(500).json({ error: 'Failed to add wallet' });
    }
});

// Update a wallet
router.put('/:id', async (req, res) => {
    try {
        const { uid } = req.user;
        const { id } = req.params;
        const updateData = req.body;

        const docRef = db.collection('wallets').doc(id);
        const doc = await docRef.get();

        if (!doc.exists || doc.data().userId !== uid) {
            return res.status(404).json({ error: 'Wallet not found or unauthorized' });
        }

        // prevent updating userId
        if (updateData.userId) delete updateData.userId;

        // convert balance to number if present
        if (updateData.balance !== undefined) {
            updateData.balance = Number(updateData.balance);
        }

        await docRef.update(updateData);
        res.status(200).json({ id, ...doc.data(), ...updateData });
    } catch (error) {
        console.error('Error updating wallet:', error);
        res.status(500).json({ error: 'Failed to update wallet' });
    }
});

// Delete a wallet
router.delete('/:id', async (req, res) => {
    try {
        const { uid } = req.user;
        const { id } = req.params;

        const docRef = db.collection('wallets').doc(id);
        const doc = await docRef.get();

        if (!doc.exists || doc.data().userId !== uid) {
            return res.status(404).json({ error: 'Wallet not found or unauthorized' });
        }

        await docRef.delete();
        res.status(200).json({ message: 'Wallet deleted successfully' });
    } catch (error) {
        console.error('Error deleting wallet:', error);
        res.status(500).json({ error: 'Failed to delete wallet' });
    }
});

// Transfer money between wallets
router.post('/transfer', async (req, res) => {
    try {
        const { uid } = req.user;
        const { fromWalletId, toWalletId, amount, date, note } = req.body;

        if (!fromWalletId || !toWalletId || !amount || !date) {
            return res.status(400).json({ error: 'Missing required fields for transfer' });
        }

        const transferAmount = Number(amount);
        if (transferAmount <= 0) {
            return res.status(400).json({ error: 'Transfer amount must be positive' });
        }

        // Get both wallets to verify ownership and existence
        const fromWalletRef = db.collection('wallets').doc(fromWalletId);
        const toWalletRef = db.collection('wallets').doc(toWalletId);

        const [fromDoc, toDoc] = await Promise.all([fromWalletRef.get(), toWalletRef.get()]);

        if (!fromDoc.exists || fromDoc.data().userId !== uid || !toDoc.exists || toDoc.data().userId !== uid) {
            return res.status(404).json({ error: 'One or both wallets not found or unauthorized' });
        }

        const fromBalance = fromDoc.data().balance || 0;
        const toBalance = toDoc.data().balance || 0;

        // We use a batched write to ensure atomicity
        const batch = db.batch();

        // 1. Update Wallet Balances
        batch.update(fromWalletRef, { balance: fromBalance - transferAmount });
        batch.update(toWalletRef, { balance: toBalance + transferAmount });

        // 2. Create the Expense Transaction (from wallet)
        const expenseRef = db.collection('transactions').doc();
        batch.set(expenseRef, {
            userId: uid,
            type: 'expense',
            amount: transferAmount,
            category: 'Transfer',
            subcategory: 'Wallet Transfer',
            note: note || `Transfer to ${toDoc.data().name}`,
            date,
            walletId: fromWalletId,
            createdAt: new Date().toISOString()
        });

        // 3. Create the Income Transaction (to wallet)
        const incomeRef = db.collection('transactions').doc();
        batch.set(incomeRef, {
            userId: uid,
            type: 'income',
            amount: transferAmount,
            category: 'Transfer',
            subcategory: 'Wallet Transfer',
            note: note || `Transfer from ${fromDoc.data().name}`,
            date,
            walletId: toWalletId,
            createdAt: new Date().toISOString()
        });

        await batch.commit();

        res.status(200).json({ message: 'Transfer successful' });
    } catch (error) {
        console.error('Error transferring funds:', error);
        res.status(500).json({ error: 'Failed to transfer funds' });
    }
});

export default router;
