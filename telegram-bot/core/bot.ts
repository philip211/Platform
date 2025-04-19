import TelegramBot from "node-telegram-bot-api";

// Проверка переменных окружения
if (!process.env.BOT_TOKEN) {
  console.error("❌ Error: BOT_TOKEN is required but not provided in environment variables");
  process.exit(1);
}

let token = process.env.BOT_TOKEN;
if (token.startsWith("bot")) {
  console.warn("⚠️ BOT_TOKEN contains unnecessary 'bot' prefix — removing it automatically.");
  token = token.replace(/^bot/, "");
}

const isDev = process.env.NODE_ENV !== "production";

const options = isDev
  ? { polling: true }
  : {
      webHook: {
        port: process.env.PORT ? parseInt(process.env.PORT) : 8443,
      },
    };

console.log(`🤖 Initializing Telegram bot in ${isDev ? "development" : "production"} mode`);

let botInstance: TelegramBot;

try {
  botInstance = new TelegramBot(token, options);

  if (!isDev) {
    if (!process.env.WEBHOOK_URL) {
      console.warn("⚠️ WEBHOOK_URL is not set in production mode. Skipping webhook setup.");
    } else {
      const webhookUrl = `${process.env.WEBHOOK_URL}/bot${token}`;
      botInstance.setWebHook(webhookUrl).then(() => {
        console.log("✅ Webhook successfully set to:", webhookUrl);
      }).catch((err) => {
        console.error("❌ Failed to set webhook:", err.message);
      });
    }
  } else {
    console.log("🔄 Bot running in polling mode");
  }

  botInstance.on("polling_error", (error) => {
    console.error("❌ Polling error:", error.message);
  });

  botInstance.on("webhook_error", (error) => {
    console.error("❌ Webhook error:", error.message);
  });

  console.log("✅ Bot initialized successfully");
} catch (error) {
  console.error("❌ Failed to initialize bot:", error);
  process.exit(1);
}

export const bot = botInstance;
