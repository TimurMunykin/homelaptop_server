#!/bin/sh
apk add --no-cache curl jq
sleep 30
echo "🔧 Setting up Prowlarr indexers..."

PROWLARR_URL="http://localhost:9696"

# Get API key from config file
API_KEY=$(grep -o '<ApiKey>[^<]*</ApiKey>' /config/config.xml | sed 's/<ApiKey>\|<\/ApiKey>//g')
if [ -z "$API_KEY" ]; then
  echo "❌ Could not find API key in config"
  exit 1
fi
echo "🔑 Using API key: $API_KEY"

# Wait for Prowlarr to be ready
for i in $(seq 1 30); do
  if curl -s "$PROWLARR_URL/api/v1/system/status" -H "X-Api-Key: $API_KEY" > /dev/null 2>&1; then
    echo "✅ Prowlarr is ready!"
    break
  fi
  echo "   Attempt $i/30..."
  sleep 2
done

# Get available indexer definitions
echo "🔍 Getting available indexers..."

# Add popular public indexers that work reliably
indexers_to_add="thepiratebay eztv limetorrents torlock"

for indexer in $indexers_to_add; do
  echo "📥 Adding $indexer..."
  
  # Add indexer using simple POST request
  result=$(curl -s -X POST "$PROWLARR_URL/api/v1/indexer" \
    -H "X-Api-Key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"definitionName\": \"$indexer\",
      \"name\": \"$(echo $indexer | sed 's/.*/\u&/')\" ,
      \"enable\": true,
      \"implementation\": \"Cardigann\",
      \"configContract\": \"CardigannSettings\",
      \"priority\": 25,
      \"appProfileId\": 1,
      \"fields\": [
        {\"name\": \"definitionFile\", \"value\": \"$indexer\"}
      ]
    }" 2>/dev/null)
  
  # Check if it was successful by looking for "name" field in response
  if echo "$result" | grep -q '"name"'; then
    echo "   ✅ $indexer added successfully"
  elif echo "$result" | grep -q "already exists"; then
    echo "   ⚠️ $indexer already exists"
  else
    echo "   ⚠️ $indexer failed to add"
  fi
  
  sleep 2
done

# List configured indexers
echo "📋 Configured indexers:"
curl -s "$PROWLARR_URL/api/v1/indexer" -H "X-Api-Key: $API_KEY" 2>/dev/null | jq -r '.[].name' 2>/dev/null || echo "Unable to list indexers"

echo "✅ Prowlarr setup complete!"