# IBSAR Inclusive Platform

## Structure

- `/client`: React Frontend (Vite + Tailwind)
- `/backend`: Node/Express API (MongoDB + JWT)

## Prerequisites

- Node.js
- MongoDB URI

## Setup

### 1. Backend

```bash
cd backend
npm install
# Create .env file based on instructions
npm run seed # (Optional) Seed database
npm start
```

Backend runs on `http://localhost:4000`.

### 2. Client

```bash
cd client
npm install
# Create .env file based on instructions
npm run dev
```

Client runs on `http://localhost:5173`.

## Environment Variables

### Backend (.env)

```
PORT=4000
MONGODB_URI=...
JWT_SECRET=dev_secret_key_123
CLIENT_ORIGIN=http://localhost:5173
```

### Client (.env)

```
VITE_API_URL=http://localhost:4000/api
```
