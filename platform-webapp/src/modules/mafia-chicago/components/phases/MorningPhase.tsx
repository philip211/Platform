import { useEffect, useState } from 'react'
import { useMafiaStore, GamePhase } from '../../store/mafiaStore'

interface MorningPhaseProps {
}

const MorningPhase: React.FC<MorningPhaseProps> = () => {
  const { messages, phase } = useMafiaStore()
  const [timeLeft, setTimeLeft] = useState(10) // 10 seconds for morning phase
  
  const morningMessages = messages
    .filter(msg => msg.type === 'system')
    .slice(-5) // Just show the last few messages
  
  useEffect(() => {
    if (timeLeft <= 0) return
    
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1)
      
      if (timeLeft === 1 && phase === GamePhase.MORNING) {
        console.log('Advancing to discussion phase')
      }
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [timeLeft, phase])
  
  return (
    <div className="mafia-chicago__morning">
      <h2 className="mafia-chicago__subtitle">Утро в Чикаго</h2>
      
      <div className="mafia-chicago__morning-news">
        <div className="mafia-chicago__newspaper">
          <h3 className="mafia-chicago__newspaper-title">Chicago Tribune</h3>
          <div className="mafia-chicago__newspaper-content">
            {morningMessages.length > 0 ? (
              morningMessages.map(msg => (
                <p key={msg.id} className="mafia-chicago__newspaper-item">
                  {msg.text}
                </p>
              ))
            ) : (
              <p className="mafia-chicago__newspaper-item">
                Этой ночью в городе было на удивление спокойно...
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mafia-chicago__timer">
        Обсуждение начнется через: {timeLeft} сек.
      </div>
    </div>
  )
}

export default MorningPhase
