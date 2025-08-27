#!/bin/sh
apk add --no-cache curl docker-cli
sleep 15
echo "🔧 Setting up qBittorrent..."

# Wait for qBittorrent
for i in $(seq 1 30); do
  if curl -s http://localhost:8082 > /dev/null 2>&1; then
    echo "✅ qBittorrent is ready!"
    break
  fi
  echo "   Attempt $i/30..."
  sleep 2
done

# Get password from docker logs
TEMP_PASSWORD=$(docker logs fresh-qbittorrent 2>&1 | grep "temporary password" | tail -1 | sed 's/.*: //')
echo "🔑 Using password: $TEMP_PASSWORD"

# Configure qBittorrent
curl -c /tmp/cookies.txt \
  -H "Referer: http://localhost:8082" \
  -d "username=admin&password=$TEMP_PASSWORD" \
  -X POST http://localhost:8082/api/v2/auth/login

curl -b /tmp/cookies.txt \
  -H "Referer: http://localhost:8082" \
  -d 'json={"bypass_auth_subnet_whitelist_enabled":true,"bypass_auth_subnet_whitelist":"0.0.0.0/0"}' \
  -X POST http://localhost:8082/api/v2/app/setPreferences

sleep 3
VERSION=$(curl -s http://localhost:8082/api/v2/app/version)
echo "✅ qBittorrent v$VERSION ready without authentication!"