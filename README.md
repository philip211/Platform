# Telegram WebApp Platform

Полноценная платформа для создания и запуска игр через Telegram WebApp, состоящая из трех основных компонентов:

1. **Frontend** (React + Vite + Zustand)
2. **Backend** (NestJS + Prisma)
3. **Telegram Bot** (Node.js)

## Структура проекта

```
platform-webapp/
├── backend/             # NestJS бэкенд с Prisma ORM
├── platform-webapp/     # React фронтенд с Vite
├── telegram-bot/        # Telegram бот на Node.js
├── deployment/          # Инструкции по деплою
└── README.md            # Этот файл
```

## Быстрый старт

### Предварительные требования

- Node.js 18+ и npm
- PostgreSQL
- Telegram Bot Token (получить у @BotFather)

### 1. Настройка базы данных

```bash
# Запуск PostgreSQL в Docker (опционально)
docker run --name telegram-db \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15

# Создание базы данных
psql -U postgres -h localhost -c "CREATE DATABASE telegram_platform"
```

### 2. Настройка Backend

```bash
cd backend

# Установка зависимостей
npm install

# Копирование примера .env файла
cp .env.example .env

# Редактирование .env файла с вашими настройками
# DATABASE_URL="postgresql://postgres:password@localhost:5432/telegram_platform"

# Миграция базы данных
npx prisma migrate dev
npx prisma generate

# Запуск в режиме разработки
npm run start:dev
```

### 3. Настройка Frontend

```bash
cd platform-webapp

# Установка зависимостей
npm install

# Копирование примера .env файла
cp .env.example .env

# Редактирование .env файла с вашими настройками
# VITE_API_URL="http://localhost:3000"

# Запуск в режиме разработки
npm run dev
```

### 4. Настройка Telegram Bot

```bash
cd telegram-bot

# Установка зависимостей
npm install

# Копирование примера .env файла
cp .env.example .env

# Редактирование .env файла с вашими настройками
# BOT_TOKEN="your_bot_token_here"
# WEBAPP_URL="http://localhost:5173"
# NODE_ENV="development"

# Запуск в режиме разработки
npm run dev
```

## Настройка для разработки

### Локальный туннель для Telegram WebApp

Для тестирования Telegram WebApp локально, вам понадобится публичный URL. Используйте ngrok или аналогичный сервис:

```bash
# Установка ngrok
npm install -g ngrok

# Создание туннеля к вашему локальному серверу
ngrok http 5173

# Обновите WEBAPP_URL в .env файле бота с полученным URL
# WEBAPP_URL="https://your-ngrok-url.ngrok-free.app"
```

### Запуск всех компонентов одновременно

Для удобства разработки можно использовать [concurrently](https://www.npmjs.com/package/concurrently):

```bash
# В корневой директории проекта
npm install -g concurrently

# Создайте package.json в корневой директории
echo '{
  "name": "platform-webapp-dev",
  "scripts": {
    "dev": "concurrently \"cd backend && npm run start:dev\" \"cd platform-webapp && npm run dev\" \"cd telegram-bot && npm run dev\""
  }
}' > package.json

# Установите зависимости
npm install

# Запустите все компоненты
npm run dev
```

## Игра "Мафия: Чикаго"

Платформа включает в себя игру "Мафия: Чикаго" с уникальными механиками:

- 8 игроков с разными ролями (Мафия, Доктор, Шериф, Мирные жители)
- Локации и действия в стиле 1930-х годов
- Циклы: Ночь → Утро → Обсуждение → Голосование → Смерть
- Подарки и социальные взаимодействия

Подробнее о правилах и механике игры можно прочитать в [MAFIA_CHICAGO_README.md](./MAFIA_CHICAGO_README.md).

## Деплой

Инструкции по деплою каждого компонента находятся в директории [deployment](./deployment/):

- [Общие инструкции по деплою](./deployment/README.md)
- [Подробная инструкция по деплою](./deployment/DEPLOYMENT.md)

## Устранение неполадок

### Проблемы с Telegram WebApp

Если у вас возникают проблемы с интеграцией Telegram WebApp, обратитесь к документу [TELEGRAM_WEBAPP_FIX.md](./TELEGRAM_WEBAPP_FIX.md).

### Проблемы с базой данных

```bash
# Сброс и пересоздание базы данных
cd backend
npx prisma migrate reset
npx prisma migrate dev
npx prisma generate
```

## Лицензия

MIT
