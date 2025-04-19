import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useMafiaStore, GameState, GamePhase, GameMessage } from '../modules/mafia-chicago/store/mafiaStore';
import { useTelegramContext } from '../contexts/TelegramContext';
import crypto from 'crypto-js';

interface UseSocketOptions {
  url: string;
  namespace?: string;
  autoConnect?: boolean;
  enableReconnect?: boolean;
  secure?: boolean;
}

/**
 * Creates a signature for WebSocket authentication
 * @param telegramId User's Telegram ID
 * @param timestamp Current timestamp
 * @param initData Telegram WebApp initData
 * @returns Signature string
 */
const createSignature = (telegramId: number, timestamp: number, initData: string): string => {
  const dataToSign = `${telegramId}:${timestamp}:${initData}`;
  return crypto.SHA256(dataToSign).toString();
};

export const useSocket = ({
  url,
  namespace = 'mafia',
  autoConnect = true,
  enableReconnect = true,
  secure = true,
}: UseSocketOptions) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnected, setReconnected] = useState(false);
  
  const store = useMafiaStore();
  const { user } = useTelegramContext();

  const reconnectToSession = (roomId: string, playerId: string) => {
    if (!socketRef.current || !isConnected) {
      setError('Socket not connected');
      return;
    }

    socketRef.current.emit('reconnect', { roomId, playerId }, (response: any) => {
      console.log('Reconnect response:', response);
      if (response.success) {
        console.log('Successfully reconnected to session:', roomId);
        store.setRoomAndPlayerId(roomId, playerId);
        
        if (response.gameState) {
          store.updateGameStateFromServer(response.gameState);
        }
        
        setReconnected(true);
        addMessage('Вы успешно восстановили сессию', 'system');
      } else {
        setError(`Failed to reconnect: ${response.error}`);
        localStorage.removeItem('mafiaRoomId');
        localStorage.removeItem('mafiaPlayerId');
      }
    });
  };

  const addMessage = (text: string, type: 'system' | 'gift' | 'action' = 'system') => {
    const message: GameMessage = {
      id: `msg_${Date.now()}`,
      text,
      type,
      timestamp: Date.now()
    };
    
    store.messages.push(message);
  };

  useEffect(() => {
    const socketUrl = namespace ? `${url}/${namespace}` : url;
    
    const authHeaders: Record<string, string> = {};
    
    if (secure && user) {
      const timestamp = Date.now();
      const telegramId = user.id.toString();
      const initData = window.Telegram?.WebApp?.initData || '';
      
      authHeaders['x-telegram-id'] = telegramId;
      authHeaders['x-timestamp'] = timestamp.toString();
      
      if (initData) {
        authHeaders['x-telegram-init-data'] = initData;
      } else {
        const signature = createSignature(user.id, timestamp, 'dev-mode');
        authHeaders['x-signature'] = signature;
        authHeaders['x-dev-mode'] = 'true';
      }
    }
    
    socketRef.current = io(socketUrl, {
      autoConnect,
      transports: ['websocket', 'polling'],
      auth: authHeaders,
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      setError(null);
      
      if (enableReconnect) {
        const storedRoomId = localStorage.getItem('mafiaRoomId');
        const storedPlayerId = localStorage.getItem('mafiaPlayerId');
        
        if (storedRoomId && storedPlayerId) {
          console.log('Found stored session, attempting to reconnect...');
          reconnectToSession(storedRoomId, storedPlayerId);
        }
      }
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError(`Connection error: ${err.message}`);
      setIsConnected(false);
    });

    socketRef.current.on('gameStateUpdate', (gameState: GameState) => {
      console.log('Game state update received:', gameState);
      store.updateGameStateFromServer(gameState);
    });

    socketRef.current.on('playerJoined', (data: { userId: string; room: any }) => {
      console.log('Player joined:', data);
      if (data.room) {
        store.updateGameStateFromServer(data.room);
      }
      addMessage(`${data.userId} joined the game`);
    });

    socketRef.current.on('playerDisconnected', (data: { socketId: string }) => {
      console.log('Player disconnected:', data);
      addMessage(`A player disconnected from the game`);
    });

    socketRef.current.on('phaseChanged', (data: { phase: GamePhase; timestamp: string }) => {
      console.log('Phase changed:', data);
      store.phase = data.phase;
      addMessage(`Game phase changed to ${data.phase}`);
    });

    socketRef.current.on('gameStarted', (gameState: GameState) => {
      console.log('Game started:', gameState);
      store.updateGameStateFromServer(gameState);
      addMessage('Game has started!');
    });

    socketRef.current.on('giftSent', (data: { senderId: string; receiverId: string; giftType: string; timestamp: string }) => {
      console.log('Gift sent:', data);
      addMessage(`Player sent a ${data.giftType} gift`, 'gift');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.removeAllListeners();
      }
    };
  }, [url, namespace, autoConnect, store]);

  const joinRoom = (roomId: string) => {
    if (!socketRef.current || !isConnected) {
      setError('Socket not connected');
      return;
    }

    store.setRoomAndPlayerId(roomId, store.playerId || '');
    
    if (enableReconnect && roomId && store.playerId) {
      localStorage.setItem('mafiaRoomId', roomId);
      localStorage.setItem('mafiaPlayerId', store.playerId);
    }
    
    socketRef.current.emit('joinRoom', { roomId, userId: store.playerId }, (response: any) => {
      console.log('Join room response:', response);
      if (response.success) {
        console.log('Successfully joined room:', roomId);
      } else {
        setError(`Failed to join room: ${response.error}`);
      }
    });
  };

  const selectLocation = (roomId: string, locationId: string) => {
    if (!socketRef.current || !isConnected) {
      setError('Socket not connected');
      return;
    }

    socketRef.current.emit(
      'selectLocation',
      { roomId, userId: store.playerId, locationId },
      (response: any) => {
        console.log('Select location response:', response);
        if (!response.success) {
          setError(`Failed to select location: ${response.error}`);
        }
      }
    );
  };

  const submitAction = (roomId: string, action: string, targetId?: string) => {
    if (!socketRef.current || !isConnected) {
      setError('Socket not connected');
      return;
    }

    socketRef.current.emit(
      'submitAction',
      { roomId, userId: store.playerId, action, targetId },
      (response: any) => {
        console.log('Submit action response:', response);
        if (!response.success) {
          setError(`Failed to submit action: ${response.error}`);
        }
      }
    );
  };

  const vote = (roomId: string, targetId: string) => {
    if (!socketRef.current || !isConnected) {
      setError('Socket not connected');
      return;
    }

    socketRef.current.emit(
      'vote',
      { roomId, userId: store.playerId, targetId },
      (response: any) => {
        console.log('Vote response:', response);
        if (!response.success) {
          setError(`Failed to vote: ${response.error}`);
        }
      }
    );
  };

  const sendGift = (roomId: string, receiverId: string, giftType: string) => {
    if (!socketRef.current || !isConnected) {
      setError('Socket not connected');
      return;
    }

    socketRef.current.emit(
      'sendGift',
      { roomId, senderId: store.playerId, receiverId, giftType },
      (response: any) => {
        console.log('Send gift response:', response);
        if (!response.success) {
          setError(`Failed to send gift: ${response.error}`);
        }
      }
    );
  };

  const startGame = (roomId: string) => {
    if (!socketRef.current || !isConnected) {
      setError('Socket not connected');
      return;
    }

    socketRef.current.emit('startGame', { roomId }, (response: any) => {
      console.log('Start game response:', response);
      if (!response.success) {
        setError(`Failed to start game: ${response.error}`);
      }
    });
  };

  const connect = () => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };
  
  const clearSession = () => {
    localStorage.removeItem('mafiaRoomId');
    localStorage.removeItem('mafiaPlayerId');
    setReconnected(false);
  };

  return {
    socket: socketRef.current,
    isConnected,
    error,
    reconnected,
    connect,
    disconnect,
    joinRoom,
    selectLocation,
    submitAction,
    vote,
    sendGift,
    startGame,
    clearSession,
  };
};
