import { useTelegram } from "../hooks/useTelegram"
import { useNavigate } from "react-router-dom"
import "./AuthPage.scss"

const AuthPage = () => {
  const { user, haptic } = useTelegram()
  const navigate = useNavigate()

  console.log("🧩 Telegram user:", user)
  console.log("🧪 Raw initData:", window.Telegram?.WebApp?.initDataUnsafe)

  // Проверка: запущено ли в Telegram
  if (!window.Telegram?.WebApp) {
    return (
      <div className="auth-page">
        ⛔ Открой платформу внутри <b>Telegram</b>, а не в браузере.
      </div>
    )
  }

  // Нет пользователя → значит Telegram не передал initData
  if (!user) {
    return (
      <div className="auth-page">
        <p>🕵️ Нет данных Telegram. Скорее всего WebApp открыт неправильно.</p>
        <p>Попробуй заново через Telegram-кнопку.</p>
      </div>
    )
  }

  // Кнопка запуска
  const handleStart = () => {
    haptic?.impactOccurred("medium")
    navigate("/")
  }

  return (
    <div className="auth-page">
      <img src={user.photo_url} className="auth-page__avatar" alt="avatar" />
      <h1 className="auth-page__title">Привет, {user.first_name}!</h1>
      <p className="auth-page__subtitle">@{user.username || "аноним"}</p>
      <button className="auth-page__button" onClick={handleStart}>
        🚀 Начать
      </button>
    </div>
  )
}

export default AuthPage
