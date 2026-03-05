import express from 'express';
import { db } from '../config/firebase.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);

// Get budgets for a user
router.get('/', async (req, res) => {
    try {
        const { uid } = req.user;
        const snapshot = await db.collection('budgets').where('userId', '==', uid).get();

        if (snapshot.empty) {
            return res.status(200).json([]);
        }

        let budgets = [];
        snapshot.forEach(doc => {
            budgets.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).json(budgets);
    } catch (error) {
        console.error('Error fetching budgets:', error);
        res.status(500).json({ error: 'Failed to fetch budgets' });
    }
});

// Set or update a budget
router.post('/', async (req, res) => {
    try {
        const { uid } = req.user;
        const { category, amount, month } = req.body;

        if (!category || !amount || !month) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if budget already exists for category and month
        const snapshot = await db.collection('budgets')
            .where('userId', '==', uid)
            .where('category', '==', category)
            .where('month', '==', month)
            .get();

        if (!snapshot.empty) {
            // Update existing budget
            const docId = snapshot.docs[0].id;
            await db.collection('budgets').doc(docId).update({ amount: Number(amount) });
            return res.status(200).json({ id: docId, category, amount: Number(amount), month, userId: uid });
        }

        // Create new budget
        const newBudget = {
            userId: uid,
            category,
            amount: Number(amount),
            month, // YYYY-MM format
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('budgets').add(newBudget);
        res.status(201).json({ id: docRef.id, ...newBudget });
    } catch (error) {
        console.error('Error setting budget:', error);
        res.status(500).json({ error: 'Failed to set budget' });
    }
});

// Delete a budget
router.delete('/:id', async (req, res) => {
    try {
        const { uid } = req.user;
        const { id } = req.params;

        const docRef = db.collection('budgets').doc(id);
        const doc = await docRef.get();

        if (!doc.exists || doc.data().userId !== uid) {
            return res.status(404).json({ error: 'Budget not found or unauthorized' });
        }

        await docRef.delete();
        res.status(200).json({ message: 'Budget deleted successfully' });
    } catch (error) {
        console.error('Error deleting budget:', error);
        res.status(500).json({ error: 'Failed to delete budget' });
    }
});

export default router;
