#!/bin/sh
# Inicia el servidor FastAPI en segundo plano
cd /app && python -m uvicorn src.api.contact:app --host 0.0.0.0 --port 8000 --reload &

# Inicia el servidor de desarrollo de Vite
cd /app && npm run dev -- --host 0.0.0.0
