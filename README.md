# BudgetPilot (CVMU Hackathon) — Web App

BudgetPilot is a comprehensive personal finance management application that helps users track, manage, and optimize their finances across web and mobile platforms.

This repository contains a **full-stack web app**:
- **Frontend**: React + Vite (`frontend/`)
- **Backend**: Express API + Firebase Admin (`backend/`)
- **Mobile**: Flutter cross-platform application (`mobile/`)

The backend can also **serve the production frontend build** (`frontend/dist`) so you can deploy as **one web app**.

## ✨ Features

### Core Functionality
- **Authentication** — Secure user registration and login with email/password and password recovery
- **Dashboard** — Overview of financial health with key metrics and insights
- **Wallet Management** — Create and manage multiple wallets for different accounts or purposes
- **Transaction Tracking** — Log and categorize expenses and income transactions
- **Budget Management** — Set budgets for different categories and monitor spending
- **Reports & Analytics** — Visualize spending patterns and financial trends
- **Split Bills** — Easily split and track shared expenses with friends
- **User Profiles** — Manage account settings and personal information

### AI-Powered Features
- **AI Coach** — Get personalized financial advice and spending recommendations powered by Google Gemini
- Smart insights and suggestions for budget optimization

## Run in development

### Backend
1. Copy `backend/ENV.example` to `backend/.env` and fill values if needed.
2. Ensure you have `backend/serviceAccountKey.json` locally (not committed) for Firebase Admin.

Run:

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://127.0.0.1:5000`.

### Frontend
1. Copy `frontend/ENV.example` to `frontend/.env` and set Firebase values (recommended).

Run:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on Vite (default `http://127.0.0.1:5173`, or next free port).

**Dev API setup**:
- The frontend calls the API at **`/api/...`**
- Vite proxies `/api` to `http://127.0.0.1:5000` (see `frontend/vite.config.js`)

## Build & run as a single production web app

1. Build the frontend:

```bash
cd frontend
npm run build
```

2. Start the backend (it will serve `frontend/dist` + `/api`):

```bash
cd ../backend
npm start
```

Open the app at `http://127.0.0.1:5000`.

## Environment variables

- **Frontend**: see `frontend/ENV.example`
  - Optional: `VITE_API_BASE_URL` (defaults to `/api`)
  - Firebase: `VITE_FIREBASE_*`
- **Backend**: see `backend/ENV.example`
  - Optional: `PORT`
  - Optional: `GEMINI_API_KEY` for AI endpoints

## Notes
- `backend/serviceAccountKey.json` is **ignored** by git and should never be committed.
- AI endpoints work even without `GEMINI_API_KEY` (they return friendly fallback messages).

## Tech Stack

### Backend
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **AI Integration**: Google Gemini API

### Frontend
- **Framework**: React with Vite
- **Styling**: CSS
- **Build Tool**: Vite
- **Authentication**: Firebase SDK

### Mobile
- **Framework**: Flutter
- **Target Platforms**: Android, iOS, Web, Windows, macOS, Linux
- **Backend**: Same Express API as web client

## Project Structure

```
CVMU-hackathon/
├── backend/           # Express API server
│   ├── config/        # Firebase configuration
│   ├── middleware/    # Auth middleware
│   └── routes/        # API endpoints (users, wallets, transactions, budgets, reports, AI)
├── frontend/          # React web application
│   ├── src/
│   │   ├── pages/     # Page components (Dashboard, Budgets, Transactions, etc.)
│   │   ├── components/# Reusable UI components
│   │   ├── context/   # Theme and state management
│   │   └── utils/     # Helper functions
│   └── public/        # Static assets
└── mobile/            # Flutter application
    ├── lib/           # Dart source code
    ├── android/       # Android-specific configuration
    ├── ios/           # iOS-specific configuration
    └── web/           # Web-specific configuration
```
