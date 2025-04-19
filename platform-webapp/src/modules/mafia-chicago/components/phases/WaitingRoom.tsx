import React, { useEffect, useState } from 'react';
import { useMafiaStore } from '../../store/mafiaStore';
import { getMafiaPlayers, startMafiaGame, createInviteCode } from '../../../../api/mafiaApi';
import { ToastType } from '../ui/Toast';

interface WaitingRoomProps {
  showToast: (message: string, type?: ToastType) => number;
  openModal: (title: string, content: React.ReactNode, type?: 'victory' | 'defeat' | 'execution') => void;
  onStartGame?: (roomId: string) => void;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({ showToast, openModal }) => {
  const { players, startGame, roomId } = useMafiaStore();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [serverPlayers, setServerPlayers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!roomId) {
      console.log('No room ID available yet');
      return;
    }
    
    console.log('Fetching players for room:', roomId);
    
    const fetchPlayers = async () => {
      try {
        setIsLoading(true);
        const response = await getMafiaPlayers(roomId);
        console.log('Server players data:', response.data);
        
        if (Array.isArray(response.data) && response.data.length > 0) {
          setServerPlayers(response.data);
          
          const { players: storePlayersOriginal } = useMafiaStore.getState();
          
          if (response.data.length > storePlayersOriginal.length) {
            console.log('Updating store with server players');
            
            const state = useMafiaStore.getState();
            
            useMafiaStore.setState({
              ...state,
              players: response.data
            });
          }
          
          if (response.data.length === 8) {
            setCountdown(5);
          }
        } else {
          console.log('No players returned from server or invalid data format');
        }
      } catch (error: any) {
        console.error('Error fetching players:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlayers(); // Initial fetch
    const interval = setInterval(fetchPlayers, 1000); // More frequent updates (every second)
    
    return () => clearInterval(interval);
  }, [roomId]);
  
  useEffect(() => {
    if (countdown === null) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timer);
          if (roomId) {
            startMafiaGame(roomId)
              .then(() => {
                startGame();
              })
              .catch((error: any) => {
                console.error('Error starting game:', error);
              });
          } else {
            startGame();
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [countdown, startGame, roomId]);
  
  const handleCreateInvite = async () => {
    if (!roomId || isCreatingInvite) return;
    
    try {
      setIsCreatingInvite(true);
      setInviteError(null);
      
      const response = await createInviteCode(roomId);
      
      if (response.data && response.data.inviteCode) {
        setInviteCode(response.data.inviteCode);
        
        const baseUrl = window.location.origin;
        const inviteUrl = `${baseUrl}/games/mafia-chicago?invite=${response.data.inviteCode}`;
        setInviteUrl(inviteUrl);
      } else {
        setInviteError('Не удалось создать код приглашения');
      }
    } catch (error: any) {
      console.error('Error creating invite code:', error);
      setInviteError(`Ошибка: ${error.message || 'Не удалось создать приглашение'}`);
    } finally {
      setIsCreatingInvite(false);
    }
  };
  
  const copyInviteToClipboard = () => {
    if (!inviteUrl) return;
    
    navigator.clipboard.writeText(inviteUrl)
      .then(() => {
        showToast('Ссылка-приглашение скопирована в буфер обмена', 'success');
      })
      .catch(err => {
        console.error('Не удалось скопировать ссылку:', err);
        showToast('Не удалось скопировать ссылку. Пожалуйста, скопируйте её вручную.', 'error');
      });
  };
  
  const showInviteModal = () => {
    if (!inviteUrl || !inviteCode) return;
    
    const modalContent = (
      <div className="invite-modal-content">
        <p>Отправьте эту ссылку друзьям, чтобы пригласить их в игру:</p>
        <div className="invite-code-box">
          <code>{inviteUrl}</code>
        </div>
        <p>Или используйте код приглашения:</p>
        <div className="invite-code-display">
          <strong>{inviteCode}</strong>
        </div>
        <button 
          className="mafia-chicago__button"
          onClick={copyInviteToClipboard}
        >
          Скопировать ссылку
        </button>
      </div>
    );
    
    openModal('Пригласить игроков', modalContent);
  };
  
  const displayPlayers = serverPlayers.length > 0 ? serverPlayers : players;
  
  return (
    <div className="mafia-chicago__waiting-room">
      <h2 className="mafia-chicago__subtitle">Ожидание игроков</h2>
      
      {isLoading && serverPlayers.length === 0 ? (
        <div className="mafia-chicago__loading">
          <p>Загрузка списка игроков...</p>
        </div>
      ) : (
        <div className="mafia-chicago__players-list">
          <p className="mafia-chicago__players-count">
            Игроков: {displayPlayers.length}/8
          </p>
          
          <ul className="mafia-chicago__players">
            {displayPlayers.map(player => (
              <li key={player.id} className="mafia-chicago__player">
                {player.name || 'Игрок без имени'}
              </li>
            ))}
          </ul>
          
          {/* Placeholder slots for missing players */}
          {Array.from({ length: Math.max(0, 8 - displayPlayers.length) }).map((_, index) => (
            <li key={`empty-${index}`} className="mafia-chicago__player mafia-chicago__player--empty">
              Ожидание игрока...
            </li>
          ))}
        </div>
      )}
      
      {countdown !== null && (
        <div className="mafia-chicago__countdown">
          <p>Игра начнется через {countdown} сек.</p>
        </div>
      )}
      
      {!isLoading && displayPlayers.length < 8 && (
        <div className="mafia-chicago__invite-section">
          <p className="mafia-chicago__waiting-message">
            Ожидаем ещё {8 - displayPlayers.length} игроков для начала игры...
          </p>
          
          {!inviteCode ? (
            <button 
              className="mafia-chicago__button mafia-chicago__invite-button"
              onClick={handleCreateInvite}
              disabled={isCreatingInvite}
            >
              {isCreatingInvite ? 'Создание приглашения...' : 'Пригласить игроков'}
            </button>
          ) : (
            <div className="mafia-chicago__invite-info">
              <p className="mafia-chicago__invite-code">
                Код приглашения: <strong>{inviteCode}</strong>
              </p>
              {inviteUrl && (
                <>
                  <button 
                    className="mafia-chicago__button mafia-chicago__share-button"
                    onClick={showInviteModal}
                  >
                    Поделиться приглашением
                  </button>
                  <button 
                    className="mafia-chicago__button mafia-chicago__copy-button"
                    onClick={copyInviteToClipboard}
                  >
                    Скопировать ссылку
                  </button>
                </>
              )}
            </div>
          )}
          
          {inviteError && (
            <p className="mafia-chicago__error-message">{inviteError}</p>
          )}
        </div>
      )}
      
      <div className="mafia-chicago__debug-info" style={{ fontSize: '10px', color: '#666', marginTop: '20px' }}>
        Room ID: {roomId || 'Not set'}
      </div>
    </div>
  );
}

export default WaitingRoom
