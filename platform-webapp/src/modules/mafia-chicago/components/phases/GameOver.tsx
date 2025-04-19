import { useMafiaStore, PlayerRole } from '../../store/mafiaStore'

interface GameOverProps {
}

const GameOver: React.FC<GameOverProps> = () => {
  const { players, resetGame } = useMafiaStore()
  
  const mafiaPlayers = players.filter(p => p.role === PlayerRole.MAFIA && p.isAlive)
  const civilianPlayers = players.filter(p => p.role !== PlayerRole.MAFIA && p.isAlive)
  
  const mafiaWon = mafiaPlayers.length === 1 && civilianPlayers.length === 1
  const civiliansWon = mafiaPlayers.length === 0
  
  return (
    <div className="mafia-chicago__game-over">
      <h2 className="mafia-chicago__subtitle">Игра окончена</h2>
      
      <div className={`mafia-chicago__winner ${mafiaWon ? 'mafia-chicago__winner--mafia' : 'mafia-chicago__winner--civilians'}`}>
        {mafiaWon && (
          <>
            <h3 className="mafia-chicago__winner-title">Мафия победила!</h3>
            <p className="mafia-chicago__winner-description">
              Мафия захватила контроль над Чикаго. Город погрузился во тьму и беззаконие.
            </p>
          </>
        )}
        
        {civiliansWon && (
          <>
            <h3 className="mafia-chicago__winner-title">Мирные жители победили!</h3>
            <p className="mafia-chicago__winner-description">
              Мирные жители смогли избавить Чикаго от мафии. В городе воцарился закон и порядок.
            </p>
          </>
        )}
        
        {!mafiaWon && !civiliansWon && (
          <>
            <h3 className="mafia-chicago__winner-title">Игра завершена</h3>
            <p className="mafia-chicago__winner-description">
              Борьба за Чикаго продолжается...
            </p>
          </>
        )}
      </div>
      
      <div className="mafia-chicago__final-roles">
        <h3>Роли игроков:</h3>
        <ul className="mafia-chicago__roles-list">
          {players.map(player => (
            <li 
              key={player.id} 
              className={`mafia-chicago__player-role mafia-chicago__player-role--${player.role}`}
            >
              {player.name} - {getRoleName(player.role)}
              {!player.isAlive && ' (Погиб)'}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="mafia-chicago__actions">
        <button 
          className="mafia-btn mafia-btn--primary"
          onClick={resetGame}
        >
          Начать новую игру
        </button>
      </div>
    </div>
  )
}

const getRoleName = (role: PlayerRole): string => {
  switch (role) {
    case PlayerRole.MAFIA:
      return 'Мафия'
    case PlayerRole.DOCTOR:
      return 'Доктор'
    case PlayerRole.SHERIFF:
      return 'Шериф'
    case PlayerRole.CIVILIAN:
      return 'Мирный житель'
    default:
      return 'Неизвестная роль'
  }
}

export default GameOver
