import { useSwipeable } from "react-swipeable"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useState } from "react"
import "../modules/mafia-chicago/styles/CatalogPage.scss"

const CatalogPage = () => {
  const navigate = useNavigate()
  const [isPressed, setIsPressed] = useState(false)

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      console.log("➡️ Свайп влево — переход в профиль")
      navigate("/profile")
    },
    onSwipedRight: () => {
      console.log("⬅️ Свайп вправо — возврат")
    },
    preventScrollOnSwipe: true,
    trackTouch: true,
  })

  const handleGameClick = () => {
    setIsPressed(true)
    setTimeout(() => {
      navigate("/games/mafia-chicago")
    }, 300)
  }

  return (
    <div
      {...handlers}
      className="catalog-page"
    >
      <motion.div
        className="catalog-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>🎩 Премиум Игры</h1>
        <p className="catalog-subtitle">Эксклюзивные игры для Telegram</p>
      </motion.div>

      <motion.div 
        className={`game-card ${isPressed ? 'pressed' : ''}`}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={handleGameClick}
      >
        <div className="game-card-content">
          <div className="game-logo">🎩</div>
          <div className="game-info">
            <h2>Мафия: Чикаго</h2>
            <p className="game-description">
              Погрузитесь в атмосферу криминального Чикаго 30-х годов. 
              Социальная игра на дедукцию для 8 игроков.
            </p>
            <div className="game-tags">
              <span className="tag">8 игроков</span>
              <span className="tag">дедукция</span>
              <span className="tag">интриги</span>
            </div>
          </div>
        </div>
        <div className="game-card-footer">
          <button className="play-button">
            Играть
          </button>
        </div>
      </motion.div>

      <div className="swipe-hint">
        <span>← Свайп для навигации →</span>
      </div>
    </div>
  )
}

export default CatalogPage

