

set -e

echo "=== Mafia: Chicago Platform Deployment Verification ==="
echo "This script will verify that all components are properly deployed"
echo "========================================================="

FRONTEND_URL=${FRONTEND_URL:-"https://mafia-chicago-game.surge.sh"}
BACKEND_URL=${BACKEND_URL:-"https://mafia-chicago-api.onrender.com"}
BOT_USERNAME=${BOT_USERNAME:-"MafiaChicagoBot"}

command -v curl >/dev/null 2>&1 || { echo "curl is required but not installed. Aborting."; exit 1; }

check_url() {
  local url=$1
  local name=$2
  local expected_content=$3
  
  echo "Checking $name at $url..."
  
  local response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  
  if [ "$response" -ge 200 ] && [ "$response" -lt 400 ]; then
    echo "✅ $name is accessible (HTTP $response)"
    
    if [ -n "$expected_content" ]; then
      if curl -s "$url" | grep -q "$expected_content"; then
        echo "✅ $name contains expected content"
      else
        echo "❌ $name does not contain expected content"
      fi
    fi
    
    return 0
  else
    echo "❌ $name is not accessible (HTTP $response)"
    return 1
  fi
}

check_bot() {
  echo "Checking Telegram bot @$BOT_USERNAME..."
  
  if [ -z "$BOT_TOKEN" ]; then
    echo "⚠️ Cannot check bot: BOT_TOKEN not provided"
    echo "Please set it with: export BOT_TOKEN=your_bot_token"
    return 1
  fi
  
  local bot_info=$(curl -s "https://api.telegram.org/bot$BOT_TOKEN/getMe")
  
  if echo "$bot_info" | grep -q "\"ok\":true"; then
    echo "✅ Bot is accessible"
    
    local webhook_info=$(curl -s "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo")
    
    if echo "$webhook_info" | grep -q "\"url\":"; then
      echo "✅ Bot webhook is configured"
      echo "   $(echo "$webhook_info" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)"
    else
      echo "❌ Bot webhook is not configured"
    fi
    
    return 0
  else
    echo "❌ Bot is not accessible"
    return 1
  fi
}

check_database() {
  echo "Checking database connection through backend..."
  
  local health_url="$BACKEND_URL/api/health"
  local response=$(curl -s "$health_url")
  
  if echo "$response" | grep -q "\"status\":\"ok\""; then
    echo "✅ Backend health check passed"
    return 0
  else
    echo "❌ Backend health check failed"
    return 1
  fi
}

check_integration() {
  echo "Checking frontend-backend integration..."
  
  local invite_code=$(cat /dev/urandom | tr -dc 'A-Z0-9' | fold -w 6 | head -n 1)
  
  local game_url="$FRONTEND_URL/games/mafia-chicago?inviteCode=$invite_code"
  
  if check_url "$game_url" "Game page with invite code" ""; then
    echo "✅ Game page with invite code is accessible"
    return 0
  else
    echo "❌ Game page with invite code is not accessible"
    return 1
  fi
}

verify_deployment() {
  local frontend_ok=false
  local backend_ok=false
  local bot_ok=false
  local integration_ok=false
  
  if check_url "$FRONTEND_URL" "Frontend" "Telegram WebApp"; then
    frontend_ok=true
  fi
  
  if check_url "$BACKEND_URL/api" "Backend API" ""; then
    backend_ok=true
    
    if check_database; then
      echo "✅ Database connection is working"
    else
      echo "❌ Database connection is not working"
    fi
  fi
  
  if check_bot; then
    bot_ok=true
  fi
  
  if check_integration; then
    integration_ok=true
  fi
  
  echo "========================================================="
  echo "DEPLOYMENT VERIFICATION SUMMARY:"
  echo "Frontend: $([ "$frontend_ok" = true ] && echo "✅ OK" || echo "❌ FAILED")"
  echo "Backend: $([ "$backend_ok" = true ] && echo "✅ OK" || echo "❌ FAILED")"
  echo "Bot: $([ "$bot_ok" = true ] && echo "✅ OK" || echo "❌ FAILED")"
  echo "Integration: $([ "$integration_ok" = true ] && echo "✅ OK" || echo "❌ FAILED")"
  echo "========================================================="
  
  if [ "$frontend_ok" = true ] && [ "$backend_ok" = true ] && [ "$bot_ok" = true ] && [ "$integration_ok" = true ]; then
    echo "✅ All components are properly deployed and working"
    return 0
  else
    echo "❌ Some components are not properly deployed or working"
    return 1
  fi
}

verify_deployment

chmod +x "$0"
