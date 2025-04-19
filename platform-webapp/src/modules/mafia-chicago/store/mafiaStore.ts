import { create } from 'zustand'
import { 
  joinMafiaGame, 
  getMafiaPlayers, 
  startMafiaGame, 
  getGameState,
  submitRoleAction,
  resolveNight,
  submitVote,
  resolveVote,
  checkVictory,
  sendGift as apiSendGift
} from '../../../api/mafiaApi'

export enum GamePhase {
  WAITING_FOR_PLAYERS = 'waiting_for_players',
  NIGHT_LOCATION_SELECTION = 'night_location_selection',
  NIGHT_ROLE_ACTIONS = 'night_role_actions',
  MORNING = 'morning',
  DISCUSSION = 'discussion',
  VOTING = 'voting',
  DEATH = 'death',
  GAME_OVER = 'game_over'
}

export enum PlayerRole {
  MAFIA = 'mafia',
  DOCTOR = 'doctor',
  SHERIFF = 'sheriff',
  CIVILIAN = 'civilian'
}

export enum Location {
  DOWNTOWN = 'downtown',
  HARBOR = 'harbor',
  SPEAKEASY = 'speakeasy',
  THEATER = 'theater',
  PARK = 'park'
}

export enum GiftType {
  CIGAR = 'cigar',
  WHISKEY = 'whiskey',
  KISS = 'kiss',
  ROSE = 'rose',
  HARMONICA = 'harmonica',
  BULLET = 'bullet'
}

export interface Player {
  id: string
  telegramId: string
  name: string
  role: PlayerRole
  isAlive: boolean
  isShadow: boolean
  selectedLocation?: Location
  canAct: boolean
  skipNextTurn: boolean
}

export interface GameMessage {
  id: string
  text: string
  type: 'system' | 'gift' | 'action'
  timestamp: number
}

export interface LocationStatus {
  location: Location
  isOpen: boolean
  murderCount: number
  playersCount: number // Only visible to Mafia, Sheriff, Doctor
}

export interface GameState {
  phase: GamePhase
  players: Player[]
  locations: LocationStatus[]
  recentLogs?: GameMessage[]
}

export interface MafiaGameState {
  gameId: string | null
  roomId: string | null
  playerId: string | null
  phase: GamePhase
  players: Player[]
  messages: GameMessage[]
  locations: LocationStatus[]
  currentPlayerId: string | null
  timeLeft: number
  isModalOpen: boolean
  modalContent: string
  
  joinGame: (telegramId: string, name: string, roomId?: string) => void
  createOrJoinRoom: (telegramId: string, name: string, inviteCode?: string) => void
  setRoomAndPlayerId: (roomId: string, playerId: string) => void
  selectLocation: (playerId: string, location: Location) => void
  performRoleAction: (playerId: string, targetId: string | null) => Promise<void>
  sendGift: (fromPlayerId: string, toPlayerId: string, giftType: GiftType) => Promise<void>
  vote: (voterId: string, targetId: string | null) => Promise<void>
  skipVote: (playerId: string) => void
  closeModal: () => void
  startGame: () => void
  resetGame: () => void
  updateGameStateFromServer: (gameState: GameState) => void
}

const initialLocations: LocationStatus[] = [
  { location: Location.DOWNTOWN, isOpen: true, murderCount: 0, playersCount: 0 },
  { location: Location.HARBOR, isOpen: true, murderCount: 0, playersCount: 0 },
  { location: Location.SPEAKEASY, isOpen: true, murderCount: 0, playersCount: 0 },
  { location: Location.THEATER, isOpen: true, murderCount: 0, playersCount: 0 },
  { location: Location.PARK, isOpen: true, murderCount: 0, playersCount: 0 }
]

