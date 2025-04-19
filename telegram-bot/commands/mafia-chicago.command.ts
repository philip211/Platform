
import { bot } from "../core/bot"
import { WEBAPP_URL } from "../config/webapp.config"

bot.onText(/\/mafia/, (msg) => {
  const chatId = msg.chat.id
  const firstName = msg.from?.first_name || "друг"
  
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
  
  bot.sendMessage(chatId, `🎩 Привет, ${firstName}!\n\nДобро пожаловать в игру «Мафия: Чикаго». Нажми кнопку ниже, чтобы начать игру:`, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🎩 Играть в Мафию",
            web_app: {
              url: `${WEBAPP_URL}/games/mafia-chicago?inviteCode=${inviteCode}`,
            },
          },
        ],
      ],
    },
  })
})

bot.onText(/\/create_game/, (msg) => {
  const chatId = msg.chat.id
  const firstName = msg.from?.first_name || "друг"
  
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
  
  bot.sendMessage(chatId, `🎩 ${firstName}, ты создал новую игру!\n\nПригласи друзей по ссылке:`, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🎮 Присоединиться к игре",
            web_app: {
              url: `${WEBAPP_URL}/games/mafia-chicago?inviteCode=${inviteCode}`,
            },
          },
        ],
        [
          {
            text: "📋 Скопировать код приглашения",
            callback_data: `copy_invite_${inviteCode}`,
          },
        ],
      ],
    },
  })
})

bot.on('callback_query', (callbackQuery) => {
  const data = callbackQuery.data
  
  if (data && data.startsWith('copy_invite_')) {
    const inviteCode = data.replace('copy_invite_', '')
    
    bot.answerCallbackQuery(callbackQuery.id, {
      text: `Код приглашения: ${inviteCode}`,
      show_alert: true
    })
  }
})
