import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { TelegramProvider } from "./contexts/TelegramContext"
import CatalogPage from "./pages/catalog/CatalogPage"
import GamePage from "./pages/GamePage"
import Layout from "./components/Layout"

function App() {
  return (
    <TelegramProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<CatalogPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/game/:id" element={<GamePage />} />
            {/* Legacy route redirect */}
            <Route path="/games/mafia-chicago" element={<Navigate to="/game/mafia-chicago" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TelegramProvider>
  )
}

export default App
