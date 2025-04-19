# Mafia: Chicago Platform - Complete Deployment Guide

This guide provides comprehensive instructions for deploying all components of the Mafia: Chicago platform to production environments.

## Deployment Status

| Component | Status | URL |
|-----------|--------|-----|
| Frontend | ✅ Deployed | https://mafia-chicago-game.surge.sh |
| Backend | ⏳ Ready for deployment | https://mafia-chicago-api.onrender.com |
| Telegram Bot | ✅ Built | @MafiaChicagoBot |

## Prerequisites

- Node.js 18+ and npm
- Git access to the repository
- Surge.sh account (for frontend)
- Render.com account (for backend)
- Telegram Bot token

## 1. Frontend Deployment

The frontend has been successfully deployed to Surge.sh.

### Manual Deployment Steps

```bash
# Navigate to the frontend directory
cd platform-webapp

# Install dependencies
npm install

# Build the project
npm run build

# Deploy to Surge.sh
npx surge dist https://mafia-chicago-game.surge.sh
```

### Environment Configuration

Create a `.env.production` file in the `platform-webapp` directory:

```
VITE_API_URL=https://mafia-chicago-api.onrender.com
VITE_WEBSOCKET_URL=wss://mafia-chicago-api.onrender.com
VITE_TELEGRAM_BOT_USERNAME=MafiaChicagoBot
```

## 2. Backend Deployment

The backend is ready for deployment to Render.com.

### Deployment Steps

1. Go to https://dashboard.render.com/new/blueprint
2. Connect your GitHub repository
3. Select the repository and click 'Connect'
4. Render will detect the `render.yaml` file and configure the services
5. Click 'Apply' to deploy the services

### Environment Variables

Set the following environment variables in the Render dashboard:

```
DATABASE_URL=postgresql://postgres:password@postgres:5432/telegram_platform
JWT_SECRET=your-jwt-secret
NODE_ENV=production
PORT=10000
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN
FRONTEND_URL=https://mafia-chicago-game.surge.sh
CORS_ORIGIN=https://mafia-chicago-game.surge.sh,https://t.me
```

### Database Migration

After deployment, run database migrations:

```bash
cd backend
npx prisma migrate deploy
```

## 3. Telegram Bot Deployment

The Telegram bot has been built successfully and is ready for deployment.

### Deployment Options

#### Option 1: Deploy to Render.com (Recommended)

1. Add the bot service to your Render blueprint
2. Configure the following environment variables:
   ```
   BOT_TOKEN=YOUR_BOT_TOKEN
   WEBAPP_URL=https://mafia-chicago-game.surge.sh
   WEBHOOK_URL=https://mafia-chicago-api.onrender.com
   PORT=8443
   NODE_ENV=production
   ```

#### Option 2: Deploy to a VPS

1. Transfer the bot files to your server
2. Install dependencies: `npm install`
3. Create a `.env.production` file with the environment variables
4. Start the bot: `NODE_ENV=production npm start`

### Setting Up the Webhook

After deployment, set up the webhook:

```bash
curl -X POST https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=https://mafia-chicago-api.onrender.com/bot${BOT_TOKEN}
```

## 4. WebSocket Configuration

The WebSocket connection is crucial for real-time game updates.

### Frontend WebSocket Setup

The `useSocket.ts` hook in the frontend is configured to connect to the backend WebSocket server:

```typescript
const socketUrl = namespace ? `${url}/${namespace}` : url;
socketRef.current = io(socketUrl, {
  autoConnect,
  transports: ['websocket', 'polling'],
  auth: authHeaders,
});
```

### Backend WebSocket Setup

The `MafiaGateway` class in the backend handles WebSocket connections:

```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['https://mafia-chicago-game.surge.sh'],
    credentials: true,
  },
  namespace: 'mafia',
})
```

## 5. Verification

After all components are deployed, verify the deployment using the provided script:

```bash
./verify_all_components.sh
```

This script checks:
- Frontend accessibility
- Backend health endpoint
- Telegram bot status
- WebSocket connection
- CORS configuration
- Telegram webhook setup

## 6. Troubleshooting

### Frontend Issues

- If the frontend is not accessible, check the Surge.sh deployment logs
- Verify that the environment variables are correctly set in `.env.production`

### Backend Issues

- Check the Render.com logs for any deployment errors
- Verify that the database connection is working
- Ensure that the environment variables are correctly set

### Telegram Bot Issues

- Check the logs for any errors
- Verify that the webhook is correctly set up
- Ensure that the bot token is valid

### WebSocket Issues

- Check that the CORS configuration allows connections from the frontend
- Verify that the WebSocket server is running
- Check for any firewall or proxy issues

## 7. Maintenance

### Updating the Frontend

1. Make your changes
2. Build the frontend: `npm run build`
3. Deploy to Surge.sh: `npx surge dist https://mafia-chicago-game.surge.sh`

### Updating the Backend

1. Push your changes to GitHub
2. Render.com will automatically deploy the changes

### Updating the Telegram Bot

1. Push your changes to GitHub
2. Redeploy the bot using the same method as the initial deployment

## 8. Security Considerations

- Keep your environment variables secure
- Do not expose sensitive information in your code
- Use HTTPS for all connections
- Implement proper authentication for WebSocket connections
- Regularly update dependencies to fix security vulnerabilities

## 9. Contact

For any issues or questions, please contact the development team.
