import { useTelegram } from "../hooks/useTelegram"
import { useSwipeable } from "react-swipeable"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import "./ProfilePage.scss"

const ProfilePage = () => {
  const { user } = useTelegram()
  const navigate = useNavigate()

  const handlers = useSwipeable({
    onSwipedRight: () => {
      console.log("⬅️ Свайп вправо — переход в каталог")
      navigate("/catalog")
    },
    preventScrollOnSwipe: true,
    trackTouch: true,
  })

  if (!user) {
    return (
      <div className="profile-page" {...handlers}>
        <p>Нет данных Telegram. Открой WebApp из Telegram 🙏</p>
      </div>
    )
  }

  return (
    <div className="profile-page" {...handlers}>
      <motion.div
        className="profile-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <img src={user.photo_url} alt="avatar" className="profile-page__avatar" />
        <h2 className="profile-page__name">{user.first_name} {user.last_name}</h2>
        <p className="profile-page__username">@{user.username || "аноним"}</p>
      </motion.div>
      
      <div className="profile-page__games">
        <h3>Мои игры</h3>
        <motion.div 
          className="game-history-item"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => navigate("/games/mafia-chicago")}
        >
          <span className="game-icon">🎩</span>
          <div className="game-info">
            <h4>Мафия: Чикаго</h4>
            <p>Последняя игра: сегодня</p>
          </div>
          <span className="arrow">→</span>
        </motion.div>
      </div>
      
      <div className="swipe-hint">
        <span>← Свайп вправо для возврата в каталог</span>
      </div>
    </div>
  )
}

export default ProfilePage
