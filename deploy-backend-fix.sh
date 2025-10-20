#!/bin/bash
# Script para corregir y deployar backend a Railway

echo "🔧 FIXING BACKEND FOR RAILWAY DEPLOYMENT"
echo "========================================"

echo "✅ Fixes applied:"
echo "1. Removed problematic imports in main.py"
echo "2. Fixed database configuration import"
echo "3. Added basic health endpoint"
echo "4. Created railway.json with proper config"
echo "5. Added missing __init__.py files"

echo ""
echo "📤 Committing and pushing fixes..."

# Add all changes
git add .

# Commit with descriptive message
git commit -m "fix(backend): correct import errors and add Railway config

- Remove non-existent middleware imports from main.py
- Fix database settings import to use get_settings()
- Add basic /health endpoint for Railway healthcheck
- Create backend-specific railway.json
- Add missing __init__.py files
- Simplify FastAPI configuration for initial deployment"

# Push to trigger Railway deployment
git push origin main

echo ""
echo "🚀 Changes pushed! Railway should start a new deployment."
echo "📊 Monitor deployment at: https://railway.app/"
echo ""
echo "🔍 Expected fixes:"
echo "- Import errors resolved"
echo "- Health endpoint available at /health"
echo "- Proper uvicorn startup command"
echo "- Increased healthcheck timeout to 300s"