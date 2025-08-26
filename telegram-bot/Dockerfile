FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Remove dev dependencies and source files to reduce image size
RUN npm ci --only=production && rm -rf src/ tsconfig.json

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S botuser -u 1001 -G nodejs

# Change ownership of the app directory
RUN chown -R botuser:nodejs /app
USER botuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('Bot is running')" || exit 1

EXPOSE 3000

CMD ["npm", "start"]