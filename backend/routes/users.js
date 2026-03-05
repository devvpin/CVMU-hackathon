import express from 'express';
import { db } from '../config/firebase.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Check if username is available (public route - no auth needed for signup)
router.get('/check-username/:username', async (req, res) => {
    try {
        const { username } = req.params;
        
        // Validate username format
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({ 
                available: false, 
                message: 'Username must be 3-20 characters, letters, numbers, and underscores only' 
            });
        }

        // Check if username exists (case-insensitive)
        const usernameDoc = await db.collection('usernames').doc(username.toLowerCase()).get();
        
        if (usernameDoc.exists) {
            return res.json({ available: false, message: 'This username is already taken' });
        }

        res.json({ available: true, message: 'Username is available!' });
    } catch (error) {
        console.error('Error checking username:', error);
        res.status(500).json({ error: 'Failed to check username availability' });
    }
});

// Create user profile (called after Firebase Auth signup)
router.post('/profile', verifyToken, async (req, res) => {
    try {
        const { uid } = req.user;
        const { 
            username, 
            firstName, 
            lastName, 
            mobile, 
            address, 
            pincode, 
            district, 
            state, 
            country,
            profilePictureURL
        } = req.body;

        // Validate required fields
        if (!username || !firstName || !lastName) {
            return res.status(400).json({ error: 'Username, first name, and last name are required' });
        }

        // Check username availability again (security measure)
        const usernameDoc = await db.collection('usernames').doc(username.toLowerCase()).get();
        if (usernameDoc.exists) {
            return res.status(400).json({ error: 'Username is already taken' });
        }

        const now = new Date().toISOString();

        // Create user profile
        const userProfile = {
            uid,
            username: username.toLowerCase(),
            displayUsername: username, // Preserve original casing for display
            firstName,
            lastName,
            mobile: mobile || '',
            address: address || '',
            pincode: pincode || '',
            district: district || '',
            state: state || '',
            country: country || '',
            profilePictureURL: profilePictureURL || '',
            createdAt: now,
            updatedAt: now,
            usernameLastChanged: now // Track when username was last changed
        };

        // Use a batch to ensure atomicity
        const batch = db.batch();

        // Save user profile
        const userRef = db.collection('users').doc(uid);
        batch.set(userRef, userProfile);

        // Reserve username (store the uid to prevent duplicates)
        const usernameRef = db.collection('usernames').doc(username.toLowerCase());
        batch.set(usernameRef, { uid, createdAt: now });

        await batch.commit();

        res.status(201).json({ 
            message: 'Profile created successfully!', 
            profile: userProfile 
        });
    } catch (error) {
        console.error('Error creating profile:', error);
        res.status(500).json({ error: 'Failed to create profile' });
    }
});

// Get current user's profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const { uid } = req.user;
        const userDoc = await db.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json(userDoc.data());
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update username (once per year limit)
router.patch('/username', verifyToken, async (req, res) => {
    try {
        const { uid } = req.user;
        const { newUsername } = req.body;

        if (!newUsername) {
            return res.status(400).json({ error: 'New username is required' });
        }

        // Validate username format
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(newUsername)) {
            return res.status(400).json({ 
                error: 'Username must be 3-20 characters, letters, numbers, and underscores only' 
            });
        }

        // Get current user profile
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        const userData = userDoc.data();
        const lastChanged = new Date(userData.usernameLastChanged);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        // Check if user can change username (once per year)
        if (lastChanged > oneYearAgo) {
            const nextChangeDate = new Date(lastChanged);
            nextChangeDate.setFullYear(nextChangeDate.getFullYear() + 1);
            return res.status(400).json({ 
                error: `You can change your username again on ${nextChangeDate.toLocaleDateString()}`,
                canChangeOn: nextChangeDate.toISOString()
            });
        }

        // Check if new username is available
        const newUsernameDoc = await db.collection('usernames').doc(newUsername.toLowerCase()).get();
        if (newUsernameDoc.exists) {
            return res.status(400).json({ error: 'This username is already taken' });
        }

        const now = new Date().toISOString();
        const oldUsername = userData.username;

        // Use batch for atomicity
        const batch = db.batch();

        // Update user profile
        const userRef = db.collection('users').doc(uid);
        batch.update(userRef, {
            username: newUsername.toLowerCase(),
            displayUsername: newUsername,
            usernameLastChanged: now,
            updatedAt: now
        });

        // Release old username
        const oldUsernameRef = db.collection('usernames').doc(oldUsername);
        batch.delete(oldUsernameRef);

        // Reserve new username
        const newUsernameRef = db.collection('usernames').doc(newUsername.toLowerCase());
        batch.set(newUsernameRef, { uid, createdAt: now });

        await batch.commit();

        res.json({ 
            message: 'Username updated successfully!', 
            username: newUsername 
        });
    } catch (error) {
        console.error('Error updating username:', error);
        res.status(500).json({ error: 'Failed to update username' });
    }
});

// Update user profile details
router.patch('/profile', verifyToken, async (req, res) => {
    try {
        const { uid } = req.user;
        const { 
            firstName, 
            lastName, 
            mobile, 
            address, 
            pincode, 
            district, 
            state, 
            country,
            profilePictureURL
        } = req.body;

        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        const now = new Date().toISOString();

        const updateData = {
            updatedAt: now
        };

        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (mobile !== undefined) updateData.mobile = mobile;
        if (address !== undefined) updateData.address = address;
        if (pincode !== undefined) updateData.pincode = pincode;
        if (district !== undefined) updateData.district = district;
        if (state !== undefined) updateData.state = state;
        if (country !== undefined) updateData.country = country;
        if (profilePictureURL !== undefined) updateData.profilePictureURL = profilePictureURL;

        await db.collection('users').doc(uid).update(updateData);

        res.json({ 
            message: 'Profile updated successfully!',
            profile: { ...userDoc.data(), ...updateData }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

export default router;
