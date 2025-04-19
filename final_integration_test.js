/**
 * Mafia: Chicago Platform - Final Integration Test
 * 
 * This script tests the complete integration of all platform components:
 * - Frontend accessibility
 * - Backend API functionality
 * - WebSocket connections
 * - Telegram Bot integration
 * - Game mechanics
 */

const axios = require('axios');
const WebSocket = require('ws');
const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://mafia-chicago-game.surge.sh';
const BACKEND_URL = process.env.BACKEND_URL || 'https://mafia-chicago-api.onrender.com';
const BOT_TOKEN = process.env.BOT_TOKEN;
const WS_URL = process.env.WS_URL || 'wss://mafia-chicago-api.onrender.com/mafia';

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logResult(testName, passed, error = null) {
  const result = {
    name: testName,
    passed,
    error: error ? error.toString() : null,
    timestamp: new Date().toISOString()
  };
  
  results.tests.push(result);
  
  if (passed) {
    results.passed++;
    console.log(`✅ PASSED: ${testName}`);
  } else {
    results.failed++;
    console.log(`❌ FAILED: ${testName}`);
    if (error) {
      console.error(`   Error: ${error}`);
    }
  }
}

function generateTelegramSignature(telegramId, secret = 'test_secret') {
  const data = {
    telegramId,
    timestamp: Date.now()
  };
  
  const dataString = JSON.stringify(data);
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(dataString);
  const signature = hmac.digest('hex');
  
  return {
    data: dataString,
    signature
  };
}

async function runTests() {
  console.log('=== Mafia: Chicago Platform - Final Integration Test ===');
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`WebSocket URL: ${WS_URL}`);
  console.log('=======================================================');
  
  try {
    try {
      const frontendResponse = await axios.get(FRONTEND_URL);
      logResult('Frontend Accessibility', frontendResponse.status === 200);
    } catch (error) {
      logResult('Frontend Accessibility', false, error);
    }
    
    try {
      const healthResponse = await axios.get(`${BACKEND_URL}/api/health`);
      logResult('Backend Health Check', 
        healthResponse.status === 200 && 
        healthResponse.data.status === 'ok'
      );
    } catch (error) {
      logResult('Backend Health Check', false, error);
    }
    
    try {
      const wsTest = new Promise((resolve, reject) => {
        const ws = new WebSocket(WS_URL);
        
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('WebSocket connection timeout'));
        }, 5000);
        
        ws.on('open', () => {
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        });
        
        ws.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
      
      await wsTest;
      logResult('WebSocket Connection', true);
    } catch (error) {
      logResult('WebSocket Connection', false, error);
    }
    
    try {
      const authTest = new Promise((resolve, reject) => {
        const ws = new WebSocket(WS_URL);
        
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('WebSocket authentication timeout'));
        }, 5000);
        
        ws.on('open', () => {
          const telegramId = '123456789';
          const { data, signature } = generateTelegramSignature(telegramId);
          
          ws.send(JSON.stringify({
            type: 'authenticate',
            telegramId,
            data,
            signature
          }));
        });
        
        ws.on('message', (message) => {
          try {
            const response = JSON.parse(message);
            if (response.type === 'auth_result') {
              clearTimeout(timeout);
              ws.close();
              resolve(response.success);
            }
          } catch (e) {
          }
        });
        
        ws.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
      
      const authResult = await authTest;
      logResult('WebSocket Authentication', authResult);
    } catch (error) {
      logResult('WebSocket Authentication', false, error);
    }
    
    try {
      const createRoomResponse = await axios.post(`${BACKEND_URL}/api/mafia/rooms`, {
        creatorId: 'test_user_123',
        name: 'Integration Test Room'
      });
      
      const roomId = createRoomResponse.data.id;
      logResult('Game Room Creation', 
        createRoomResponse.status === 201 && 
        roomId && 
        typeof roomId === 'string'
      );
      
      if (roomId) {
        const joinRoomResponse = await axios.post(`${BACKEND_URL}/api/mafia/rooms/${roomId}/join`, {
          playerId: 'test_player_456',
          name: 'Test Player'
        });
        
        logResult('Game Room Joining', 
          joinRoomResponse.status === 200 && 
          joinRoomResponse.data.success === true
        );
      } else {
        logResult('Game Room Joining', false, new Error('No room ID available for join test'));
      }
    } catch (error) {
      logResult('Game Room Creation', false, error);
      logResult('Game Room Joining', false, new Error('Skipped due to room creation failure'));
    }
    
    if (BOT_TOKEN) {
      try {
        const bot = new TelegramBot(BOT_TOKEN);
        const botInfo = await bot.getMe();
        
        logResult('Telegram Bot API', 
          botInfo && 
          botInfo.id && 
          botInfo.username === 'MafiaChicagoBot'
        );
      } catch (error) {
        logResult('Telegram Bot API', false, error);
      }
    } else {
      console.log('⚠️ Skipping Telegram Bot API test - no token provided');
    }
    
    try {
      const corsResponse = await axios.options(`${BACKEND_URL}/api/health`, {
        headers: {
          'Origin': FRONTEND_URL,
          'Access-Control-Request-Method': 'GET'
        }
      });
      
      const corsHeaders = corsResponse.headers;
      logResult('CORS Configuration', 
        corsHeaders['access-control-allow-origin'] === FRONTEND_URL || 
        corsHeaders['access-control-allow-origin'] === '*'
      );
    } catch (error) {
      logResult('CORS Configuration', false, error);
    }
    
  } catch (error) {
    console.error('Unexpected error during tests:', error);
  }
  
  console.log('\n=== Test Summary ===');
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log('===================');
  
  return results;
}

if (require.main === module) {
  runTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Fatal error running tests:', error);
      process.exit(1);
    });
}

module.exports = { runTests };
