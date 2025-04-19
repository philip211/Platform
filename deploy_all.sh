#!/bin/bash

# Comprehensive Deployment Script for Mafia: Chicago Platform
# This script deploys all components: backend, frontend, and Telegram bot

set -e

echo "=== Mafia: Chicago Platform Deployment ==="
echo "This script will deploy all components of the platform"
echo "==============================================="

# Configuration
FRONTEND_URL="https://mafia-chicago-game.surge.sh"
BACKEND_URL="https://mafia-chicago-api.onrender.com"
BOT_TOKEN=${BOT_TOKEN:-"7603243525:AAF0FqjDCXQNEjZs_5GtfJp6x_Jk6xEnZTE"}

# Check prerequisites
command -v npm >/dev/null 2>&1 || { echo "npm is required but not installed. Aborting."; exit 1; }
command -v npx >/dev/null 2>&1 || { echo "npx is required but not installed. Aborting."; exit 1; }

# 1. Deploy Frontend
deploy_frontend() {
  echo "Deploying frontend to Surge.sh..."
  cd platform-webapp

  # Install dependencies
  npm install

  # Update environment for production
  echo "VITE_API_URL=${BACKEND_URL}/api" > .env.production
  echo "VITE_TELEGRAM_BOT_USERNAME=MafiaChicagoBot" >> .env.production
  echo "VITE_MOCK_API=false" >> .env.production
  echo "VITE_MOCK_TELEGRAM=false" >> .env.production

  # Ensure CNAME file exists
  echo "mafia-chicago-game.surge.sh" > public/CNAME

  # Build and deploy
  npm run build
  npx surge dist ${FRONTEND_URL}

  echo "✅ Frontend deployed to ${FRONTEND_URL}"
  cd ..
}

# 2. Deploy Backend
deploy_backend() {
  echo "Building backend for deployment..."
  cd backend

  # Install dependencies and generate Prisma client
  npm install
  npx prisma generate
  npm run build

  echo "✅ Backend built successfully"
  echo ""
  echo "To deploy to Render.com:"
  echo "1. Go to https://dashboard.render.com/new/blueprint"
  echo "2. Connect your GitHub repository"
  echo "3. Select the repository and click 'Connect'"
  echo "4. Render will detect the render.yaml file and configure the services"
  echo "5. Click 'Apply' to deploy the services"
  echo ""
  echo "After deployment:"
  echo "1. Set up the environment variables in the Render dashboard"
  echo "2. Run database migrations with: npx prisma migrate deploy"
  echo ""
  echo "Your backend will be available at: ${BACKEND_URL}"
  cd ..
}

# 3. Deploy Telegram Bot
deploy_bot() {
  echo "Deploying Telegram bot..."
  cd telegram-bot

  # Install dependencies
  npm install

  # Update environment for production
  echo "BOT_TOKEN=${BOT_TOKEN}" > .env.production
  echo "WEBAPP_URL=${FRONTEND_URL}" >> .env.production
  echo "WEBHOOK_URL=${BACKEND_URL}" >> .env.production
  echo "PORT=8443" >> .env.production
  echo "NODE_ENV=production" >> .env.production

  # Build the bot
  npm run build

  echo "✅ Telegram bot built successfully"
  echo ""
  echo "To start the bot in production mode:"
  echo "NODE_ENV=production npm start"
  echo ""
  echo "To set up the webhook:"
  echo "curl -X POST https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${BACKEND_URL}/bot${BOT_TOKEN}"
  cd ..
}

# 4. Verify Deployment
verify_deployment() {
  echo "Verifying deployment..."
  
  # Check frontend
  echo "Checking frontend at ${FRONTEND_URL}..."
  curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}" | grep -q "200" && \
    echo "✅ Frontend is accessible" || echo "❌ Frontend is not accessible"
  
  # Check backend
  echo "Checking backend at ${BACKEND_URL}/api/health..."
  curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}/api/health" | grep -q "200" && \
    echo "✅ Backend is accessible" || echo "❌ Backend is not accessible"
  
  # Check bot
  echo "Checking Telegram bot..."
  curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getMe" | grep -q "\"ok\":true" && \
    echo "✅ Bot is accessible" || echo "❌ Bot is not accessible"
  
  echo "==============================================="
  echo "Deployment verification complete"
  echo "For a more comprehensive verification, run:"
  echo "./verify_deployment.sh"
  echo "==============================================="
}

# Main execution
echo "Starting deployment process..."

# Deploy components
deploy_frontend
deploy_backend
deploy_bot

# Verify deployment
verify_deployment

echo "==============================================="
echo "Deployment complete!"
echo "Frontend: ${FRONTEND_URL}"
echo "Backend: ${BACKEND_URL}"
echo "Bot: @MafiaChicagoBot"
echo "==============================================="

chmod +x "$0"
