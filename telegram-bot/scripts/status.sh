#!/bin/bash
# Check Telegram Bot Status

echo "📊 Checking Bot Status..."

# Check if process is running
PID=$(pgrep -f "ts-node src/bot.ts")

if [ -n "$PID" ]; then
    echo "✅ Bot is running (PID: $PID)"
    
    # Show memory usage
    echo "💾 Memory usage:"
    ps -p "$PID" -o pid,ppid,pcpu,pmem,comm --no-headers
    
    # Show listening ports if any
    echo "🔌 Network connections:"
    lsof -p "$PID" -i 2>/dev/null || echo "No network connections found"
else
    echo "❌ Bot is not running"
fi