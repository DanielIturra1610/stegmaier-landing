#!/bin/sh
# Inicia el servidor FastAPI en segundo plano
cd /app/backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &

# Inicia el servidor de desarrollo de Vite
cd /app/frontend && npm run dev -- --host 0.0.0.0
