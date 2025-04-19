# Mafia: Chicago Platform Deployment

This document provides comprehensive instructions for deploying and maintaining the Mafia: Chicago game platform in a production environment.

## Architecture Overview

The platform consists of three main components:

1. **Frontend (React + Vite)**
   - Deployed to Surge.sh
   - URL: https://mafia-chicago-game.surge.sh

2. **Backend (NestJS + Prisma)**
   - Deployed to Render.com
   - URL: https://mafia-chicago-api.onrender.com

3. **Telegram Bot**
   - Configured with webhook for production
   - Username: @MafiaChicagoBot

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (cloud-hosted)
- Telegram Bot token (from BotFather)
- Surge.sh account (for frontend deployment)
- Render.com account (for backend deployment)

## Deployment Steps

### 1. Backend Deployment

1. **Set up PostgreSQL Database**
   - Create a PostgreSQL database on Railway, Supabase, or Render.com
   - Note the connection string for later use

2. **Deploy to Render.com**
   - Create a new Web Service on Render.com
   - Connect your GitHub repository
   - Configure the service:
     - Name: `mafia-chicago-api`
     - Environment: `Node`
     - Build Command: `npm install && npx prisma generate && npm run build`
     - Start Command: `npm run start:prod`
     - Environment Variables:
       ```
       DATABASE_URL=postgres://user:pass@host:5432/db
       JWT_SECRET=your_secure_random_string
       FRONTEND_URL=https://mafia-chicago-game.surge.sh
       PORT=10000
       NODE_ENV=production
       ALLOWED_ORIGINS=https://mafia-chicago-game.surge.sh,https://t.me
       ```

3. **Run Database Migrations**
   ```bash
   cd backend
   DATABASE_URL="your_connection_string" npx prisma migrate deploy
   ```

### 2. Frontend Deployment

1. **Configure Production Environment**
   ```bash
   cd platform-webapp
   
   # Create production environment file
   echo "VITE_API_URL=https://mafia-chicago-api.onrender.com" > .env.production
   echo "VITE_TELEGRAM_BOT_USERNAME=MafiaChicagoBot" >> .env.production
   
   # Add CNAME file for custom domain
   echo "mafia-chicago-game.surge.sh" > public/CNAME
   ```

2. **Build and Deploy to Surge.sh**
   ```bash
   npm run build
   npx surge dist mafia-chicago-game.surge.sh
   ```

### 3. Telegram Bot Deployment

1. **Configure Production Environment**
   ```bash
   cd telegram-bot
   
   # Create production environment file
   echo "BOT_TOKEN=your_bot_token" > .env.production
   echo "WEBAPP_URL=https://mafia-chicago-game.surge.sh" >> .env.production
   echo "WEBHOOK_URL=https://api.telegram.org" >> .env.production
   echo "PORT=8443" >> .env.production
   echo "NODE_ENV=production" >> .env.production
   ```

2. **Build and Start**
   ```bash
   npm run build
   NODE_ENV=production npm start
   ```

## Verification

After deploying all components, verify that everything works correctly using the provided verification scripts:

1. **Basic Deployment Verification**
   ```bash
   ./verify_deployment.sh
   ```

2. **Comprehensive Integration Test**
   ```bash
   BOT_TOKEN=your_bot_token node integration_test.js
   ```

## Maintenance

### Updating Components

1. **Frontend Updates**
   ```bash
   cd platform-webapp
   git pull
   npm install
   npm run build
   npx surge dist mafia-chicago-game.surge.sh
   ```

2. **Backend Updates**
   - Push changes to GitHub and Render.com will automatically redeploy
   - Or manually trigger a deploy on Render.com

3. **Telegram Bot Updates**
   ```bash
   cd telegram-bot
   git pull
   npm install
   npm run build
   NODE_ENV=production npm start
   ```

### Monitoring

- Use Render.com's built-in logs to monitor your backend
- Set up error tracking with a service like Sentry
- Regularly check your database for any issues

### Backup and Recovery

- Regularly backup your PostgreSQL database
- Document your deployment process for quick recovery
- Test your recovery procedures periodically

## Troubleshooting

### Backend Issues

- **Database Connection Errors**: Verify your `DATABASE_URL` is correct
- **Prisma Errors**: Run `npx prisma generate` to ensure your Prisma client is up to date
- **CORS Errors**: Check that your `ALLOWED_ORIGINS` includes all necessary domains

### Frontend Issues

- **API Connection Errors**: Verify that your `VITE_API_URL` is correct
- **Telegram WebApp Not Initializing**: Check that your `WEBAPP_URL` is correctly configured
- **Routing Issues**: Ensure your `vite.config.ts` has the correct base path configuration

### Telegram Bot Issues

- **Webhook Errors**: Verify that your `WEBHOOK_URL` is publicly accessible
- **Bot Not Responding**: Check that your `BOT_TOKEN` is correct
- **WebApp Not Opening**: Ensure the `WEBAPP_URL` is correctly configured

## Security Considerations

- Keep your `.env` files secure and never commit them to version control
- Regularly update your dependencies to patch security vulnerabilities
- Use HTTPS for all communications
- Implement rate limiting to prevent abuse

## Contact

For any questions or issues, please contact the development team.
