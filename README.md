# MoneyMate (CVMU Hackathon) — Web App

This repository contains a **full-stack web app**:
- **Frontend**: React + Vite (`frontend/`)
- **Backend**: Express API + Firebase Admin (`backend/`)

The backend can also **serve the production frontend build** (`frontend/dist`) so you can deploy as **one web app**.

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


