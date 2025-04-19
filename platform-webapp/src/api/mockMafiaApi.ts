import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

interface MockRoom {
  id: string;
  name: string;
  status: string;
  players: string[];
  phase: string;
  createdAt: string;
}

interface MockPlayer {
  id: string;
  telegramId: string;
  name: string;
  roomId: string;
  role: string | null;
  isAlive: boolean;
  location: string | null;
  joinedAt: string;
}

const mockRooms = new Map<string, MockRoom>();
const mockPlayers = new Map<string, MockPlayer>();
const mockInviteCodes = new Map<string, string>();

const defaultRoomId = 'room-123456';
mockRooms.set(defaultRoomId, {
  id: defaultRoomId,
  name: 'Чикаго',
  status: 'waiting',
  players: [],
  phase: 'waiting',
  createdAt: new Date().toISOString(),
});

const defaultInviteCode = 'TEST123';
mockInviteCodes.set(defaultInviteCode, defaultRoomId);

export const setupMockApi = (): void => {
  console.log('Setting up mock API for Mafia Chicago game');
  
  const originalAdapter = axios.defaults.adapter;
  
  axios.defaults.adapter = async (config: any): Promise<any> => {
    if (config.url?.includes('/api/mafia/')) {
      console.log('Intercepting mafia API request:', config.url);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (config.url.includes('/api/mafia/join')) {
        return mockJoinGameResponse(config);
      }
      
      if (config.url.includes('/api/mafia/room-by-invite')) {
        return mockGetRoomByInviteResponse(config);
      }
      
      if (config.url.includes('/api/mafia/players/')) {
        return mockGetPlayersResponse(config);
      }
      
      if (config.url.includes('/api/mafia/start/')) {
        return mockStartGameResponse(config);
      }
      
      return {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { success: true, message: 'Mock API response' },
        config,
        request: {}
      };
    }
    
    try {
      if (originalAdapter && typeof originalAdapter === 'function') {
        return await originalAdapter(config);
      }
      
      return {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { success: true, message: 'Mock API fallback response' },
        config,
        request: {}
      };
    } catch (error) {
      console.log('Error in original request, using mock:', error);
      
      return {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { success: true, message: 'Mock API fallback response' },
        config,
        request: {}
      };
    }
  };
};

const mockJoinGameResponse = (config: AxiosRequestConfig): any => {
  console.log('Mocking join game response');
  
  try {
    const data = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const { telegramId, name, inviteCode } = data;
    
    let roomId: string;
    
    if (inviteCode && mockInviteCodes.has(inviteCode)) {
      roomId = mockInviteCodes.get(inviteCode) || defaultRoomId;
    } else {
      roomId = 'room-' + Math.random().toString(36).substring(2, 8);
      mockRooms.set(roomId, {
        id: roomId,
        name: 'Чикаго',
        status: 'waiting',
        players: [],
        phase: 'waiting',
        createdAt: new Date().toISOString(),
      });
      
      const newInviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      mockInviteCodes.set(newInviteCode, roomId);
    }
    
    const playerId = 'player-' + Math.random().toString(36).substring(2, 8);
    const player: MockPlayer = {
      id: playerId,
      telegramId,
      name,
      roomId,
      role: null,
      isAlive: true,
      location: null,
      joinedAt: new Date().toISOString(),
    };
    
    mockPlayers.set(playerId, player);
    
    const room = mockRooms.get(roomId);
    if (room) {
      room.players.push(playerId);
    }
    
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      data: {
        roomId,
        playerId,
        success: true,
      },
      config,
      request: {}
    };
  } catch (error) {
    console.error('Error in mock join game:', error);
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      data: {
        roomId: defaultRoomId,
        playerId: 'player-fallback',
        success: true,
      },
      config,
      request: {}
    };
  }
};

const mockGetRoomByInviteResponse = (config: AxiosRequestConfig): any => {
  console.log('Mocking get room by invite response');
  
  try {
    const url = new URL(config.url || '', window.location.origin);
    const inviteCode = url.searchParams.get('code');
    
    if (inviteCode && mockInviteCodes.has(inviteCode)) {
      const roomId = mockInviteCodes.get(inviteCode) || defaultRoomId;
      const room = mockRooms.get(roomId);
      
      if (room) {
        return {
          status: 200,
          statusText: 'OK',
          headers: {},
          data: {
            roomId,
            name: room.name,
            status: room.status,
            playerCount: room.players.length,
            success: true,
          },
          config,
          request: {}
        };
      }
    }
    
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      data: {
        roomId: defaultRoomId,
        name: 'Чикаго (Тестовая)',
        status: 'waiting',
        playerCount: 1,
        success: true,
      },
      config,
      request: {}
    };
  } catch (error) {
    console.error('Error in mock get room by invite:', error);
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      data: {
        roomId: defaultRoomId,
        name: 'Чикаго (Тестовая)',
        status: 'waiting',
        playerCount: 1,
        success: true,
      },
      config,
      request: {}
    };
  }
};

const mockGetPlayersResponse = (config: AxiosRequestConfig): any => {
  console.log('Mocking get players response');
  
  try {
    const urlParts = (config.url || '').split('/');
    const roomId = urlParts[urlParts.length - 1];
    
    if (mockRooms.has(roomId)) {
      const room = mockRooms.get(roomId);
      if (room) {
        const players = room.players.map(playerId => mockPlayers.get(playerId)).filter(Boolean);
        
        return {
          status: 200,
          statusText: 'OK',
          headers: {},
          data: {
            players,
            success: true,
          },
          config,
          request: {}
        };
      }
    }
    
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      data: {
        players: [
          {
            id: 'player-mock1',
            telegramId: '123456789',
            name: 'Игрок 1',
            roomId: defaultRoomId,
            role: null,
            isAlive: true,
            location: null,
            joinedAt: new Date().toISOString(),
          }
        ],
        success: true,
      },
      config,
      request: {}
    };
  } catch (error) {
    console.error('Error in mock get players:', error);
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      data: {
        players: [],
        success: true,
      },
      config,
      request: {}
    };
  }
};

const mockStartGameResponse = (config: AxiosRequestConfig): any => {
  console.log('Mocking start game response');
  
  try {
    const urlParts = (config.url || '').split('/');
    const roomId = urlParts[urlParts.length - 1];
    
    if (mockRooms.has(roomId)) {
      const room = mockRooms.get(roomId);
      if (room) {
        room.status = 'playing';
        room.phase = 'night_location';
        
        const roles = ['mafia', 'doctor', 'detective', 'civilian', 'civilian', 'civilian', 'civilian', 'civilian'];
        
        if (room.players.length > 0) {
          room.players.forEach((playerId, index) => {
            const player = mockPlayers.get(playerId);
            if (player) {
              player.role = roles[index % roles.length];
            }
          });
        }
        
        return {
          status: 200,
          statusText: 'OK',
          headers: {},
          data: {
            success: true,
            message: 'Game started',
            phase: room.phase,
          },
          config,
          request: {}
        };
      }
    }
    
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      data: {
        success: true,
        message: 'Game started (mock)',
        phase: 'night_location',
      },
      config,
      request: {}
    };
  } catch (error) {
    console.error('Error in mock start game:', error);
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      data: {
        success: true,
        message: 'Game started (fallback)',
        phase: 'night_location',
      },
      config,
      request: {}
    };
  }
};
