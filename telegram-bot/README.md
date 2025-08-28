# HomeServer Telegram Bot

Quick setup guide for portable homeserver management bot.

## 1. Create Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) in Telegram
2. Send `/newbot`
3. Follow prompts to create bot
4. Copy the **BOT_TOKEN**

## 2. Setup

```bash
# Clone repository
git clone <repository-url>
cd telegram-bot

# Copy and edit config
cp .env.example .env
nano .env  # Add your BOT_TOKEN

# Initialize services
chmod +x init.sh
./init.sh

# Start all services
docker compose up -d
```

## 3. Get Chat ID

1. Start your bot in Telegram
2. Send `/chatid` command to bot
3. Copy the **Chat ID** number
4. Add it to `.env` file: `ALLOWED_CHAT_IDS=your_chat_id`
5. Restart bot: `docker compose restart telegram-bot`

## 4. Available Commands

- `/status` - Services status
- `/search <query>` - Search torrents
- `/trackers` - Show indexers
- `/torrents` - Active downloads
- `/system` - System info
- `/chatid` - Get your chat ID

## Services

- **qBittorrent**: http://localhost:8081 (admin/adminpass)
- **Prowlarr**: http://localhost:9696 (API key auto-generated)
- **TorrServer**: http://localhost:8090

All services are configured automatically with init script.

### Разработка (локальная установка)

```bash
# Установить зависимости
npm install

# Запуск в режиме разработки
npm run dev

# Сборка
npm run build
npm start
```

### Управление Docker Compose

```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f telegram-bot
docker-compose logs -f qbittorrent
docker-compose logs -f jackett

# Остановка
docker-compose down

# Обновление образов
docker-compose pull
docker-compose up -d
```

## Безопасность

- Бот проверяет `ALLOWED_CHAT_IDS` перед выполнением команд
- Все ошибки логируются
- Timeout для HTTP запросов к сервисам
- Non-root пользователь в Docker контейнере

## Структура проекта

```
src/
├── bot.ts              # Основная логика бота
├── config.ts           # Конфигурация
├── types.ts            # TypeScript типы
├── services/           # Интеграции с сервисами
│   ├── qbittorrent.ts
│   ├── jackett.ts
│   └── matrix.ts
├── commands/           # Команды бота
│   ├── status.ts
│   ├── torrents.ts
│   ├── search.ts
│   └── system.ts
└── utils/
    └── system.ts       # Системные утилиты
```

## API интеграции

### qBittorrent Web API
- Статус сервиса и версия
- Список активных торрентов
- Скорость загрузки/раздачи

### Jackett API
- Поиск торрентов по всем индексаторам
- Информация о сидах, пирах, размере
- Магнитные ссылки

### Matrix Server API
- Статус сервера
- Статистика пользователей и комнат (требует admin API)

## Логирование

Все действия логируются в консоль с временными метками:
- Входящие команды от пользователей
- Ошибки HTTP запросов
- Статус подключения к сервисам

## Требования

- Node.js 18+
- TypeScript 5+
- Доступ к qBittorrent Web UI
- Доступ к Jackett API
- Доступ к Matrix server (опционально)

## Лицензия

MIT