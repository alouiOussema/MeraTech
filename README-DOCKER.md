# Docker Deployment Guide for Esprit Hack Assistant

This guide explains how to containerize and run the backend NLU service using Docker.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

## Setup

1. **Environment Variables**:
   Ensure you have a `.env` file in the root or `backend/` directory, or export the variables in your shell.
   Required variables:
   - `MONGODB_URI`: Your MongoDB connection string (Atlas or local).
   - `OPENROUTER_API_KEY`: Key for LLM fallback (optional if using local LinTO model).

## Running with Docker Compose (Recommended)

1. Open a terminal in the project root.
2. Run the following command to build and start the backend:

   ```bash
   docker-compose up --build
   ```

3. The service will start on `http://localhost:4000`.

## Running Manually (Docker CLI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Build the image:
   ```bash
   docker build -t esprit-backend .
   ```

3. Run the container:
   ```bash
   docker run -p 4000:4000 -e MONGODB_URI="your_mongo_uri" esprit-backend
   ```

## Architecture Notes

- **LinTO Service**: The backend is configured to use a local "Tunisian NLU Model" (simulated via `tunisian_nlu_model.json`). If you wish to use a real LinTO API, set the `LINTO_NLU_URL` environment variable in `docker-compose.yml`.
- **Frontend**: The frontend is currently running locally via Vite (`npm run dev`). For a full production deployment, you would build the frontend (`npm run build`) and serve it using Nginx or a static host.

## Troubleshooting

- **Database Connection**: If running MongoDB locally in another container, use `mongodb://mongo:27017/...` instead of `localhost`.
- **Microphone Issues**: Ensure you are accessing the frontend via `localhost` or `https`. Docker does not affect the browser's ability to access the microphone, as the frontend runs on your machine.
