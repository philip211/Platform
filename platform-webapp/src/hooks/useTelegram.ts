// src/hooks/useTelegram.ts
import { useEffect, useState } from "react"

type TelegramUser = {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
}

type TelegramTheme = {
  bg_color: string
  text_color: string
  hint_color: string
  link_color: string
  button_color: string
  button_text_color: string
  secondary_bg_color: string
}

type TelegramWebApp = {
  initData: string
  initDataUnsafe: {
    user?: TelegramUser
    query_id?: string
    auth_date?: string
    hash?: string
  }
  expand: () => void
  close: () => void
  isExpanded: boolean
  isClosingConfirmationEnabled: boolean
  enableClosingConfirmation: () => void
  disableClosingConfirmation: () => void
  sendData: (data: string) => void
  themeParams: TelegramTheme
  HapticFeedback: {
    impactOccurred: (style: "light" | "medium" | "heavy") => void
    notificationOccurred: (type: "error" | "success" | "warning") => void
    selectionChanged: () => void
  }
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

export const useTelegram = () => {
  const [tg, setTg] = useState<TelegramWebApp | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const tryInit = () => {
      const webApp = window.Telegram?.WebApp
      if (webApp) {
        webApp.expand?.()
        setTg(webApp)
        setIsReady(true)
        console.log("✅ Telegram WebApp инициализирован")
        return true
      }
      return false
    }

    if (!tryInit()) {
      const interval = setInterval(() => {
        if (tryInit()) {
          clearInterval(interval)
        }
      }, 100)
      return () => clearInterval(interval)
    }
  }, [])

  return {
    isReady,
    tg,
    user: tg?.initDataUnsafe?.user,
    theme: tg?.themeParams,
    sendData: tg?.sendData,
    close: tg?.close,
    haptic: tg?.HapticFeedback,
  }
}

export default useTelegram
