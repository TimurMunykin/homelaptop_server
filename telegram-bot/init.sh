#!/bin/bash
echo "🚀 Initializing portable homeserver setup..."

# Make scripts executable
chmod +x generate-prowlarr-config.sh
chmod +x setup-qbittorrent.sh
chmod +x setup-prowlarr.sh

# Generate Prowlarr config with dynamic API key
echo "📝 Generating Prowlarr configuration..."
./generate-prowlarr-config.sh

# Update .env file with new Prowlarr API key
if [ -f prowlarr.env ] && [ -f .env ]; then
    echo "🔧 Updating .env with new Prowlarr API key..."
    PROWLARR_API_KEY=$(grep PROWLARR_API_KEY prowlarr.env | cut -d'=' -f2)
    sed -i "s/PROWLARR_API_KEY=.*/PROWLARR_API_KEY=$PROWLARR_API_KEY/" .env
    echo "✅ Updated PROWLARR_API_KEY in .env file"
fi

# Create necessary directories
echo "📁 Creating data directories..."
mkdir -p data/{qbittorrent/config,prowlarr/config,torrserver,downloads}
mkdir -p logs

echo "✅ Initialization complete!"
echo "🐳 You can now run: docker compose up -d"