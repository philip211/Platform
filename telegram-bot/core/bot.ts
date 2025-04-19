// telegram-bot/core/bot.ts
import TelegramBot from "node-telegram-bot-api"

if (!process.env.BOT_TOKEN) {
  console.error("❌ Error: BOT_TOKEN is required but not provided in environment variables")
  process.exit(1)
}

const isDev = process.env.NODE_ENV !== 'production'
const options = isDev 
  ? { polling: true } 
  : { 
      webHook: {
        port: process.env.PORT ? parseInt(process.env.PORT) : 8443
      }
    }

console.log(`🤖 Initializing Telegram bot in ${isDev ? 'development' : 'production'} mode`)

let botInstance: TelegramBot;

try {
  botInstance = new TelegramBot(process.env.BOT_TOKEN, options)
  
  if (!isDev) {
    if (!process.env.WEBHOOK_URL) {
      console.warn("⚠️ Warning: WEBHOOK_URL is not set in production mode. Webhook will not be configured.")
    } else {
      const webhookUrl = `${process.env.WEBHOOK_URL}/bot${process.env.BOT_TOKEN}`
      botInstance.setWebHook(webhookUrl)
      console.log('✅ Webhook set to:', webhookUrl)
    }
  } else {
    console.log('🔄 Bot running in polling mode')
  }
  
  botInstance.on('polling_error', (error) => {
    console.error('❌ Polling error:', error.message)
  })
  
  botInstance.on('webhook_error', (error) => {
    console.error('❌ Webhook error:', error.message)
  })
  
  console.log('✅ Bot initialized successfully')
} catch (error) {
  console.error('❌ Failed to initialize bot:', error)
  process.exit(1)
}

export const bot = botInstance
