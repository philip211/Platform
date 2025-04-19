# Mafia: Chicago Deployment Guide

This guide provides instructions for deploying the Mafia: Chicago game platform to production environments.

## Components

The platform consists of three main components:

1. **Frontend (platform-webapp)** - React application
2. **Backend (backend)** - NestJS API server
3. **Telegram Bot (telegram-bot)** - Node.js Telegram bot

## Deployment Platforms

We recommend the following platforms for deployment:

- **Frontend**: Vercel, Netlify, or similar static hosting
- **Backend**: Render, Railway, or similar Node.js hosting
- **Telegram Bot**: Render, Railway, or similar Node.js hosting
- **Database**: Managed PostgreSQL service (e.g., Render, Railway, Supabase)

## Required Environment Variables

### Frontend (.env.production)
- `VITE_API_URL`: URL to your deployed backend API
- `VITE_TELEGRAM_BOT_USERNAME`: Username of your Telegram bot (without @ symbol)

### Backend (.env.production)
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Port for the backend server (typically 3000)

### Telegram Bot (.env.production)
- `BOT_TOKEN`: Your Telegram bot token from BotFather
- `WEBAPP_URL`: URL to your deployed frontend application
- `WEBHOOK_URL`: URL where your bot server is hosted (for webhook)
- `PORT`: Port for the bot server (typically 8443)
- `NODE_ENV`: Set to "production"

## Deployment Steps

### 1. Database Setup

1. Create a PostgreSQL database on your preferred platform
2. Note the connection string for use in the backend deployment
3. Run migrations to set up the schema:
   ```
   cd backend
   npx prisma migrate deploy
   ```

### 2. Backend Deployment

1. Push the backend code to your hosting platform
2. Set the environment variables
3. Ensure the server is running on the specified port
4. Verify the API is accessible at the URL you'll use for the frontend

### 3. Frontend Deployment

1. Build the frontend:
   ```
   cd platform-webapp
   npm run build
   ```
2. Deploy the `dist` directory to your static hosting platform
3. Set the environment variables
4. Verify the frontend is accessible and can connect to the backend

### 4. Telegram Bot Deployment

1. Push the bot code to your hosting platform
2. Set the environment variables, including the webhook URL
3. Ensure the bot is running in webhook mode (not polling)
4. Verify the bot responds to commands and can open the WebApp

## Verification

After deployment, verify the following:

1. The bot responds to `/start` and `/help` commands
2. The WebApp opens correctly from the bot
3. Users can create and join game rooms
4. The game progresses through all phases correctly
5. Invite links work properly

## Troubleshooting

- **Bot not responding**: Check webhook setup and logs
- **WebApp not opening**: Verify WEBAPP_URL is correct
- **API connection issues**: Check CORS settings and API URL
- **Database errors**: Verify connection string and migrations

## Monitoring

Set up monitoring for all components to ensure uptime and performance:

- Use the hosting platform's built-in monitoring
- Set up error notifications
- Monitor database performance
- Check bot webhook status regularly