export const useMafiaStore = create<MafiaGameState>((set, get) => ({
  gameId: null,
  roomId: null,
  playerId: null,
  phase: GamePhase.WAITING_FOR_PLAYERS,
  players: [],
  messages: [],
  locations: [...initialLocations],
  currentPlayerId: null,
  timeLeft: 0,
  isModalOpen: false,
  modalContent: '',
  
  createOrJoinRoom: async (telegramId, name, inviteCode) => {
    try {
      const response = await joinMafiaGame(telegramId, name, inviteCode);
      
      if (response.data && response.data.roomId && response.data.playerId) {
        set(state => ({
          roomId: response.data.roomId,
          playerId: response.data.playerId,
          messages: [...state.messages, {
            id: `msg_${Date.now()}`,
            text: `${name} присоединился к игре`,
            type: 'system',
            timestamp: Date.now()
          }]
        }));
        
        const playersResponse = await getMafiaPlayers(response.data.roomId);
        if (playersResponse.data && Array.isArray(playersResponse.data)) {
          set({
            players: playersResponse.data
          });
          
          if (playersResponse.data.length === 8) {
            await startMafiaGame(response.data.roomId);
            get().startGame();
          }
        }
      }
    } catch (error) {
      console.error('Error joining game:', error);
    }
  },
  
  joinGame: (telegramId, name, roomId) => {
    const { players, phase } = get()
    
    if (phase !== GamePhase.WAITING_FOR_PLAYERS || players.length >= 8) return
    if (players.some(p => p.telegramId === telegramId)) return
    
    const newPlayer: Player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      telegramId,
      name,
      role: PlayerRole.CIVILIAN, // Default role, will be assigned properly when game starts
      isAlive: true,
      isShadow: false,
      canAct: true,
      skipNextTurn: false
    }
    
    set(state => ({
      roomId: roomId || state.roomId,
      players: [...state.players, newPlayer],
      messages: [...state.messages, {
        id: `msg_${Date.now()}`,
        text: `${name} присоединился к игре`,
        type: 'system',
        timestamp: Date.now()
      }]
    }))
    
    if (players.length + 1 === 8) {
      get().startGame()
    }
  },
  
  selectLocation: (playerId, location) => {
    const { phase, locations } = get()
    
    if (phase !== GamePhase.NIGHT_LOCATION_SELECTION) return
    
    const locationStatus = locations.find(l => l.location === location)
    if (!locationStatus || !locationStatus.isOpen) return
    
    set(state => ({
      players: state.players.map(p => 
        p.id === playerId ? { ...p, selectedLocation: location } : p
      ),
      locations: state.locations.map(l => 
        l.location === location ? { ...l, playersCount: l.playersCount + 1 } : l
      )
    }))
    
    const updatedPlayers = get().players
    const allPlayersSelected = updatedPlayers
      .filter(p => p.isAlive && !p.skipNextTurn)
      .every(p => p.selectedLocation !== undefined)
    
    if (allPlayersSelected) {
      set({
        phase: GamePhase.NIGHT_ROLE_ACTIONS,
        messages: [...get().messages, {
          id: `msg_${Date.now()}`,
          text: 'Все игроки выбрали локации. Наступает время ночных действий.',
          type: 'system',
          timestamp: Date.now()
        }]
      })
    }
  },
  
  performRoleAction: async (playerId, targetId) => {
    try {
      if (!playerId || !targetId) return;
      
      const player = get().players.find(p => p.id === playerId);
      if (!player) return;
      
      const location = player.selectedLocation;
      const action = player.role.toUpperCase();
      
      await submitRoleAction(playerId, targetId, action, location);
      
      set(state => ({
        messages: [...state.messages, {
          id: `msg_${Date.now()}`,
          text: 'Вы выполнили действие своей роли.',
          type: 'system',
          timestamp: Date.now()
        }]
      }));
      
      const { roomId } = get();
      if (roomId) {
        const allPlayersActed = true; // This would be determined by the backend
        
        if (allPlayersActed) {
          try {
            await resolveNight(roomId);
            
            set(state => ({
              phase: GamePhase.MORNING,
              messages: [...state.messages, {
                id: `msg_${Date.now()}`,
                text: 'Ночь закончилась. Наступает утро.',
                type: 'system',
                timestamp: Date.now()
              }]
            }));
            
            const gameStateResponse = await getGameState(roomId);
            if (gameStateResponse.data) {
              get().updateGameStateFromServer(gameStateResponse.data);
            }
          } catch (error) {
            console.error('Error resolving night phase:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error performing role action:', error);
    }
  },
  
  updateGameStateFromServer: (gameState) => {
    if (!gameState) return;
    
    set(state => ({
      phase: gameState.phase || state.phase,
      players: gameState.players || state.players,
      locations: gameState.locations || state.locations,
      messages: [...state.messages, ...(gameState.recentLogs || [])],
    }));
  },
  
  sendGift: async (fromPlayerId, toPlayerId, giftType) => {
    try {
      const { players } = get();
      const sender = players.find(p => p.id === fromPlayerId);
      const receiver = players.find(p => p.id === toPlayerId);
      
      if (!sender || !receiver) return;
      
      await apiSendGift(fromPlayerId, toPlayerId, giftType);
      
      let giftEmoji = '🎁';
      let giftName = 'подарок';
      
      switch (giftType) {
        case GiftType.CIGAR:
          giftEmoji = '🚬';
          giftName = 'сигару';
          break;
        case GiftType.WHISKEY:
          giftEmoji = '🥃';
          giftName = 'виски';
          break;
        case GiftType.KISS:
          giftEmoji = '💋';
          giftName = 'поцелуй';
          break;
        case GiftType.ROSE:
          giftEmoji = '🌹';
          giftName = 'розу';
          break;
        case GiftType.HARMONICA:
          giftEmoji = '🪗';
          giftName = 'гармошку';
          break;
        case GiftType.BULLET:
          giftEmoji = '🔫';
          giftName = 'пулю';
          break;
      }
      
      set(state => ({
        messages: [...state.messages, {
          id: `msg_${Date.now()}`,
          text: `${sender.name} отправил ${giftEmoji} ${giftName} игроку ${receiver.name}`,
          type: 'gift',
          timestamp: Date.now()
        }]
      }));
      
      const { roomId } = get();
      if (roomId) {
        const gameStateResponse = await getGameState(roomId);
        if (gameStateResponse.data) {
          get().updateGameStateFromServer(gameStateResponse.data);
        }
      }
    } catch (error) {
      console.error('Error sending gift:', error);
    }
  },
  
  vote: async (voterId, targetId) => {
    try {
      if (!voterId || !targetId) return;
      
      await submitVote(voterId, targetId);
      
      set(state => ({
        messages: [...state.messages, {
          id: `msg_${Date.now()}`,
          text: 'Ваш голос учтен.',
          type: 'system',
          timestamp: Date.now()
        }]
      }));
      
      const { roomId } = get();
      if (roomId) {
        const allPlayersVoted = true; // This would be determined by the backend
        
        if (allPlayersVoted) {
          try {
            await resolveVote(roomId);
            
            set(state => ({
              phase: GamePhase.DEATH,
              messages: [...state.messages, {
                id: `msg_${Date.now()}`,
                text: 'Голосование завершено.',
                type: 'system',
                timestamp: Date.now()
              }]
            }));
            
            const gameStateResponse = await getGameState(roomId);
            if (gameStateResponse.data) {
              get().updateGameStateFromServer(gameStateResponse.data);
            }
            
            await checkVictory(roomId);
          } catch (error) {
            console.error('Error resolving vote:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
    }
  },
  
  skipVote: (playerId) => {
    const player = get().players.find(p => p.id === playerId)
    if (!player) return
    
    set(state => ({
      messages: [...state.messages, {
        id: `msg_${Date.now()}`,
        text: `${player.name} воздержался от голосования.`,
        type: 'system',
        timestamp: Date.now()
      }]
    }))
  },
  
  closeModal: () => {
    set({ isModalOpen: false, modalContent: '' })
  },
  
  startGame: () => {
    const { players } = get()
    
    if (players.length !== 8) return
    
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5)
    
    const assignedPlayers = shuffledPlayers.map((player, index) => {
      let role = PlayerRole.CIVILIAN
      
      if (index === 0) role = PlayerRole.MAFIA
      else if (index === 1) role = PlayerRole.DOCTOR
      else if (index === 2) role = PlayerRole.SHERIFF
      
      return { ...player, role }
    })
    
    set({
      players: assignedPlayers,
      phase: GamePhase.NIGHT_LOCATION_SELECTION,
      gameId: `game_${Date.now()}`,
      messages: [...get().messages, {
        id: `msg_${Date.now()}`,
        text: 'Игра началась! Роли распределены. Наступает ночь, выберите локацию.',
        type: 'system',
        timestamp: Date.now()
      }]
    })
  },
  
  resetGame: () => {
    set({
      gameId: null,
      phase: GamePhase.WAITING_FOR_PLAYERS,
      players: [],
      messages: [],
      locations: [...initialLocations],
      currentPlayerId: null,
      timeLeft: 0,
      isModalOpen: false,
      modalContent: ''
    })
  },
  
  setRoomAndPlayerId: (roomId, playerId) => {
    set({ roomId, playerId })
  }
}))
