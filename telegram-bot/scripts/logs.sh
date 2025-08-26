#!/bin/bash
# Show Bot Logs

cd "$(dirname "$0")/.."

echo "📋 Bot Logs (last 50 lines):"
echo "================================"

# Try to find logs in different places
if [ -f "logs/bot.log" ]; then
    tail -f logs/bot.log
elif [ -f "bot.log" ]; then
    tail -f bot.log
else
    echo "No log files found. Running in foreground mode."
    echo "Use 'npm run dev' to see live logs."
fi