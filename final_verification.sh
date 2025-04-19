
set -e

echo "=== Mafia: Chicago Platform - Final Verification ==="
echo "This script performs a comprehensive verification of all platform components"
echo "=================================================================="

FRONTEND_URL="${FRONTEND_URL:-https://mafia-chicago-game.surge.sh}"
BACKEND_URL="${BACKEND_URL:-https://mafia-chicago-api.onrender.com}"
BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-YOUR_BOT_TOKEN}"

command -v curl >/dev/null 2>&1 || { echo "❌ curl is required but not installed. Aborting."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting."; exit 1; }

echo "Running comprehensive verification..."

echo -e "\n🔍 Verifying Frontend (${FRONTEND_URL})..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}")
if [ "$FRONTEND_STATUS" -eq 200 ]; then
  echo "✅ Frontend is accessible (HTTP 200)"
else
  echo "❌ Frontend is not accessible (HTTP ${FRONTEND_STATUS})"
fi

echo -e "\n🔍 Verifying Backend (${BACKEND_URL})..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}/api/health")
if [ "$BACKEND_STATUS" -eq 200 ]; then
  echo "✅ Backend is accessible (HTTP 200)"
else
  echo "❌ Backend is not accessible (HTTP ${BACKEND_STATUS})"
fi

echo -e "\n🔍 Verifying Database connection..."
DB_CHECK=$(curl -s "${BACKEND_URL}/api/health" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
if [ "$DB_CHECK" == "connected" ]; then
  echo "✅ Database connection is working"
else
  echo "❌ Database connection issue: ${DB_CHECK}"
fi

echo -e "\n🔍 Verifying WebSocket connection..."
if [ ! -f "/tmp/ws_test.js" ]; then
  cat > /tmp/ws_test.js << 'EOF'
const WebSocket = require('ws');
const url = process.argv[2];

const ws = new WebSocket(url);
let connected = false;

ws.on('open', () => {
  connected = true;
  console.log('CONNECTED');
  setTimeout(() => {
    ws.close();
    process.exit(0);
  }, 1000);
});

ws.on('error', (error) => {
  console.log('ERROR:', error.message);
  process.exit(1);
});

// Exit after timeout if no connection
setTimeout(() => {
  if (!connected) {
    console.log('TIMEOUT: Could not connect to WebSocket server');
    process.exit(1);
  }
}, 5000);
EOF

  if ! npm list -g ws > /dev/null 2>&1; then
    echo "Installing WebSocket client..."
    npm install -g ws
  fi
fi

WS_URL="wss://$(echo ${BACKEND_URL} | sed 's|^https\?://||')/mafia"
WS_RESULT=$(node /tmp/ws_test.js "${WS_URL}" 2>&1)
if echo "$WS_RESULT" | grep -q "CONNECTED"; then
  echo "✅ WebSocket connection successful"
else
  echo "❌ WebSocket connection failed: ${WS_RESULT}"
fi

if [ "$BOT_TOKEN" != "YOUR_BOT_TOKEN" ]; then
  echo -e "\n🔍 Verifying Telegram Bot..."
  BOT_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getMe")
  if echo "$BOT_INFO" | grep -q "\"ok\":true"; then
    BOT_USERNAME=$(echo "$BOT_INFO" | grep -o '"username":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Telegram Bot is active: @${BOT_USERNAME}"
    
    WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")
    WEBHOOK_URL=$(echo "$WEBHOOK_INFO" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$WEBHOOK_URL" ]; then
      echo "✅ Webhook is configured: ${WEBHOOK_URL}"
    else
      echo "❌ Webhook is not configured"
    fi
  else
    echo "❌ Telegram Bot verification failed"
  fi
else
  echo -e "\n⚠️ Skipping Telegram Bot verification (no token provided)"
  echo "To verify the bot, run with: TELEGRAM_BOT_TOKEN=your_token ./final_verification.sh"
fi

echo -e "\n🔍 Running integration tests..."
if [ -f "final_integration_test.js" ]; then
  if ! npm list axios ws crypto > /dev/null 2>&1; then
    echo "Installing test dependencies..."
    npm install axios ws crypto
  fi
  
  FRONTEND_URL="$FRONTEND_URL" BACKEND_URL="$BACKEND_URL" BOT_TOKEN="$BOT_TOKEN" node final_integration_test.js
  TEST_EXIT_CODE=$?
  
  if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ Integration tests passed"
  else
    echo "❌ Integration tests failed (exit code: ${TEST_EXIT_CODE})"
  fi
else
  echo "❌ Integration test file not found: final_integration_test.js"
fi

echo -e "\n🔍 Verifying CORS configuration..."
CORS_HEADERS=$(curl -s -I -X OPTIONS -H "Origin: ${FRONTEND_URL}" "${BACKEND_URL}/api/health" | grep -i "access-control")
if [ -n "$CORS_HEADERS" ]; then
  echo "✅ CORS headers are properly configured:"
  echo "$CORS_HEADERS"
else
  echo "❌ CORS headers are not properly configured"
fi

echo -e "\n🔍 Checking API response times..."
API_TIME=$(curl -s -w "%{time_total}\n" -o /dev/null "${BACKEND_URL}/api/health")
echo "API response time: ${API_TIME}s"
if (( $(echo "$API_TIME < 1.0" | bc -l) )); then
  echo "✅ API response time is good (< 1s)"
else
  echo "⚠️ API response time is slow (> 1s)"
fi

echo -e "\n=================================================================="
echo "Verification complete!"
echo "Frontend: ${FRONTEND_URL}"
echo "Backend: ${BACKEND_URL}"
echo "=================================================================="

chmod +x "$0"
