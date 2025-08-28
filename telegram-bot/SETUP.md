# Инструкция по первому запуску

## Пошаговая настройка домашнего сервера

### 1. Подготовка окружения

```bash
# Скопировать конфигурацию
cp .env.example .env

# Отредактировать конфигурацию
nano .env
```

**Обязательные поля в .env:**
- `BOT_TOKEN` - получить от @BotFather в Telegram
- `ALLOWED_CHAT_IDS` - ваш chat ID (получить командой /chatid)

### 2. Запуск всех сервисов

```bash
# Запустить полную инфраструктуру
docker-compose up -d

# Проверить статус сервисов
docker-compose ps
```

### 3. Настройка qBittorrent

1. Открыть http://localhost:8080
2. Войти:
   - **Логин:** `admin`
   - **Пароль:** `adminadmin` 
3. Сменить пароль: Settings → Web UI → Password
4. Настроить папки загрузки: Settings → Downloads

### 4. Настройка Jackett

1. Открыть http://localhost:9117
2. Добавить индексаторы:
   - Нажать "Add indexer"
   - Найти и добавить "RuTracker" или другие трекеры
   - Настроить аутентификацию для каждого трекера
3. Скопировать API Key:
   - Найти в верхней части страницы
   - Добавить в `.env` файл как `JACKETT_API_KEY`

### 5. Настройка Telegram бота

1. Получить Bot Token:
   - Написать @BotFather в Telegram
   - Создать бота командой `/newbot`
   - Скопировать токен в `.env` как `BOT_TOKEN`

2. Получить Chat ID:
   - Запустить бота
   - Написать боту команду `/chatid`
   - Скопировать Chat ID в `.env` как `ALLOWED_CHAT_IDS`

### 6. Применение настроек

```bash
# Перезапустить бота с новыми настройками
docker-compose restart telegram-bot

# Проверить логи
docker-compose logs -f telegram-bot
```

### 7. Тестирование

1. Написать боту `/start` - должно показать меню команд
2. Проверить `/status` - все сервисы должны быть онлайн
3. Попробовать `/filmru matrix` - должен найти и предложить скачать торренты
4. Проверить `/torrents` - должны отобразиться добавленные торренты с кнопками управления

## Структура данных

```
telegram-bot/
├── data/
│   ├── qbittorrent/config/     # Настройки qBittorrent
│   ├── jackett/config/         # Настройки Jackett  
│   ├── downloads/              # Загруженные файлы
│   ├── watch/                  # Папка для .torrent файлов
│   └── torrserver/             # Данные TorrServer
└── logs/                       # Логи бота
```

## Устранение проблем

### Сервисы не запускаются
```bash
# Проверить логи
docker-compose logs qbittorrent
docker-compose logs jackett
docker-compose logs telegram-bot

# Пересоздать контейнеры
docker-compose down
docker-compose up -d
```

### Бот не отвечает
1. Проверить BOT_TOKEN в .env
2. Проверить ALLOWED_CHAT_IDS
3. Проверить сетевые настройки

### qBittorrent недоступен
1. Проверить что порт 8080 свободен
2. Проверить логи: `docker-compose logs qbittorrent`
3. Возможно нужно подождать полной инициализации (1-2 минуты)

### Jackett не находит торренты
1. Убедиться что добавлены и настроены индексаторы
2. Проверить API ключ в .env
3. Проверить что трекеры доступны

## Backup и восстановление

### Создание backup'а
```bash
# Остановить сервисы
docker-compose down

# Создать архив данных
tar -czf homeserver-backup.tar.gz data/ .env

# Запустить сервисы
docker-compose up -d
```

### Восстановление
```bash
# Остановить сервисы
docker-compose down

# Восстановить данные
tar -xzf homeserver-backup.tar.gz

# Запустить сервисы
docker-compose up -d
```