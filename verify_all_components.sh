#!/bin/bash

set -e

echo "=== Mafia: Chicago Platform Verification ==="
echo "This script will verify all components of the platform"
echo "==============================================="

FRONTEND_URL="https://mafia-chicago-game.surge.sh"
BACKEND_URL="https://mafia-chicago-api.onrender.com"
BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-YOUR_BOT_TOKEN}"

echo "Checking frontend at ${FRONTEND_URL}..."
if curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}" | grep -q "200"; then
  echo "✅ Frontend is accessible"
else
  echo "❌ Frontend is not accessible"
fi

echo "Checking backend at ${BACKEND_URL}/api/health..."
if curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}/api/health" | grep -q "200"; then
  echo "✅ Backend is accessible"
else
  echo "❌ Backend is not accessible"
  echo "Note: If you just deployed the backend, it might take a few minutes to become available."
fi

echo "Checking Telegram bot..."
BOT_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getMe")
if echo "${BOT_INFO}" | grep -q "\"ok\":true"; then
  BOT_USERNAME=$(echo "${BOT_INFO}" | grep -o '"username":"[^"]*"' | cut -d'"' -f4)
  echo "✅ Bot is accessible as @${BOT_USERNAME}"
else
  echo "❌ Bot is not accessible"
fi

echo "Checking WebSocket connection..."
if command -v wscat &> /dev/null; then
  echo "Testing WebSocket connection to ${BACKEND_URL}/mafia..."
  TIMEOUT=5
  timeout ${TIMEOUT} wscat -c "${BACKEND_URL}/mafia" -x '{"type":"ping"}' || echo "❌ WebSocket connection timed out after ${TIMEOUT} seconds"
else
  echo "⚠️ wscat not installed, skipping WebSocket test"
  echo "To install: npm install -g wscat"
fi

echo "Checking CORS configuration..."
CORS_HEADERS=$(curl -s -I -X OPTIONS -H "Origin: ${FRONTEND_URL}" "${BACKEND_URL}/api/health" | grep -i "access-control")
if [[ -n "${CORS_HEADERS}" ]]; then
  echo "✅ CORS headers are present:"
  echo "${CORS_HEADERS}"
else
  echo "❌ CORS headers are not properly configured"
fi

echo "Checking Telegram webhook configuration..."
WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")
if echo "${WEBHOOK_INFO}" | grep -q "\"url\":\"${BACKEND_URL}"; then
  echo "✅ Webhook is properly configured"
else
  echo "❌ Webhook is not properly configured"
  echo "Current webhook configuration:"
  echo "${WEBHOOK_INFO}" | grep -o '"url":"[^"]*"' | cut -d'"' -f4
  echo ""
  echo "To set up the webhook, run:"
  echo "curl -X POST https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${BACKEND_URL}/bot${BOT_TOKEN}"
fi

echo "==============================================="
echo "Verification complete!"
echo "Frontend: ${FRONTEND_URL}"
echo "Backend: ${BACKEND_URL}"
echo "Bot: @MafiaChicagoBot"
echo "==============================================="

chmod +x "$0"
