import { useState, useEffect } from 'react'
import { useMafiaStore, GiftType } from '../../store/mafiaStore'

interface DiscussionPhaseProps {
  onSendGift?: (roomId: string, receiverId: string, giftType: string) => void;
}

const DiscussionPhase: React.FC<DiscussionPhaseProps> = ({ onSendGift }) => {
  const { players, messages, sendGift, roomId } = useMafiaStore()
  const [timeLeft, setTimeLeft] = useState(60) // 60 seconds for discussion
  const [showGiftModal, setShowGiftModal] = useState(false)
  const [selectedGift, setSelectedGift] = useState<GiftType | null>(null)
  const [selectedReceiver, setSelectedReceiver] = useState<string | null>(null)
  
  const currentPlayer = players[0] // Placeholder
  
  const recentMessages = messages.slice(-10).reverse()
  
  useEffect(() => {
    if (timeLeft <= 0) return
    
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1)
      
      if (timeLeft === 1) {
        console.log('Advancing to voting phase')
      }
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [timeLeft])
  
  const handleSendGift = () => {
    if (!currentPlayer || !selectedGift || !selectedReceiver) return
    
    sendGift(currentPlayer.id, selectedReceiver, selectedGift)
    
    if (onSendGift && roomId) {
      onSendGift(roomId, selectedReceiver, selectedGift)
    }
    
    setShowGiftModal(false)
    setSelectedGift(null)
    setSelectedReceiver(null)
  }
  
  const getGiftEmoji = (giftType: GiftType): string => {
    switch (giftType) {
      case GiftType.CIGAR:
        return '🚬'
      case GiftType.WHISKEY:
        return '🥃'
      case GiftType.KISS:
        return '💋'
      case GiftType.ROSE:
        return '🌹'
      case GiftType.HARMONICA:
        return '🪗'
      case GiftType.BULLET:
        return '🔫'
      default:
        return '🎁'
    }
  }
  
  const getGiftName = (giftType: GiftType): string => {
    switch (giftType) {
      case GiftType.CIGAR:
        return 'Сигара'
      case GiftType.WHISKEY:
        return 'Виски'
      case GiftType.KISS:
        return 'Поцелуй'
      case GiftType.ROSE:
        return 'Роза'
      case GiftType.HARMONICA:
        return 'Гармошка'
      case GiftType.BULLET:
        return 'Пуля'
      default:
        return 'Подарок'
    }
  }
  
  return (
    <div className="mafia-chicago__discussion">
      <h2 className="mafia-chicago__subtitle">Обсуждение</h2>
      
      <div className="mafia-chicago__timer">
        Осталось времени: {timeLeft} сек.
      </div>
      
      <div className="mafia-chicago__chat">
        {recentMessages.map(msg => (
          <div 
            key={msg.id} 
            className={`mafia-chicago__message mafia-chicago__message--${msg.type}`}
          >
            {msg.text}
          </div>
        ))}
      </div>
      
      <div className="mafia-chicago__actions">
        <button 
          className="mafia-btn mafia-btn--primary"
          onClick={() => setShowGiftModal(true)}
        >
          Отправить подарок
        </button>
      </div>
      
      {/* Gift Modal */}
      {showGiftModal && (
        <div className="mafia-modal">
          <div className="mafia-modal__overlay" onClick={() => setShowGiftModal(false)}></div>
          <div className="mafia-modal__content">
            <button 
              className="mafia-modal__close"
              onClick={() => setShowGiftModal(false)}
            >
              ×
            </button>
            
            <h3 className="mafia-modal__title">Отправить подарок</h3>
            
            <div className="mafia-chicago__gift-selection">
              <h4>Выберите подарок:</h4>
              <div className="mafia-chicago__gifts-grid">
                {Object.values(GiftType).map(gift => (
                  <button
                    key={gift}
                    className={`mafia-chicago__gift-btn ${selectedGift === gift ? 'mafia-chicago__gift-btn--selected' : ''}`}
                    onClick={() => setSelectedGift(gift)}
                  >
                    <div className="mafia-chicago__gift-emoji">{getGiftEmoji(gift)}</div>
                    <div className="mafia-chicago__gift-name">{getGiftName(gift)}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mafia-chicago__receiver-selection">
              <h4>Выберите получателя:</h4>
              <div className="mafia-chicago__receivers-list">
                {players
                  .filter(p => p.id !== currentPlayer?.id)
                  .map(player => (
                    <button
                      key={player.id}
                      className={`mafia-chicago__receiver-btn ${selectedReceiver === player.id ? 'mafia-chicago__receiver-btn--selected' : ''}`}
                      onClick={() => setSelectedReceiver(player.id)}
                    >
                      {player.name} {!player.isAlive ? '(тень)' : ''}
                    </button>
                  ))
                }
              </div>
            </div>
            
            <div className="mafia-chicago__modal-actions">
              <button 
                className="mafia-btn mafia-btn--primary"
                onClick={handleSendGift}
                disabled={!selectedGift || !selectedReceiver}
              >
                Отправить
              </button>
              <button 
                className="mafia-btn mafia-btn--secondary"
                onClick={() => setShowGiftModal(false)}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DiscussionPhase
