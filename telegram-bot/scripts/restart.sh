#!/bin/bash
# Restart Telegram Bot

cd "$(dirname "$0")"

echo "🔄 Restarting Telegram Bot..."

# Stop the bot first
./stop.sh

# Wait a moment
sleep 2

# Start it again
./start.sh