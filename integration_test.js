/**
 * Mafia: Chicago Platform Integration Test
 * 
 * This script tests the complete integration between all components:
 * - Telegram Bot
 * - Frontend WebApp
 * - Backend API
 * - Database
 * 
 * Usage: 
 * 1. Set environment variables:
 *    - BOT_TOKEN: Your Telegram bot token
 *    - FRONTEND_URL: URL to your deployed frontend
 *    - BACKEND_URL: URL to your deployed backend
 * 
 * 2. Run: node integration_test.js
 */

const axios = require('axios');
const { Telegraf } = require('telegraf');
const { v4: uuidv4 } = require('uuid');

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://mafia-chicago-game.surge.sh';
const BACKEND_URL = process.env.BACKEND_URL || 'https://mafia-chicago-api.onrender.com';

if (!BOT_TOKEN) {
  console.error('ERROR: BOT_TOKEN environment variable is required');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

async function runTests() {
  console.log('=== Mafia: Chicago Platform Integration Test ===');
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log('===============================================');

  const results = {
    frontend: false,
    backend: false,
    bot: false,
    database: false,
    gameCreation: false,
    userAuth: false,
    gameFlow: false
  };

  try {
    console.log('\n1. Testing frontend accessibility...');
    try {
      const frontendResponse = await axios.get(FRONTEND_URL);
      console.log(`✅ Frontend is accessible (status ${frontendResponse.status})`);
      results.frontend = true;
    } catch (error) {
      console.error(`❌ Frontend is not accessible: ${error.message}`);
    }

    console.log('\n2. Testing backend accessibility...');
    try {
      const backendResponse = await axios.get(`${BACKEND_URL}/api/health`);
      console.log(`✅ Backend is accessible (status ${backendResponse.status})`);
      results.backend = true;
    } catch (error) {
      console.error(`❌ Backend is not accessible: ${error.message}`);
    }

    console.log('\n3. Testing Telegram bot...');
    try {
      const botInfo = await bot.telegram.getMe();
      console.log(`✅ Bot is accessible: @${botInfo.username}`);
      results.bot = true;
    } catch (error) {
      console.error(`❌ Bot is not accessible: ${error.message}`);
    }

    console.log('\n4. Testing database connection...');
    try {
      const dbResponse = await axios.get(`${BACKEND_URL}/api/health`);
      if (dbResponse.data && dbResponse.data.status === 'ok') {
        console.log('✅ Database connection is working');
        results.database = true;
      } else {
        console.error('❌ Database connection is not working');
      }
    } catch (error) {
      console.error(`❌ Database connection test failed: ${error.message}`);
    }

    console.log('\n5. Testing game creation...');
    try {
      const inviteCode = uuidv4().substring(0, 6).toUpperCase();
      
      const createRoomResponse = await axios.post(`${BACKEND_URL}/api/mafia/rooms`, {
        inviteCode,
        creatorId: 'test-user-' + Date.now(),
        maxPlayers: 8
      });
      
      if (createRoomResponse.data && createRoomResponse.data.id) {
        console.log(`✅ Game room created with ID: ${createRoomResponse.data.id}`);
        console.log(`   Invite code: ${inviteCode}`);
        results.gameCreation = true;
        
        console.log('\n6. Testing user authentication...');
        try {
          const testUser = {
            id: 'test-user-' + Date.now(),
            username: 'test_user_' + Date.now(),
            firstName: 'Test',
            lastName: 'User'
          };
          
          const authResponse = await axios.post(`${BACKEND_URL}/api/user/auth`, testUser);
          
          if (authResponse.data && authResponse.data.token) {
            console.log('✅ User authentication successful');
            results.userAuth = true;
          } else {
            console.error('❌ User authentication failed');
          }
        } catch (error) {
          console.error(`❌ User authentication test failed: ${error.message}`);
        }
        
        console.log('\n7. Testing game flow...');
        try {
          const joinRoomResponse = await axios.post(`${BACKEND_URL}/api/mafia/rooms/${inviteCode}/join`, {
            userId: 'test-user-' + Date.now()
          });
          
          if (joinRoomResponse.data) {
            console.log('✅ Joined game room successfully');
            results.gameFlow = true;
          } else {
            console.error('❌ Failed to join game room');
          }
        } catch (error) {
          console.error(`❌ Game flow test failed: ${error.message}`);
        }
      } else {
        console.error('❌ Failed to create game room');
      }
    } catch (error) {
      console.error(`❌ Game creation test failed: ${error.message}`);
    }

    console.log('\n===============================================');
    console.log('INTEGRATION TEST SUMMARY:');
    console.log(`Frontend: ${results.frontend ? '✅ OK' : '❌ FAILED'}`);
    console.log(`Backend: ${results.backend ? '✅ OK' : '❌ FAILED'}`);
    console.log(`Bot: ${results.bot ? '✅ OK' : '❌ FAILED'}`);
    console.log(`Database: ${results.database ? '✅ OK' : '❌ FAILED'}`);
    console.log(`Game Creation: ${results.gameCreation ? '✅ OK' : '❌ FAILED'}`);
    console.log(`User Authentication: ${results.userAuth ? '✅ OK' : '❌ FAILED'}`);
    console.log(`Game Flow: ${results.gameFlow ? '✅ OK' : '❌ FAILED'}`);
    console.log('===============================================');
    
    const allPassed = Object.values(results).every(result => result === true);
    
    if (allPassed) {
      console.log('✅ All integration tests passed!');
      console.log('The platform is properly deployed and all components are working together.');
    } else {
      console.log('❌ Some integration tests failed.');
      console.log('Please check the issues above and fix them before proceeding.');
    }
  } catch (error) {
    console.error('Error running integration tests:', error);
  }
}

runTests();
