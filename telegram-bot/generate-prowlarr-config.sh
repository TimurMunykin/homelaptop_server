#!/bin/sh
# Generate Prowlarr config with random API key

# Generate random API key (32 chars hex)
API_KEY=$(head -c16 /dev/urandom | xxd -p -c16)

CONFIG_DIR="./data/prowlarr/config"
CONFIG_FILE="$CONFIG_DIR/config.xml"

# Create config directory if it doesn't exist
mkdir -p "$CONFIG_DIR"

# Create config.xml with dynamic API key
cat > "$CONFIG_FILE" << EOF
<Config>
  <BindAddress>*</BindAddress>
  <Port>9696</Port>
  <SslPort>6969</SslPort>
  <EnableSsl>False</EnableSsl>
  <LaunchBrowser>True</LaunchBrowser>
  <ApiKey>$API_KEY</ApiKey>
  <AuthenticationMethod>External</AuthenticationMethod>
  <AuthenticationRequired>DisabledForLocalAddresses</AuthenticationRequired>
  <Branch>master</Branch>
  <LogLevel>info</LogLevel>
  <SslCertPath></SslCertPath>
  <SslCertPassword></SslCertPassword>
  <UrlBase></UrlBase>
  <InstanceName>Prowlarr</InstanceName>
  <UpdateMechanism>Docker</UpdateMechanism>
</Config>
EOF

# Save API key to env file for other services to use
echo "PROWLARR_API_KEY=$API_KEY" > prowlarr.env

echo "✅ Generated Prowlarr config with API key: $API_KEY"
echo "📄 Config saved to: $CONFIG_FILE"
echo "🔑 API key saved to: prowlarr.env"