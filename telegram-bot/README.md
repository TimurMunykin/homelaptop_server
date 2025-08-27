# HomeServer Telegram Bot

Telegram bot для управления домашним сервером с интеграцией qBittorrent, Jackett и Matrix.

## Возможности

- 📊 **Мониторинг статуса** всех сервисов
- 🌊 **Управление торрентами** через qBittorrent
- 🔍 **Поиск торрентов** через Jackett
- 💻 **Системная информация** (CPU, RAM, диск)
- 🏠 **Статистика Matrix сервера**

## Команды бота

- `/start` - Приветствие и список команд
- `/help` - Помощь по командам
- `/status` - Статус всех сервисов
- `/torrents` - Активные торренты
- `/search <query>` - Поиск торрентов
- `/system` - Системная информация

## Установка и настройка

### Быстрый старт с Docker Compose (рекомендуется)

```bash
# 1. Клонировать репозиторий
git clone <repo-url>
cd telegram-bot

# 2. Настроить окружение
cp .env.example .env
nano .env  # Указать BOT_TOKEN и ALLOWED_CHAT_IDS

# 3. Запустить все сервисы
docker-compose up -d
```

Это запустит полную инфраструктуру:
- **qBittorrent** (порт 8080) - торрент-клиент  
- **Jackett** (порт 9117) - прокси для торрент-трекеров
- **TorrServer** (порт 8090) - стриминг торрентов
- **Telegram Bot** - ваш бот для управления

### Настройка после запуска

1. **qBittorrent**: Откройте http://localhost:8080
   - Логин: `admin`, пароль: `adminadmin`
   - Смените пароль в настройках

2. **Jackett**: Откройте http://localhost:9117  
   - Добавьте индексаторы (например, RuTracker)
   - Скопируйте API ключ в .env файл (`JACKETT_API_KEY`)

3. **Перезапустите бот**: `docker-compose restart telegram-bot`

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