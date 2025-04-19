// src/contexts/TelegramContext.tsx
import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
  } from "react"
  
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
  
  type TelegramContextType = {
    user?: TelegramUser
    theme?: TelegramTheme
    sendData?: (data: string) => void
    close?: () => void
    expand?: () => void
    haptic?: {
      impactOccurred: (style: "light" | "medium" | "heavy") => void
      notificationOccurred: (type: "error" | "success" | "warning") => void
      selectionChanged: () => void
    }
    isReady: boolean
    isMockMode: boolean
  }
  
  const TelegramContext = createContext<TelegramContextType>({
    isReady: false,
    isMockMode: false,
  })
  
  export const useTelegramContext = () => useContext(TelegramContext)
  
  const mockUser: TelegramUser = {
    id: 123456789,
    first_name: "Test",
    last_name: "User",
    username: "testuser",
    language_code: "en"
  }
  
  const mockTheme: TelegramTheme = {
    bg_color: "#1c1c1e",
    text_color: "#ffffff",
    hint_color: "#7d7d7d",
    link_color: "#2481cc",
    button_color: "#2481cc",
    button_text_color: "#ffffff",
    secondary_bg_color: "#2c2c2e"
  }
  
  const WEBAPP_TIMEOUT_MS = 4000; // 4 seconds timeout for WebApp initialization
  
  export const TelegramProvider = ({ children }: { children: ReactNode }) => {
    const [isReady, setIsReady] = useState(false)
    const [tg, setTg] = useState<any>(null)
    const [mockMode, setMockMode] = useState(false)
    const [timeoutOccurred, setTimeoutOccurred] = useState(false)
  
    useEffect(() => {
      const checkTg = () => {
        const webApp = window.Telegram?.WebApp
        if (webApp) {
          webApp.expand?.()
          setTg(webApp)
          
          if (!webApp.initDataUnsafe?.user) {
            console.log("Using mock Telegram user data for development");
            setMockMode(true);
          }
          
          setIsReady(true)
          return true
        }
        return false
      }
  
      if (!checkTg()) {
        const interval = setInterval(() => {
          if (checkTg()) {
            clearInterval(interval)
          }
        }, 100)
        
        const timeout = setTimeout(() => {
          clearInterval(interval)
          
          if (!isReady) {
            console.log(`WebApp initialization timed out after ${WEBAPP_TIMEOUT_MS}ms, switching to mock mode`);
            setTimeoutOccurred(true)
            setMockMode(true)
            setIsReady(true)
          }
        }, WEBAPP_TIMEOUT_MS)
  
        return () => {
          clearInterval(interval)
          clearTimeout(timeout)
        }
      }
    }, [isReady])
    
    const mockHaptic = {
      impactOccurred: (style: "light" | "medium" | "heavy") => {
        console.log(`Mock haptic impact: ${style}`)
      },
      notificationOccurred: (type: "error" | "success" | "warning") => {
        console.log(`Mock haptic notification: ${type}`)
      },
      selectionChanged: () => {
        console.log('Mock haptic selection changed')
      }
    }
    
    const mockSendData = (data: string) => {
      console.log('Mock sendData:', data)
    }
    
    const mockClose = () => {
      console.log('Mock close WebApp')
    }
    
    const mockExpand = () => {
      console.log('Mock expand WebApp')
    }
  
    const value: TelegramContextType = {
      user: mockMode ? mockUser : tg?.initDataUnsafe?.user,
      theme: mockMode ? mockTheme : tg?.themeParams,
      sendData: mockMode ? mockSendData : tg?.sendData,
      close: mockMode ? mockClose : tg?.close,
      expand: mockMode ? mockExpand : tg?.expand,
      haptic: mockMode ? mockHaptic : tg?.HapticFeedback,
      isReady,
      isMockMode: mockMode,
    }
  
    return (
      <TelegramContext.Provider value={value}>
        {timeoutOccurred && mockMode && (
          <div className="mock-mode-notification">
            Telegram WebApp не загрузился. Работаем в демо-режиме.
          </div>
        )}
        {children}
      </TelegramContext.Provider>
    )
  }
  