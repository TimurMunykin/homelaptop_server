# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a homeserver management system with a Telegram bot interface that provides monitoring and control capabilities for various services including qBittorrent, Jackett, and Matrix server.

## Development Commands

**Working Directory:** `telegram-bot/`

### Core Commands
- `npm run dev` - Start development server with hot reload (ts-node)
- `npm run watch` - Start with file watching
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production build
- `npm install` - Install dependencies

### Bot Management Scripts
- `npm run bot:start` or `./scripts/start.sh` - Start bot in development mode
- `npm run bot:stop` or `./scripts/stop.sh` - Stop the bot
- `npm run bot:restart` or `./scripts/restart.sh` - Restart the bot
- `npm run bot:status` or `./scripts/status.sh` - Check bot status
- `npm run bot:logs` or `./scripts/logs.sh` - View bot logs

### Docker Commands

**First-time setup:**
- `./init.sh` - Initialize configs and directories
- `docker compose up -d` - Start all services

**Regular usage:**
- `docker compose logs -f telegram-bot` - View Docker logs
- `docker compose down` - Stop all containers
- `docker compose restart` - Restart all services

## Architecture

### Core Components

**Main Bot Logic:** `src/bot.ts`
- Telegraf-based bot with command routing
- Middleware for chat ID authorization
- Error handling and process management

**Configuration:** `src/config.ts`
- Environment-based configuration using dotenv
- Service URLs and credentials management
- Chat ID validation system

**Service Integrations:** `src/services/`
- `qbittorrent.ts` - qBittorrent Web API integration
- `jackett.ts` - Jackett torrent search API
- `matrix.ts` - Matrix homeserver API integration

**Commands:** `src/commands/`
- Each command is a separate class with `execute()` method
- Commands: status, torrents, search, system, trackers, filmru
- All commands check authorization via middleware

### Security Model
- Chat ID-based access control via `ALLOWED_CHAT_IDS`
- All API calls have 10-second timeouts
- Environment variable isolation for credentials
- Non-root Docker container execution

### Configuration Requirements
- `.env` file must exist (copy from `.env.example`)
- `BOT_TOKEN` is required from @BotFather
- `ALLOWED_CHAT_IDS` should be comma-separated chat IDs
- Service URLs default to local network (192.168.31.36)

## TypeScript Configuration

- Target: ES2022
- Strict mode enabled
- Output directory: `dist/`
- Source maps and declarations enabled
- CommonJS modules

## Development Workflow

1. Copy `.env.example` to `.env` and configure
2. Install dependencies: `npm install`
3. Start development: `npm run dev` or `./scripts/start.sh`
4. Bot commands are tested via Telegram interface
5. Logs appear in console with timestamps

## Service Integration Notes

- **qBittorrent**: Uses session-based authentication with cookies
- **Jackett**: API key-based authentication, searches all configured indexers
- **Matrix**: Access token-based API, admin endpoints for statistics
- All services are optional - bot gracefully handles offline services

## Key Files to Understand
- `src/types.ts` - Core TypeScript interfaces
- `src/config.ts` - Configuration and validation logic
- `src/bot.ts:35-54` - Authorization middleware
- `src/services/` - External API integration patterns