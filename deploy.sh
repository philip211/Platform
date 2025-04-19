

set -e

echo "=== Mafia: Chicago Platform Deployment ==="
echo "This script will deploy all components to production"
echo "=================================================="

FRONTEND_DIR=${FRONTEND_DIR:-"platform-webapp"}
BACKEND_DIR=${BACKEND_DIR:-"backend"}
BOT_DIR=${BOT_DIR:-"telegram-bot"}
SURGE_DOMAIN=${SURGE_DOMAIN:-"mafia-chicago-game.surge.sh"}
RENDER_API_URL=${RENDER_API_URL:-"https://mafia-chicago-api.onrender.com"}

if [ -z "$BOT_TOKEN" ]; then
  echo "ERROR: BOT_TOKEN environment variable is required"
  echo "Please set it with: export BOT_TOKEN=your_bot_token"
  exit 1
fi

command -v npm >/dev/null 2>&1 || { echo "npm is required but not installed. Aborting."; exit 1; }
command -v npx >/dev/null 2>&1 || { echo "npx is required but not installed. Aborting."; exit 1; }

deploy_frontend() {
  echo "=== Deploying Frontend to Surge.sh ==="
  cd "$FRONTEND_DIR"
  
  echo "VITE_API_URL=$RENDER_API_URL" > .env.production
  echo "VITE_TELEGRAM_BOT_USERNAME=MafiaChicagoBot" >> .env.production
  
  echo "$SURGE_DOMAIN" > public/CNAME
  
  npm install
  
  npm run build
  
  npx surge dist "$SURGE_DOMAIN"
  
  echo "✅ Frontend deployed to https://$SURGE_DOMAIN"
  cd ..
}

configure_bot() {
  echo "=== Configuring Telegram Bot for production ==="
  cd "$BOT_DIR"
  
  echo "BOT_TOKEN=$BOT_TOKEN" > .env.production
  echo "WEBAPP_URL=https://$SURGE_DOMAIN" >> .env.production
  echo "WEBHOOK_URL=${WEBHOOK_URL:-https://api.telegram.org}" >> .env.production
  echo "PORT=${BOT_PORT:-8443}" >> .env.production
  echo "NODE_ENV=production" >> .env.production
  
  npm install
  
  npm run build
  
  echo "✅ Telegram Bot configured for production"
  echo "To start the bot in production mode, run:"
  echo "cd $BOT_DIR && NODE_ENV=production npm start"
  cd ..
}

start_local() {
  echo "=== Starting all components locally for testing ==="
  
  echo "Starting backend..."
  cd "$BACKEND_DIR"
  npm install
  npm run start:dev &
  BACKEND_PID=$!
  cd ..
  
  echo "Starting frontend..."
  cd "$FRONTEND_DIR"
  npm install
  npm run dev &
  FRONTEND_PID=$!
  cd ..
  
  echo "Starting Telegram bot..."
  cd "$BOT_DIR"
  npm install
  npm run dev &
  BOT_PID=$!
  cd ..
  
  echo "✅ All components started locally"
  echo "- Frontend: http://localhost:5173"
  echo "- Backend: http://localhost:3000"
  echo "- Telegram Bot: Running in polling mode"
  
  echo "Press Ctrl+C to stop all components"
  wait
}

verify_deployment() {
  echo "=== Verifying Deployment ==="
  
  echo "Checking frontend..."
  if curl -s "https://$SURGE_DOMAIN" | grep -q "Telegram WebApp"; then
    echo "✅ Frontend is accessible"
  else
    echo "❌ Frontend is not accessible"
  fi
  
  echo "Checking backend..."
  if curl -s "$RENDER_API_URL/api/health" | grep -q "ok"; then
    echo "✅ Backend is accessible"
  else
    echo "❌ Backend is not accessible (this is expected if using mock API)"
  fi
  
  echo "Checking bot webhook..."
  if [ -n "$BOT_TOKEN" ]; then
    WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo")
    if echo "$WEBHOOK_INFO" | grep -q "\"ok\":true"; then
      echo "✅ Bot webhook is configured"
    else
      echo "❌ Bot webhook is not configured"
    fi
  else
    echo "⚠️ Cannot check webhook: BOT_TOKEN not provided"
  fi
  
  echo "=== Deployment Verification Complete ==="
}

show_menu() {
  echo "=== Mafia: Chicago Platform Deployment ==="
  echo "1. Deploy Frontend to Surge.sh"
  echo "2. Configure Telegram Bot for production"
  echo "3. Start all components locally for testing"
  echo "4. Verify deployment"
  echo "5. Deploy all components"
  echo "0. Exit"
  echo "=================================================="
  read -p "Enter your choice: " choice
  
  case $choice in
    1) deploy_frontend ;;
    2) configure_bot ;;
    3) start_local ;;
    4) verify_deployment ;;
    5)
      deploy_frontend
      configure_bot
      verify_deployment
      ;;
    0) exit 0 ;;
    *) echo "Invalid choice" ;;
  esac
  
  show_menu
}

chmod +x "$0"

show_menu
