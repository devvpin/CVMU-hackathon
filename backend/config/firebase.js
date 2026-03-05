import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let app;
let db;
let auth;

try {
    // Check if service account exists locally
    const serviceAccountPath = path.resolve('./serviceAccountKey.json');

    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
        app = initializeApp({
            credential: cert(serviceAccount)
        });
        console.log('Firebase Admin initialized with service account.');
    } else {
        console.warn('serviceAccountKey.json not found. To use Firebase Admin, provide this file locally or use environment variables.');
        // Initialize without credentials (might fail if not using emulator)
        app = initializeApp();
    }

    db = getFirestore(app);
    auth = getAuth(app);
} catch (error) {
    console.error('Firebase Admin initialization error:', error);
}

export { db, auth };
