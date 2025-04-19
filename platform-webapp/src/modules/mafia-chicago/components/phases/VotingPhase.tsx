import { useState } from 'react'
import { useMafiaStore } from '../../store/mafiaStore'

interface VotingPhaseProps {
  onVote?: (roomId: string, targetId: string) => void;
}

const VotingPhase: React.FC<VotingPhaseProps> = ({ onVote }) => {
  const { players, vote, skipVote, roomId } = useMafiaStore()
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  
  const currentPlayer = players[0] // Placeholder
  
  const alivePlayersExceptCurrent = players.filter(
    p => p.isAlive && p.id !== currentPlayer?.id
  )
  
  const handleVote = () => {
    if (!currentPlayer || !selectedPlayer) return
    
    vote(currentPlayer.id, selectedPlayer)
    
    if (onVote && roomId) {
      onVote(roomId, selectedPlayer)
    }
  }
  
  const handleSkipVote = () => {
    if (!currentPlayer) return
    
    skipVote(currentPlayer.id)
    
    if (onVote && roomId) {
      onVote(roomId, 'skip')
    }
  }
  
  return (
    <div className="mafia-chicago__voting">
      <h2 className="mafia-chicago__subtitle">Голосование</h2>
      <p className="mafia-chicago__phase-description">
        Выберите игрока для казни или воздержитесь от голосования.
      </p>
      
      <div className="mafia-chicago__players-grid">
        {alivePlayersExceptCurrent.map(player => (
          <button
            key={player.id}
            className={`mafia-chicago__player-btn ${selectedPlayer === player.id ? 'mafia-chicago__player-btn--selected' : ''}`}
            onClick={() => setSelectedPlayer(player.id)}
          >
            <div className="mafia-chicago__player-name">{player.name}</div>
          </button>
        ))}
      </div>
      
      <div className="mafia-chicago__actions">
        <button 
          className="mafia-btn mafia-btn--danger"
          onClick={handleVote}
          disabled={!selectedPlayer}
        >
          Казнить
        </button>
        <button 
          className="mafia-btn mafia-btn--secondary"
          onClick={handleSkipVote}
        >
          Воздержаться
        </button>
      </div>
    </div>
  )
}

export default VotingPhase
