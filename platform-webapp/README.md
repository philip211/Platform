Project Start Guide

Полная инструкция по запуску и обслуживанию платформы.

📦 Структура проекта

root/
├── telegram-bot/         # Telegram WebApp и логика бота
├── platform-webapp/      # Веб-клиент (React + Vite)
├── backend/              # Серверная часть (NestJS + Prisma)

🔧 1. Установка зависимостей (один раз)

cd telegram-bot && npm install
cd ../platform-webapp && npm install
cd ../backend && npm install

🚀 2. Запуск разработки

➤ Telegram Bot (ts-node)

cd telegram-bot
npm run dev

➤ Web-клиент (Vite + React)

cd platform-webapp
npm run dev

➤ Backend (NestJS)

cd backend
npm run start:dev

🌐 3. Подключение NGROK (для Telegram WebApp)

🔄 Обновить ссылку:

cd platform-webapp
npx ngrok http 5173

✅ После запуска скопируй https-ссылку вида:

https://e290-5-173-57-95.ngrok-free.app

🔁 Обнови TelegramBot/WebAppInfo:

В .env бота (telegram-bot/.env) или конфиге:

WEB_APP_URL=https://e290-5-173-57-95.ngrok-free.app

Внутри Telegram Bot: BotFather > /setdomain

Также, при необходимости, обнови ссылку в:

backend/.env (если используешь CORS)

platform-webapp/src/constants.ts если захардкожено

🗄️ 4. Работа с базой данных PostgreSQL (через Docker)

Запуск контейнера:

docker run --name telegram-db \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15

URL подключения (файл .env в backend и Prisma):

DATABASE_URL="postgresql://postgres:password@localhost:5432/telegram_platform"

Миграции:

cd backend
npx prisma migrate dev --name init

Проверка доступа:

npx prisma studio

🧪 5. Тестирование WebApp внутри Telegram

Убедись, что NGROK туннель активен

Установи в BotFather URL WebApp (тот, что дал ngrok)

Перейди в Telegram > бот > Открыть мини-приложение

🛠️ Дополнительно

Все команды должны запускаться из корня соответствующего проекта

Обновляй NGROK-ссылку каждый раз при новом запуске туннеля

В случае ошибок (403, offline, user undefined) — перепроверь ссылку и Telegram WebApp InitData

