import { useState } from 'react';
import { useMafiaStore, GamePhase } from '../store/mafiaStore';

/**
 * Hook for managing mock game functionality in demo mode
 */
export const useMockGame = () => {
  const mafiaStore = useMafiaStore();
  
  const [isActive, setIsActive] = useState(false);
  
  const startMockGame = () => {
    if (isActive) return;
    
    setIsActive(true);
    
    const mockRoomId = `demo_${Date.now()}`;
    const mockPlayerId = `player_${Date.now()}`;
    mafiaStore.setRoomAndPlayerId(mockRoomId, mockPlayerId);
    
    mafiaStore.createOrJoinRoom('demo_user', 'Вы (Демо)');
    
    mafiaStore.messages.push({
      id: `msg_${Date.now()}`,
      text: 'Добро пожаловать в демо-режим игры "Мафия: Чикаго"',
      type: 'system',
      timestamp: Date.now()
    });
    
    setTimeout(() => {
      addMockPlayers();
    }, 1000);
  };
  
  const addMockPlayers = () => {
    const mockPlayerNames = [
      'Алекс', 'Мария', 'Иван', 'Елена', 
      'Дмитрий', 'Анна', 'Сергей'
    ];
    
    let playerIndex = 0;
    
    const addPlayerInterval = setInterval(() => {
      if (playerIndex < mockPlayerNames.length) {
        const playerName = mockPlayerNames[playerIndex];
        mafiaStore.createOrJoinRoom(`mock_${playerIndex}`, playerName);
        playerIndex++;
      } else {
        clearInterval(addPlayerInterval);
        
        setTimeout(() => {
          mafiaStore.startGame();
          
          simulateGamePhases();
        }, 2000);
      }
    }, 1000);
  };
  
  const simulateGamePhases = () => {
    setTimeout(() => {
      mafiaStore.updateGameStateFromServer({
        phase: GamePhase.MORNING,
        players: mafiaStore.players,
        locations: mafiaStore.locations,
        recentLogs: [{
          id: `msg_${Date.now()}`,
          text: 'Наступает утро. Город просыпается.',
          type: 'system',
          timestamp: Date.now()
        }]
      });
      
      setTimeout(() => {
        mafiaStore.updateGameStateFromServer({
          phase: GamePhase.DISCUSSION,
          players: mafiaStore.players,
          locations: mafiaStore.locations,
          recentLogs: [{
            id: `msg_${Date.now()}`,
            text: 'Начинается обсуждение. Кто может быть мафией?',
            type: 'system',
            timestamp: Date.now()
          }]
        });
        
        setTimeout(() => {
          mafiaStore.updateGameStateFromServer({
            phase: GamePhase.VOTING,
            players: mafiaStore.players,
            locations: mafiaStore.locations,
            recentLogs: [{
              id: `msg_${Date.now()}`,
              text: 'Начинается голосование. Выберите подозреваемого.',
              type: 'system',
              timestamp: Date.now()
            }]
          });
          
          setTimeout(() => {
            const updatedPlayers = [...mafiaStore.players];
            if (updatedPlayers.length > 0) {
              const randomIndex = Math.floor(Math.random() * updatedPlayers.length);
              if (updatedPlayers[randomIndex]) {
                updatedPlayers[randomIndex] = {
                  ...updatedPlayers[randomIndex],
                  isAlive: false
                };
              }
            }
            
            mafiaStore.updateGameStateFromServer({
              phase: GamePhase.DEATH,
              players: updatedPlayers,
              locations: mafiaStore.locations,
              recentLogs: [{
                id: `msg_${Date.now()}`,
                text: 'Игрок был казнен по решению города.',
                type: 'system',
                timestamp: Date.now()
              }]
            });
            
            setTimeout(() => {
              mafiaStore.updateGameStateFromServer({
                phase: GamePhase.NIGHT_LOCATION_SELECTION,
                players: updatedPlayers,
                locations: mafiaStore.locations,
                recentLogs: [{
                  id: `msg_${Date.now()}`,
                  text: 'Наступает ночь. Выберите локацию.',
                  type: 'system',
                  timestamp: Date.now()
                }]
              });
            }, 5000);
          }, 8000);
        }, 10000);
      }, 5000);
    }, 10000);
  };
  
  return {
    startMockGame,
    isActive
  };
};
