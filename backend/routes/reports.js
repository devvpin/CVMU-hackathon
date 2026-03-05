import express from 'express';
import { db } from '../config/firebase.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);

// Get summary report for a user (total income, total expense, balance)
router.get('/summary', async (req, res) => {
    try {
        const { uid } = req.user;

        // Optional query parameters for filtering by date
        const { month } = req.query; // e.g., '2023-10'

        let transactionsRef = db.collection('transactions').where('userId', '==', uid);

        // Simplistic monthly filtering: string startsWith equivalent in firestore or get all and filter in memory
        const snapshot = await transactionsRef.get();

        let totalIncome = 0;
        let totalExpense = 0;

        // Aggregate by category for expenses
        const categoryBreakdown = {};

        snapshot.forEach(doc => {
            const data = doc.data();

            if (month && !data.date.startsWith(month)) {
                return; // Skip if not matching requested month
            }

            const amount = data.amount;
            if (data.type === 'income') {
                totalIncome += amount;
            } else if (data.type === 'expense') {
                totalExpense += amount;

                if (categoryBreakdown[data.category]) {
                    categoryBreakdown[data.category] += amount;
                } else {
                    categoryBreakdown[data.category] = amount;
                }
            }
        });

        res.status(200).json({
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            categoryBreakdown
        });
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Failed to generate report summary' });
    }
});

export default router;
