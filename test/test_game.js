const axios = require('axios');
const readline = require('readline');

const API_URL = 'http://localhost:3000';
const NUM_PLAYERS = 8;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const generateRandomId = () => {
  return Math.random().toString(36).substring(2, 10);
};

const createRoomAndAddPlayers = async () => {
  try {
    console.log('Creating test players and joining game...');
    
    const hostId = `test_${generateRandomId()}`;
    const hostName = 'Player 1 (Host)';
    console.log(`Creating room with player: ${hostName} (${hostId})`);
    
    const hostResponse = await axios.post(`${API_URL}/api/mafia/join`, {
      telegramId: hostId,
      name: hostName
    });
    
    const roomId = hostResponse.data.roomId;
    const inviteCode = hostResponse.data.inviteCode;
    
    console.log(`Room created! ID: ${roomId}, Invite Code: ${inviteCode}`);
    
    const initialPlayersResponse = await axios.get(`${API_URL}/api/mafia/players/${roomId}`);
    console.log('Initial players:', JSON.stringify(initialPlayersResponse.data, null, 2));
    
    const players = [];
    players.push({ telegramId: hostId, name: hostName });
    
    for (let i = 2; i <= NUM_PLAYERS; i++) {
      const playerId = `test_${generateRandomId()}`;
      const playerName = `Player ${i}`;
      
      console.log(`Adding player: ${playerName} (${playerId})`);
      
      try {
        await axios.post(`${API_URL}/api/mafia/join`, {
          telegramId: playerId,
          name: playerName,
          inviteCode
        });
        
        players.push({ telegramId: playerId, name: playerName });
      } catch (error) {
        console.error(`Error adding player ${i}:`, error.message);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const finalPlayersResponse = await axios.get(`${API_URL}/api/mafia/players/${roomId}`);
    console.log('Final players list:', JSON.stringify(finalPlayersResponse.data, null, 2));
    
    console.log(`Total players joined: ${finalPlayersResponse.data.length}/${NUM_PLAYERS}`);
    
    if (finalPlayersResponse.data.length === NUM_PLAYERS) {
      console.log('Test completed successfully!');
      console.log('Room ID:', roomId);
      console.log('Invite Code:', inviteCode);
      console.log('Players:', JSON.stringify(players, null, 2));
      
      rl.question('Do you want to start the game? (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          try {
            await axios.post(`${API_URL}/api/mafia/start/${roomId}`);
            console.log('Game started successfully!');
          } catch (error) {
            console.error('Error starting game:', error.message);
          }
        }
        rl.close();
      });
    } else {
      console.log('Not all players joined successfully.');
      rl.close();
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    rl.close();
  }
};

createRoomAndAddPlayers();
