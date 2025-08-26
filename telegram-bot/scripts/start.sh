#!/bin/bash
# Start Telegram Bot

cd "$(dirname "$0")/.."

echo "🚀 Starting Telegram Bot..."

if [ -f ".env" ]; then
    npm run dev
else
    echo "❌ .env file not found. Please create it from .env.example"
    exit 1
fi