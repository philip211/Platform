# Mafia: Chicago Platform Deployment Guide

This guide provides comprehensive instructions for deploying the Mafia: Chicago game platform to production environments. The platform consists of three main components:

1. Frontend (React + Vite)
2. Backend (NestJS + Prisma)
3. Telegram Bot

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (cloud-hosted or local)
- Telegram Bot token (from BotFather)
- Surge.sh account (for frontend deployment)
- Render.com account (for backend deployment)

## 1. Backend Deployment

### Local Setup and Testing

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database connection string

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Start in development mode
npm run start:dev
```

### Production Deployment to Render.com

1. Create a new Web Service on Render.com
2. Connect your GitHub repository
3. Configure the service:
   - Name: `mafia-chicago-api`
   - Environment: `Node`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm run start:prod`
   - Environment Variables:
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `JWT_SECRET`: A secure random string
     - `FRONTEND_URL`: `https://mafia-chicago-game.surge.sh`
     - `PORT`: `10000`
     - `NODE_ENV`: `production`
     - `ALLOWED_ORIGINS`: `https://mafia-chicago-game.surge.sh,https://t.me`

4. Deploy the service
5. After deployment, your API will be available at `https://mafia-chicago-api.onrender.com`

## 2. Frontend Deployment

### Local Setup and Testing

```bash
cd platform-webapp

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your API URL

# Start in development mode
npm run dev
```

### Production Deployment to Surge.sh

1. Install Surge globally if you haven't already:
   ```bash
   npm install -g surge
   ```

2. Configure production environment:
   ```bash
   cd platform-webapp
   
   # Create production environment file
   echo "VITE_API_URL=https://mafia-chicago-api.onrender.com" > .env.production
   echo "VITE_TELEGRAM_BOT_USERNAME=MafiaChicagoBot" >> .env.production
   
   # Add CNAME file for custom domain
   echo "mafia-chicago-game.surge.sh" > public/CNAME
   ```

3. Build and deploy:
   ```bash
   npm run build
   npx surge dist mafia-chicago-game.surge.sh
   ```

4. After deployment, your frontend will be available at `https://mafia-chicago-game.surge.sh`

## 3. Telegram Bot Deployment

### Local Setup and Testing

```bash
cd telegram-bot

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your bot token and WebApp URL

# Start in development mode
npm run dev
```

### Production Deployment

1. Configure production environment:
   ```bash
   cd telegram-bot
   
   # Create production environment file
   echo "BOT_TOKEN=your_bot_token" > .env.production
   echo "WEBAPP_URL=https://mafia-chicago-game.surge.sh" >> .env.production
   echo "WEBHOOK_URL=https://api.telegram.org" >> .env.production
   echo "PORT=8443" >> .env.production
   echo "NODE_ENV=production" >> .env.production
   ```

2. Build and start:
   ```bash
   npm run build
   NODE_ENV=production npm start
   ```

3. The bot will automatically set up a webhook and start listening for updates

## 4. Database Setup

### Cloud PostgreSQL Setup (Supabase)

1. Create a new project on Supabase
2. Go to the SQL Editor and create a new database:
   ```sql
   CREATE DATABASE mafia_chicago;
   ```

3. Get the connection string from the Settings > Database page
4. Use this connection string in your backend `.env.production` file

### Running Migrations

After setting up your database, run migrations to create all required tables:

```bash
cd backend
DATABASE_URL="your_connection_string" npx prisma migrate deploy
```

## 5. Verification and Testing

After deploying all components, verify that everything works correctly:

1. Open your Telegram bot and send the `/start` command
2. Click on the WebApp button to open the platform
3. Navigate to the Mafia: Chicago game in the catalog
4. Create a new game room and verify that it's saved in the database
5. Test the complete game flow with multiple players

## 6. Troubleshooting

### Backend Issues

- **Database Connection Errors**: Verify your `DATABASE_URL` is correct and the database is accessible from your backend server
- **Prisma Errors**: Run `npx prisma generate` to ensure your Prisma client is up to date
- **CORS Errors**: Check that your `ALLOWED_ORIGINS` includes all necessary domains

### Frontend Issues

- **API Connection Errors**: Verify that your `VITE_API_URL` is correct and the backend is running
- **Telegram WebApp Not Initializing**: Check that your `WEBAPP_URL` is correctly configured in the bot
- **Routing Issues**: Ensure your `vite.config.ts` has the correct base path configuration

### Telegram Bot Issues

- **Webhook Errors**: Verify that your `WEBHOOK_URL` is publicly accessible
- **Bot Not Responding**: Check that your `BOT_TOKEN` is correct
- **WebApp Not Opening**: Ensure the `WEBAPP_URL` is correctly configured

## 7. Maintenance

### Updating the Platform

1. Make changes to your codebase
2. Test locally
3. Deploy updates:
   - Backend: Push to GitHub and Render.com will automatically redeploy
   - Frontend: Run `npm run build && npx surge dist mafia-chicago-game.surge.sh`
   - Telegram Bot: Update your server with the new code and restart the bot

### Monitoring

- Use Render.com's built-in logs to monitor your backend
- Set up error tracking with a service like Sentry
- Regularly check your database for any issues

## 8. Security Considerations

- Keep your `.env` files secure and never commit them to version control
- Regularly update your dependencies to patch security vulnerabilities
- Use HTTPS for all communications
- Implement rate limiting to prevent abuse

## 9. Scaling

As your user base grows, consider:

- Upgrading your database plan
- Moving to a more powerful hosting tier
- Implementing caching strategies
- Setting up a CDN for static assets

## 10. Backup and Recovery

- Regularly backup your database
- Document your deployment process for quick recovery
- Test your recovery procedures periodically

---

For any questions or issues, please refer to the component-specific documentation or contact the development team.
