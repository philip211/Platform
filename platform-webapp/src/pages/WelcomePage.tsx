// src/pages/WelcomePage.tsx
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTelegramContext } from "../contexts/TelegramContext"
import "./WelcomePage.scss"

const WelcomePage = () => {
  const { user, isReady } = useTelegramContext()
  const navigate = useNavigate()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!isReady || !user) return

    setShow(true)
    const timer = setTimeout(() => {
      navigate("/catalog")
    }, 3000)

    return () => clearTimeout(timer)
  }, [user, isReady, navigate])

  if (!isReady) {
    return <div className="welcome-loading">🔄 Загружаем Telegram WebApp...</div>
  }

  if (!user) {
    return (
      <div className="welcome-error">
        <h1>Нет данных Telegram</h1>
        <p>Убедись, что ты открыл приложение через Telegram</p>
      </div>
    )
  }

  return (
    <div className={`welcome-container ${show ? "show" : ""}`}>
      <div className="welcome-card">
        <img
          className="welcome-avatar"
          src={user.photo_url || "/default-avatar.png"}
          alt="User Avatar"
        />
        <h1 className="welcome-title">Привет, {user.first_name}!</h1>
        <p className="welcome-sub">Готов погрузиться в мир Telegram игр?</p>
      </div>
    </div>
  )
}

export default WelcomePage;
