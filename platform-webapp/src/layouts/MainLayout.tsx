// src/layouts/MainLayout.tsx
import { ReactNode } from "react"
import { useTelegram } from "../hooks/useTelegram"
import "../styles/main.scss"

type MainLayoutProps = {
  children: ReactNode
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { theme } = useTelegram()

  return (
    <div
      className="main-layout"
      style={{
        backgroundColor: theme?.bg_color || "rgba(255,255,255,0.05)",
        color: theme?.text_color || "#fff",
      }}
    >
      <div className="main-layout__container">
        {children}
      </div>
    </div>
  )
}

export default MainLayout
