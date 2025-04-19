import { useParams, Navigate } from "react-router-dom"
import { useTelegramContext } from "../contexts/TelegramContext"
import { getGameById } from "../games/gameMap"
import "./GamePage.scss"

const GamePage = () => {
  const { id } = useParams<{ id: string }>()
  const { isReady } = useTelegramContext()
  
  if (!id) {
    return <Navigate to="/catalog" replace />
  }
  
  const game = getGameById(id)
  
  if (!game) {
    return <Navigate to="/catalog" replace />
  }
  
  const GameComponent = game.component
  
  return (
    <div className="game-page">
      {isReady ? (
        <GameComponent />
      ) : (
        <div className="game-page__loading">
          <h2 className="game-page__subtitle">Загрузка Telegram WebApp...</h2>
          <div className="game-page__loader"></div>
        </div>
      )}
    </div>
  )
}

export default GamePage
