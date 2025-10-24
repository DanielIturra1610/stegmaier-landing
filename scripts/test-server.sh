#!/bin/bash

# Script para probar el servidor localmente

echo "🚀 Building server..."
go build -o bin/api cmd/api/main.go

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"
echo ""
echo "🔧 Starting server..."
PORT=8000 ./bin/api &
SERVER_PID=$!

# Esperar que el servidor arranque
sleep 2

echo ""
echo "📊 Testing health check endpoint..."
curl -s http://localhost:8000/health | jq .

echo ""
echo "📊 Testing API health check..."
curl -s http://localhost:8000/api/v1/health | jq .

echo ""
echo "📊 Testing root endpoint..."
curl -s http://localhost:8000/ | jq .

echo ""
echo "🛑 Stopping server..."
kill $SERVER_PID

echo "✅ Tests completed"
