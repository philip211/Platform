import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import "./styles/main.scss"
import "./styles/MockMode.scss"
import { setupMockApi } from "./api/mockMafiaApi"

setupMockApi();

// 🔍 Диагностика Telegram WebApp
console.log("🔥 Vite запущен")
console.log("Telegram:", window.Telegram)
console.log("Telegram.WebApp:", window.Telegram?.WebApp)
console.log("Telegram.User:", window.Telegram?.WebApp?.initDataUnsafe?.user)

const root = document.getElementById("root")

if (!root) {
  throw new Error("❌ Не найден элемент #root в index.html")
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
