import { useEffect, useState } from "react"
import { useTelegramContext } from "../contexts/TelegramContext"
import GamePhaseManager from "../modules/mafia-chicago/components/GamePhaseManager"
import "../modules/mafia-chicago/styles/MafiaChicago.scss"

const MafiaChicagoPage = () => {
  const { user, isReady } = useTelegramContext()
  const [inviteCode, setInviteCode] = useState<string | null>(null)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const inviteParam = urlParams.get('invite')
    if (inviteParam) {
      setInviteCode(inviteParam)
      console.log("Invite code detected:", inviteParam)
    }
  }, [])

  useEffect(() => {
    if (isReady && user) {
      console.log("Mafia Chicago game initialized for user:", user.first_name)
      if (inviteCode) {
        console.log("User joining via invite code:", inviteCode)
      }
    }
  }, [isReady, user, inviteCode])

  return (
    <div className="mafia-chicago">
      <h1 className="mafia-chicago__title">🎩 Мафия: Чикаго</h1>
      <p className="mafia-chicago__description">
        Добро пожаловать в игру "Мафия: Чикаго"! Здесь вы окунетесь в атмосферу криминального Чикаго 30-х годов.
      </p>
      
      {inviteCode && (
        <div className="mafia-chicago__invite-banner">
          <p>Вы присоединяетесь по приглашению</p>
        </div>
      )}
      
      <div className="mafia-chicago__content">
        {isReady && user ? (
          <GamePhaseManager 
            telegramId={user.id.toString()} 
            userName={user.first_name}
          />
        ) : (
          <div className="mafia-chicago__loading">
            Загрузка Telegram WebApp...
          </div>
        )}
      </div>
    </div>
  )
}

export default MafiaChicagoPage
