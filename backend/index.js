import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { verifyToken } from './middleware/auth.js';

// Load .env from project root (parent of backend/)
const __filename_env = fileURLToPath(import.meta.url);
const __dirname_env = path.dirname(__filename_env);
dotenv.config({ path: path.resolve(__dirname_env, '../.env') });

const app = express();

app.use(cors());
app.use(express.json());

import transactionsRouter from './routes/transactions.js';
import budgetsRouter from './routes/budgets.js';
import reportsRouter from './routes/reports.js';
import aiRouter from './routes/ai.js';
import usersRouter from './routes/users.js';
import walletsRouter from './routes/wallets.js';
app.use('/api/transactions', transactionsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/users', usersRouter);
app.use('/api/wallets', walletsRouter);

// Routes will be mounted here
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Expense Tracker Backend is running' });
});

// Protected route example
app.get('/api/protected', verifyToken, (req, res) => {
    res.status(200).json({ message: `Access granted for user ${req.user.uid}` });
});

const PORT = process.env.PORT || 5000;

/**
 * Serve the built web frontend in production.
 * `npm run build` in `frontend/` creates `frontend/dist`.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, '../frontend/dist');

// Only serve static assets if the build output exists
if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));

    // SPA fallback (so direct navigation to /reports, /ai, etc works)
    app.get('*', (req, res) => {
        // Do not hijack API routes
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ error: 'Not found' });
        }
        return res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
} else {
    console.warn(`Frontend build not found at ${frontendDistPath}. Run frontend build to serve the web app.`);
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT} (accessible on local network)`);
});
