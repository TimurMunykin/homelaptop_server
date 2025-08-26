#!/bin/bash
# Stop Telegram Bot

echo "🛑 Stopping Telegram Bot..."

# Kill by process name
pkill -f "ts-node src/bot.ts"

# Kill by npm script
pkill -f "npm run dev"

# Also kill any node processes running the bot
pkill -f "homeserver-telegram-bot"

echo "✅ Bot stopped"