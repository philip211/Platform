import React, { useEffect, useState } from 'react'
import { useMafiaStore, GamePhase } from '../store/mafiaStore'
import WaitingRoom from './phases/WaitingRoom'
import LocationSelection from './phases/LocationSelection'
import RoleActions from './phases/RoleActions'
import MorningPhase from './phases/MorningPhase'
import DiscussionPhase from './phases/DiscussionPhase'
import VotingPhase from './phases/VotingPhase'
import DeathPhase from './phases/DeathPhase'
import GameOver from './phases/GameOver'
import { joinMafiaGame, getRoomByInviteCode } from '../../../api/mafiaApi'
import Modal from './ui/Modal'
import Toast, { ToastType } from './ui/Toast'
import PhaseTransition from './ui/PhaseTransition'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '../../../hooks/useSocket'
import '../styles/GamePhaseManager.scss'

interface GamePhaseManagerProps {
  telegramId: string
  userName: string
}

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

const GamePhaseManager = ({ telegramId, userName }: GamePhaseManagerProps) => {
  const { phase, createOrJoinRoom, setRoomAndPlayerId } = useMafiaStore()
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [showModal, setShowModal] = useState<{
    isOpen: boolean;
    title: string;
    content: React.ReactNode;
    type?: 'victory' | 'defeat' | 'execution';
  }>({ isOpen: false, title: '', content: null })
  const [transition, setTransition] = useState<{
    type: 'night' | 'morning' | 'execution' | 'victory' | 'defeat';
    isVisible: boolean;
  }>({ type: 'night', isVisible: false })
  
  const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  const { 
    isConnected, 
    error: socketError,
    reconnected,
    joinRoom,
    selectLocation,
    submitAction,
    vote,
    sendGift,
    startGame,
    clearSession
  } = useSocket({
    url: socketUrl,
    namespace: 'mafia',
    autoConnect: true,
    enableReconnect: true
  })
  
  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    return id;
  };
  
  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  const openModal = (title: string, content: React.ReactNode, type?: 'victory' | 'defeat' | 'execution') => {
    setShowModal({ isOpen: true, title, content, type });
  };
  
  useEffect(() => {
    if (reconnected) {
      addToast('Вы успешно восстановили сессию', 'success');
    }
  }, [reconnected]);

  useEffect(() => {
    if (!telegramId || !userName || isJoining) return;
    
    const joinGame = async () => {
      try {
        setIsJoining(true);
        setJoinError(null);
        
        console.log('Joining game with telegramId:', telegramId, 'and name:', userName);
        
        const urlParams = new URLSearchParams(window.location.search);
        const inviteCode = urlParams.get('inviteCode');
        
        if (inviteCode) {
          console.log('Found invite code in URL:', inviteCode);
          
          try {
            const roomResponse = await getRoomByInviteCode(inviteCode);
            console.log('Room found for invite code:', roomResponse.data);
            
            if (roomResponse.data && roomResponse.data.roomId) {
              const joinResponse = await joinMafiaGame(telegramId, userName, inviteCode);
              
              if (joinResponse.data && joinResponse.data.roomId) {
                setRoomAndPlayerId(joinResponse.data.roomId, joinResponse.data.playerId);
                createOrJoinRoom(telegramId, userName);
                console.log('Successfully joined room via invite:', joinResponse.data.roomId);
                
                joinRoom(joinResponse.data.roomId);
                
                addToast('Вы присоединились к игре по приглашению', 'success');
              } else {
                throw new Error('Invalid response format from server');
              }
            } else {
              throw new Error('Invalid room data for invite code');
            }
          } catch (inviteError: any) {
            console.error('Error joining via invite:', inviteError);
            addToast('Не удалось присоединиться по приглашению. Создаем новую комнату...', 'warning');
            
            const response = await joinMafiaGame(telegramId, userName);
            
            if (response.data && response.data.roomId) {
              setRoomAndPlayerId(response.data.roomId, response.data.playerId);
              createOrJoinRoom(telegramId, userName);
              console.log('Fallback: Successfully joined room:', response.data.roomId);
              
              joinRoom(response.data.roomId);
              
              addToast('Вы создали новую игровую комнату', 'success');
            } else {
              throw new Error('Invalid response format from server');
            }
          }
        } else {
          const response = await joinMafiaGame(telegramId, userName);
          console.log('Server response for joining game:', response.data);
          
          if (response.data && response.data.roomId) {
            setRoomAndPlayerId(response.data.roomId, response.data.playerId);
            createOrJoinRoom(telegramId, userName);
            console.log('Successfully joined room:', response.data.roomId);
            
            joinRoom(response.data.roomId);
            
            addToast('Вы создали новую игровую комнату', 'success');
          } else {
            throw new Error('Invalid response format from server');
          }
        }
      } catch (error: any) {
        console.error('Error joining game:', error);
        setJoinError(`Ошибка при подключении к игре: ${error.message || 'неизвестная ошибка'}`);
        addToast(`Ошибка: ${error.message || 'Не удалось подключиться к игре'}`, 'error');
      } finally {
        setIsJoining(false);
      }
    };
    
    joinGame();
  }, [telegramId, userName, createOrJoinRoom, setRoomAndPlayerId, isJoining, joinRoom]);
  
  const handleLeaveGame = () => {
    clearSession(); // Clear localStorage session data
  };

  const renderPhaseComponent = () => {
    if (joinError) {
      return (
        <motion.div 
          className="mafia-chicago__error"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <h2 className="mafia-chicago__subtitle">Ошибка подключения</h2>
          <p>{joinError}</p>
          <button 
            className="mafia-chicago__button"
            onClick={() => {
              setJoinError(null);
              setIsJoining(false);
            }}
          >
            Попробовать снова
          </button>
        </motion.div>
      );
    }
    
    if (isJoining) {
      return (
        <motion.div 
          className="mafia-chicago__loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <h2 className="mafia-chicago__subtitle">Подключение к игре</h2>
          <div className="mafia-chicago__loader"></div>
          <p>Пожалуйста, подождите...</p>
        </motion.div>
      );
    }
    
    if (!isConnected && socketError) {
      addToast(`Ошибка подключения к серверу: ${socketError}`, 'error');
    }
    
    switch (phase) {
      case GamePhase.WAITING_FOR_PLAYERS:
        return <WaitingRoom 
          showToast={addToast} 
          openModal={openModal} 
          onStartGame={startGame}
        />
      case GamePhase.NIGHT_LOCATION_SELECTION:
        return <LocationSelection 
          onSelectLocation={selectLocation}
        />
      case GamePhase.NIGHT_ROLE_ACTIONS:
        return <RoleActions 
          onSubmitAction={submitAction}
        />
      case GamePhase.MORNING:
        return <MorningPhase />
      case GamePhase.DISCUSSION:
        return <DiscussionPhase 
          onSendGift={sendGift}
        />
      case GamePhase.VOTING:
        return <VotingPhase 
          onVote={vote}
        />
      case GamePhase.DEATH:
        return <DeathPhase />
      case GamePhase.GAME_OVER:
        return <GameOver />
      default:
        return <div>Неизвестная фаза игры</div>
    }
  }
  
  const showPhaseTransition = (type: 'night' | 'morning' | 'execution' | 'victory' | 'defeat') => {
    setTransition({ type, isVisible: true });
    
    setTimeout(() => {
      setTransition(prev => ({ ...prev, isVisible: false }));
    }, 2500); // Slightly longer than the transition duration
  };
  
  useEffect(() => {
    if (phase === GamePhase.NIGHT_LOCATION_SELECTION) {
      showPhaseTransition('night');
    } else if (phase === GamePhase.MORNING) {
      showPhaseTransition('morning');
    } else if (phase === GamePhase.DEATH) {
      showPhaseTransition('execution');
    } else if (phase === GamePhase.GAME_OVER) {
      const isMafiaWinner = Math.random() > 0.5; // Replace with actual logic
      showPhaseTransition(isMafiaWinner ? 'defeat' : 'victory');
    }
  }, [phase]);
  
  return (
    <div className="mafia-chicago__phase-manager">
      <AnimatePresence mode="wait">
        {renderPhaseComponent()}
      </AnimatePresence>
      
      {/* Phase transitions */}
      <PhaseTransition 
        type={transition.type}
        isVisible={transition.isVisible}
        onComplete={() => setTransition(prev => ({ ...prev, isVisible: false }))}
      />
      
      {/* Toast notifications */}
      <div className="mafia-chicago__toasts">
        {toasts.map(toast => (
          <Toast 
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
      
      {/* Modal */}
      <Modal 
        isOpen={showModal.isOpen}
        onClose={() => setShowModal(prev => ({ ...prev, isOpen: false }))}
        title={showModal.title}
        className={showModal.type ? `modal--${showModal.type}` : ''}
        animationType="zoom"
      >
        {showModal.content}
      </Modal>
      
      {/* Leave Game Button */}
      {phase === GamePhase.WAITING_FOR_PLAYERS && (
        <div className="mafia-chicago__leave-game">
          <button 
            className="mafia-btn mafia-btn--secondary"
            onClick={handleLeaveGame}
          >
            Покинуть игру
          </button>
        </div>
      )}
    </div>
  )
}

export default GamePhaseManager
