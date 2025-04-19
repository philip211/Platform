// telegram-bot/commands/start.command.ts

import { bot } from "../core/bot"
import { WEBAPP_URL } from "../config/webapp.config"

bot.onText(/\/start(.*)/, (msg, match) => {
  const chatId = msg.chat.id
  const firstName = msg.from?.first_name || "друг"
  
  const startParam = match?.[1]?.trim() || ""
  let webAppUrl = `${WEBAPP_URL}/catalog`
  
  if (startParam.startsWith('mafia_invite_')) {
    const inviteCode = startParam.replace('mafia_invite_', '')
    webAppUrl = `${WEBAPP_URL}/games/mafia-chicago?inviteCode=${inviteCode}`
  } else if (startParam === 'mafia') {
    const randomInviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    webAppUrl = `${WEBAPP_URL}/games/mafia-chicago?inviteCode=${randomInviteCode}`
  }
  
  bot.sendMessage(chatId, `👋 Привет, ${firstName}!\n\nДобро пожаловать в игру «Мафия: Чикаго». Нажми кнопку ниже, чтобы начать игру:`, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🎩 Играть в Мафию",
            web_app: {
              url: webAppUrl,
            },
          },
        ],
      ],
    },
  })
})

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id
  
  bot.sendMessage(chatId, `🎩 *Мафия: Чикаго* — Правила игры\n
*Роли:*
• Мафия (1-2 игрока) — убивает по ночам
• Доктор (1 игрок) — лечит по ночам
• Шериф (1 игрок) — проверяет по ночам
• Мирные жители (4-5 игроков) — выживают

*Фазы игры:*
1. Ночь — выбор локаций и действий ролей
2. Утро — объявление результатов ночи
3. Обсуждение — обмен подарками и информацией
4. Голосование — выбор подозреваемого
5. Казнь — исключение игрока

*Победа:*
• Мирные побеждают, если устранили всю мафию
• Мафия побеждает, если осталось 1 мирный и 1 мафия

Нажми кнопку ниже, чтобы начать игру:`, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🎩 Играть в Мафию",
            web_app: {
              url: `${WEBAPP_URL}/catalog?source=help`,
            },
          },
        ],
      ],
    },
  })
})
