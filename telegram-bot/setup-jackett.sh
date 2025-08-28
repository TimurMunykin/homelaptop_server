#!/bin/sh
apk add --no-cache curl jq
sleep 20
echo "🔧 Setting up Jackett indexers..."

JACKETT_URL="http://homeserver-jackett:9118"
API_KEY="containerkey123456789abcdef123456789"

# Wait for Jackett to be ready
for i in $(seq 1 30); do
  if curl -s "$JACKETT_URL/api/v2.0/server/config" -H "X-Api-Key: $API_KEY" > /dev/null 2>&1; then
    echo "✅ Jackett is ready!"
    break
  fi
  echo "   Attempt $i/30..."
  sleep 2
done

# Add popular public indexers
echo "🔍 Adding public indexers..."

# Add RuTracker (popular Russian tracker)
curl -s "$JACKETT_URL/api/v2.0/indexers/rutracker/config" \
  -H "X-Api-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"username":"","password":""}' \
  -X POST || echo "RuTracker already exists or failed"

# Add 1337x
curl -s "$JACKETT_URL/api/v2.0/indexers/1337x/config" \
  -H "X-Api-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -X POST || echo "1337x already exists or failed"

# Add RARBG
curl -s "$JACKETT_URL/api/v2.0/indexers/rarbg/config" \
  -H "X-Api-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -X POST || echo "RARBG already exists or failed"

# Add The Pirate Bay
curl -s "$JACKETT_URL/api/v2.0/indexers/thepiratebay/config" \
  -H "X-Api-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -X POST || echo "ThePirateBay already exists or failed"

# List configured indexers
echo "📋 Configured indexers:"
curl -s "$JACKETT_URL/api/v2.0/indexers" -H "X-Api-Key: $API_KEY" | jq -r '.[].title' 2>/dev/null || echo "Unable to list indexers"

echo "✅ Jackett setup complete!"