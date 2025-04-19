import React, { useEffect, useState } from 'react'
import { useMafiaStore, GamePhase } from '../store/mafiaStore'
import { useTelegramContext } from '../../../contexts/TelegramContext'
import WaitingRoom from '../components/phases/WaitingRoom'
import LocationSelection from '../components/phases/LocationSelection'
import RoleActions from '../components/phases/RoleActions'
import MorningPhase from '../components/phases/MorningPhase'
import DiscussionPhase from '../components/phases/DiscussionPhase'
import VotingPhase from '../components/phases/VotingPhase'
import DeathPhase from '../components/phases/DeathPhase'
import GameOver from '../components/phases/GameOver'
import { joinMafiaGame, getRoomByInviteCode } from '../../../api/mafiaApi'
import Modal from '../components/ui/Modal'
import Toast, { ToastType } from '../components/ui/Toast'
import PhaseTransition from '../components/ui/PhaseTransition'
import MockModeDemo from '../components/MockModeDemo'
import { useMockGame } from '../hooks/useMockGame'
import { motion, AnimatePresence } from 'framer-motion'
import '../styles/MafiaChicago.scss'

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

const MafiaChicagoGame: React.FC = () => {
  const { user, isReady, isMockMode } = useTelegramContext()
  const { phase, createOrJoinRoom, setRoomAndPlayerId, players, playerId, messages } = useMafiaStore()
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [showMockDemo, setShowMockDemo] = useState(true)
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
    if (!isReady || !user || isJoining) return;
    
    const joinGame = async () => {
      try {
        setIsJoining(true);
        setJoinError(null);
        
        console.log('Joining game with telegramId:', user.id, 'and name:', user.first_name);
        
        const urlParams = new URLSearchParams(window.location.search);
        const inviteCode = urlParams.get('inviteCode') || urlParams.get('invite');
        
        const fromCatalog = document.referrer.includes('/catalog');
        
        if (!inviteCode && !fromCatalog) {
          console.log('No invite code found and not coming from catalog, redirecting to catalog');
          window.location.href = '/catalog';
          addToast('Пожалуйста, выберите игру из каталога', 'info');
          return;
        }
        
        if (inviteCode) {
          console.log('Found invite code in URL:', inviteCode);
          
          try {
            const roomResponse = await getRoomByInviteCode(inviteCode);
            console.log('Room found for invite code:', roomResponse.data);
            
            if (roomResponse.data && roomResponse.data.roomId) {
              const joinResponse = await joinMafiaGame(user.id.toString(), user.first_name, inviteCode);
              
              if (joinResponse.data && joinResponse.data.roomId) {
                setRoomAndPlayerId(joinResponse.data.roomId, joinResponse.data.playerId);
                createOrJoinRoom(user.id.toString(), user.first_name);
                console.log('Successfully joined room via invite:', joinResponse.data.roomId);
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
            
            const response = await joinMafiaGame(user.id.toString(), user.first_name);
            
            if (response.data && response.data.roomId) {
              setRoomAndPlayerId(response.data.roomId, response.data.playerId);
              createOrJoinRoom(user.id.toString(), user.first_name);
              console.log('Fallback: Successfully joined room:', response.data.roomId);
              addToast('Вы создали новую игровую комнату', 'success');
            } else {
              throw new Error('Invalid response format from server');
            }
          }
        } else {
          try {
            const response = await joinMafiaGame(user.id.toString(), user.first_name);
            console.log('Server response for joining game:', response.data);
            
            if (response.data && response.data.roomId) {
              setRoomAndPlayerId(response.data.roomId, response.data.playerId);
              createOrJoinRoom(user.id.toString(), user.first_name);
              console.log('Successfully joined room:', response.data.roomId);
              addToast('Вы создали новую игровую комнату', 'success');
            } else {
              throw new Error('Invalid response format from server');
            }
          } catch (error: any) {
            console.error('Error creating new game:', error);
            setJoinError(`Ошибка при создании игры: ${error.message || 'неизвестная ошибка'}`);
            addToast(`Ошибка: ${error.message || 'Не удалось создать игру'}`, 'error');
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
  }, [isReady, user, createOrJoinRoom, setRoomAndPlayerId, isJoining]);
  
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
    
    switch (phase) {
      case GamePhase.WAITING_FOR_PLAYERS:
        return <WaitingRoom showToast={addToast} openModal={openModal} />
      case GamePhase.NIGHT_LOCATION_SELECTION:
        return <LocationSelection />
      case GamePhase.NIGHT_ROLE_ACTIONS:
        return <RoleActions />
      case GamePhase.MORNING:
        return <MorningPhase />
      case GamePhase.DISCUSSION:
        return <DiscussionPhase />
      case GamePhase.VOTING:
        return <VotingPhase />
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
      const isMafiaWinner = messages.some(msg => msg.text.includes('Мафия победила'));
      showPhaseTransition(isMafiaWinner ? 'defeat' : 'victory');
    }
  }, [phase, messages]);
  
  const renderPlayerList = () => {
    if (!players || players.length === 0) return null;
    
    return (
      <div className="mafia-chicago__player-list">
        <h3 className="mafia-chicago__player-list-title">Игроки</h3>
        <div className="mafia-chicago__players">
          {players.map(player => (
            <div 
              key={player.id} 
              className={`mafia-chicago__player ${!player.isAlive ? 'mafia-chicago__player--dead' : ''} ${player.id === playerId ? 'mafia-chicago__player--current' : ''}`}
            >
              <div className="mafia-chicago__player-avatar">
                {player.name.charAt(0).toUpperCase()}
              </div>
              <div className="mafia-chicago__player-info">
                <span className="mafia-chicago__player-name">{player.name}</span>
                {!player.isAlive && <span className="mafia-chicago__player-status">☠️</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderGameLog = () => {
    if (!messages || messages.length === 0) return null;
    
    return (
      <div className="mafia-chicago__game-log">
        <h3 className="mafia-chicago__game-log-title">События игры</h3>
        <div className="mafia-chicago__log-entries">
          {messages.map((msg, index: number) => (
            <div key={index} className={`mafia-chicago__log-entry mafia-chicago__log-entry--${msg.type || 'info'}`}>
              <span className="mafia-chicago__log-time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
              <span className="mafia-chicago__log-message">{msg.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const { startMockGame } = useMockGame();
  
  const startDemoGame = () => {
    setShowMockDemo(false);
    startMockGame();
    addToast('Демо-игра запущена', 'success');
  };

  return (
    <div className="mafia-chicago">
      <h1 className="mafia-chicago__title">🎩 Мафия: Чикаго</h1>
      
      <div className="mafia-chicago__content">
        {isReady && user ? (
          <>
            {isMockMode && showMockDemo ? (
              <MockModeDemo onStartDemo={startDemoGame} />
            ) : (
              <>
                <div className="mafia-chicago__game-area">
                  <AnimatePresence mode="wait">
                    {renderPhaseComponent()}
                  </AnimatePresence>
                </div>
                
                {renderPlayerList()}
                {renderGameLog()}
              </>
            )}
          </>
        ) : (
          <div className="mafia-chicago__loading">
            <h2 className="mafia-chicago__subtitle">Загрузка Telegram WebApp...</h2>
            <div className="mafia-chicago__loader"></div>
          </div>
        )}
      </div>
      
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
    </div>
  )
}

export default MafiaChicagoGame
