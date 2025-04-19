import { useEffect, useState } from 'react'
import { useMafiaStore, GamePhase } from '../../store/mafiaStore'

interface DeathPhaseProps {
}

const DeathPhase: React.FC<DeathPhaseProps> = () => {
  const { players, messages, phase } = useMafiaStore()
  const [timeLeft, setTimeLeft] = useState(10) // 10 seconds for death phase
  
  const deathMessages = messages
    .filter(msg => msg.type === 'system')
    .slice(-3) // Just show the last few messages
  
  useEffect(() => {
    if (timeLeft <= 0) return
    
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1)
      
      if (timeLeft === 1 && phase === GamePhase.DEATH) {
        console.log('Advancing to night location selection phase')
      }
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [timeLeft, phase])
  
  return (
    <div className="mafia-chicago__death">
      <h2 className="mafia-chicago__subtitle">Казнь</h2>
      
      <div className="mafia-chicago__death-news">
        {deathMessages.length > 0 ? (
          deathMessages.map(msg => (
            <p key={msg.id} className="mafia-chicago__death-message">
              {msg.text}
            </p>
          ))
        ) : (
          <p className="mafia-chicago__death-message">
            Сегодня никто не был казнен.
          </p>
        )}
      </div>
      
      <div className="mafia-chicago__players-status">
        <h3>Статус игроков:</h3>
        <ul className="mafia-chicago__players-list">
          {players.map(player => (
            <li 
              key={player.id} 
              className={`mafia-chicago__player-status ${!player.isAlive ? 'mafia-chicago__player-status--dead' : ''}`}
            >
              {player.name} - {player.isAlive ? 'Жив' : 'Мертв'}
              {player.isShadow && ' (Тень)'}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="mafia-chicago__timer">
        Ночь наступит через: {timeLeft} сек.
      </div>
    </div>
  )
}

export default DeathPhase
