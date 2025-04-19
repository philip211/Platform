// src/components/DebugTelegram.tsx
import { useTelegram } from "../hooks/useTelegram"

const DebugTelegram = () => {
  const { tg, user, theme, isReady } = useTelegram()

  return (
    <div style={{
      position: "fixed",
      bottom: 12,
      left: 12,
      background: "#111",
      color: "#0f0",
      fontSize: "9px",
      padding: "8px 10px",
      borderRadius: 6,
      opacity: 0.85,
      zIndex: 9999,
      maxWidth: 240,
      lineHeight: 1.4,
      overflowWrap: "break-word",
      fontFamily: "monospace",
    }}>
      <div><b>isReady:</b> {String(isReady)}</div>
      <div><b>user:</b> {user ? `${user.first_name}` : "❌"}</div>
      <div><b>theme:</b> {theme?.bg_color || "❌"}</div>
      <div><b>tg:</b> {tg ? "✅" : "⛔️"}</div>

      <div style={{ marginTop: 4, borderTop: "1px solid #333", paddingTop: 4 }}>
        <div><b>initData:</b></div>
        <div style={{ color: "#aaa", fontSize: "8px" }}>{tg?.initData?.slice(0, 60) || "нет"}...</div>

        <div style={{ marginTop: 4 }}><b>tg.isExpanded:</b> {tg?.isExpanded ? "✅" : "⛔️"}</div>
        <div><b>closingConfirmation:</b> {tg?.isClosingConfirmationEnabled ? "✅" : "⛔️"}</div>
      </div>
    </div>
  )
}

export default DebugTelegram
