import { useState } from 'react'
import { useMafiaStore, PlayerRole } from '../../store/mafiaStore'

interface RoleActionsProps {
  onSubmitAction?: (roomId: string, action: string, targetId?: string) => void;
}

const RoleActions: React.FC<RoleActionsProps> = ({ onSubmitAction }) => {
  const { players, performRoleAction, roomId } = useMafiaStore()
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  
  const currentPlayer = players[0] // Placeholder
  
  const playersInSameLocation = players.filter(
    p => p.isAlive && 
    p.id !== currentPlayer?.id && 
    p.selectedLocation === currentPlayer?.selectedLocation
  )
  
  const handleAction = () => {
    if (!currentPlayer) return
    
    performRoleAction(currentPlayer.id, selectedTarget)
    
    if (onSubmitAction && roomId) {
      const action = currentPlayer.role === PlayerRole.MAFIA ? 'kill' : 
                    currentPlayer.role === PlayerRole.DOCTOR ? 'heal' :
                    currentPlayer.role === PlayerRole.SHERIFF ? 'arrest' : 'skip';
      
      onSubmitAction(roomId, action, selectedTarget || undefined);
    }
  }
  
  const handleSkipAction = () => {
    if (!currentPlayer) return
    
    performRoleAction(currentPlayer.id, null)
    
    if (onSubmitAction && roomId) {
      onSubmitAction(roomId, 'skip');
    }
  }
  
  const renderRoleSpecificContent = () => {
    if (!currentPlayer) return null
    
    switch (currentPlayer.role) {
      case PlayerRole.MAFIA:
        return (
          <>
            <h3 className="mafia-chicago__role-title">Вы - Мафия</h3>
            <p className="mafia-chicago__role-description">
              Выберите жертву в вашей локации или пропустите ход.
            </p>
            {playersInSameLocation.length === 0 ? (
              <p className="mafia-chicago__no-targets">
                В вашей локации нет других игроков.
              </p>
            ) : (
              <div className="mafia-chicago__targets">
                {playersInSameLocation.map(player => (
                  <button
                    key={player.id}
                    className={`mafia-chicago__target-btn ${selectedTarget === player.id ? 'mafia-chicago__target-btn--selected' : ''}`}
                    onClick={() => setSelectedTarget(player.id)}
                  >
                    {player.name}
                  </button>
                ))}
              </div>
            )}
            <div className="mafia-chicago__actions">
              <button 
                className="mafia-btn mafia-btn--danger"
                onClick={handleAction}
                disabled={!selectedTarget && playersInSameLocation.length > 0}
              >
                Убить
              </button>
              <button 
                className="mafia-btn mafia-btn--secondary"
                onClick={handleSkipAction}
              >
                Пропустить
              </button>
            </div>
          </>
        )
        
      case PlayerRole.DOCTOR:
        return (
          <>
            <h3 className="mafia-chicago__role-title">Вы - Доктор</h3>
            <p className="mafia-chicago__role-description">
              Выберите игрока для лечения в вашей локации или себя.
            </p>
            <div className="mafia-chicago__targets">
              <button
                className={`mafia-chicago__target-btn ${selectedTarget === currentPlayer.id ? 'mafia-chicago__target-btn--selected' : ''}`}
                onClick={() => setSelectedTarget(currentPlayer.id)}
              >
                Вы (самолечение)
              </button>
              {playersInSameLocation.map(player => (
                <button
                  key={player.id}
                  className={`mafia-chicago__target-btn ${selectedTarget === player.id ? 'mafia-chicago__target-btn--selected' : ''}`}
                  onClick={() => setSelectedTarget(player.id)}
                >
                  {player.name}
                </button>
              ))}
            </div>
            <div className="mafia-chicago__actions">
              <button 
                className="mafia-btn mafia-btn--success"
                onClick={handleAction}
                disabled={!selectedTarget}
              >
                Лечить
              </button>
            </div>
          </>
        )
        
      case PlayerRole.SHERIFF:
        const canAct = currentPlayer.canAct
        
        return (
          <>
            <h3 className="mafia-chicago__role-title">Вы - Шериф</h3>
            <p className="mafia-chicago__role-description">
              {canAct 
                ? "Выберите подозреваемого для задержания в вашей локации."
                : "Вы не можете действовать этой ночью. Отдыхайте."
              }
            </p>
            {!canAct ? (
              <p className="mafia-chicago__no-action">
                Шериф может действовать только через ночь.
              </p>
            ) : playersInSameLocation.length === 0 ? (
              <p className="mafia-chicago__no-targets">
                В вашей локации нет других игроков.
              </p>
            ) : (
              <div className="mafia-chicago__targets">
                {playersInSameLocation.map(player => (
                  <button
                    key={player.id}
                    className={`mafia-chicago__target-btn ${selectedTarget === player.id ? 'mafia-chicago__target-btn--selected' : ''}`}
                    onClick={() => setSelectedTarget(player.id)}
                  >
                    {player.name}
                  </button>
                ))}
              </div>
            )}
            <div className="mafia-chicago__actions">
              <button 
                className="mafia-btn mafia-btn--primary"
                onClick={handleAction}
                disabled={!canAct || !selectedTarget}
              >
                Задержать
              </button>
              <button 
                className="mafia-btn mafia-btn--secondary"
                onClick={handleSkipAction}
              >
                Пропустить
              </button>
            </div>
          </>
        )
        
      case PlayerRole.CIVILIAN:
        return (
          <>
            <h3 className="mafia-chicago__role-title">Вы - Мирный житель</h3>
            <p className="mafia-chicago__role-description">
              Вы не можете совершать действия ночью. Ожидайте утра.
            </p>
            <div className="mafia-chicago__actions">
              <button 
                className="mafia-btn mafia-btn--secondary"
                onClick={handleSkipAction}
              >
                Ожидать утра
              </button>
            </div>
          </>
        )
        
      default:
        return null
    }
  }
  
  return (
    <div className="mafia-chicago__role-actions">
      <h2 className="mafia-chicago__subtitle">Ночные действия</h2>
      {renderRoleSpecificContent()}
    </div>
  )
}

export default RoleActions
