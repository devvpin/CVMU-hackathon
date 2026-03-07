# 💰 BudgetPilot — Personal Finance Manager  
### CVMU Hackathon Project

**BudgetPilot** is a full-stack personal finance management application that helps users **track expenses, manage multiple wallets, set budgets, and receive AI-powered financial insights**.

The system supports **web and mobile platforms**, allowing users to manage their finances anywhere and make smarter financial decisions.

---

# 🚀 Project Overview

BudgetPilot provides a complete solution for managing personal finances with features such as:

- Expense and income tracking  
- Multiple wallet management  
- Budget monitoring  
- Bill splitting with friends  
- AI-powered financial guidance  
- Financial reports and analytics
- notification for reminders and limit message  

The application uses **Firebase services for authentication and database storage** to ensure secure and scalable data management.

---

# 🏗️ System Architecture

| Layer | Technology |
|------|-------------|
| Frontend | React + Vite |
| Backend | Express.js |
| Database | Firebase Firestore |
| Authentication | Firebase Authentication |
| AI Integration | Google Gemini API |
| Mobile App | web based app |

---

# ✨ Features

## 🔐 Authentication
- Secure user registration and login  
- Email & password authentication  
- Password recovery  

---

## 📊 Dashboard
Provides a quick overview of the user's financial status:

- Total balance
- Monthly expenses
- Budget progress
- Recent transactions

---

## 👛 Wallet Management
Users can create and manage **multiple wallets** such as:

- Cash  
- Bank Account  
- UPI  
- Credit Card  
- Savings Wallet  

---

## 💳 Transaction Tracking
- Add income and expense transactions  
- Categorize spending  
- View transaction history  
- Filter by wallet, category, or date  

---

## 🎯 Budget Management
- Set category-wise budgets  
- Monitor spending progress  
- Receive alerts when budgets are exceeded  

---

## 📈 Reports & Analytics
Users can visualize financial patterns through:

- Spending trends  
- Category-wise analysis  
- Monthly summaries  

---

## 🤝 Split Bills
Users can split shared expenses with friends.

Example:

Dinner Bill: ₹1200  
People: 3  
Each Person Pays: ₹400  

The app tracks who owes whom.

---

## 🤖 AI Financial Coach
BudgetPilot includes an **AI-powered financial assistant using Google Gemini** that provides:

- Personalized financial advice  
- Budget optimization suggestions  
- Spending insights based on transaction history  

If the AI API key is not configured, the system returns **friendly fallback responses**.

---

# 🗄️ Database (Firebase Firestore)

The application uses **Firebase Firestore** as the main database.

Firestore stores:

- User profiles  
- Wallet information  
- Transactions  
- Budget data  
- Bill splits  
- Reports  

Benefits of Firestore:

- Cloud hosted database  
- Real-time updates  
- Secure and scalable  
- Easy integration with Firebase Authentication  

---

# 🛠️ Tech Stack

## Backend
- Node.js  
- Express.js  
- Firebase Admin SDK  
- Google Gemini API  

## Frontend
- React  
- Vite  
- CSS  
- Firebase SDK  

## Mobile
- web based app 

Supported platforms:
- Android  
- iOS  
- Web  
- Windows  
- macOS  
- Linux  

---



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
