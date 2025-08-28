#!/bin/bash
echo "🚀 Initializing portable homeserver setup..."

# Make scripts executable
chmod +x generate-prowlarr-config.sh
chmod +x setup-qbittorrent.sh
chmod +x setup-prowlarr.sh

# Generate Prowlarr config with dynamic API key
echo "📝 Generating Prowlarr configuration..."
./generate-prowlarr-config.sh

# Create necessary directories
echo "📁 Creating data directories..."
mkdir -p data/{qbittorrent/config,prowlarr/config,torrserver,downloads}
mkdir -p logs

echo "✅ Initialization complete!"
echo "🐳 You can now run: docker compose up -d"