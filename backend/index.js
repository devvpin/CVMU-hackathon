import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { verifyToken } from './middleware/auth.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

import transactionsRouter from './routes/transactions.js';
import budgetsRouter from './routes/budgets.js';
import reportsRouter from './routes/reports.js';
import aiRouter from './routes/ai.js';
import usersRouter from './routes/users.js';

app.use('/api/transactions', transactionsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/users', usersRouter);

// Routes will be mounted here
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Expense Tracker Backend is running' });
});

// Protected route example
app.get('/api/protected', verifyToken, (req, res) => {
    res.status(200).json({ message: `Access granted for user ${req.user.uid}` });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
