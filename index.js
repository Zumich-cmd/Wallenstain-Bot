import { Client, GatewayIntentBits } from "discord.js";
import fetch from "node-fetch";
import "dotenv/config";

// ─── DISCORD ────────────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent // ⚠️ ДОЛЖЕН БЫТЬ ВКЛЮЧЁН В DEV PORTAL
  ]
});

// ─── TELEGRAM ────────────────────────────────────────────────────────────────
const TG_API = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}`;

// ─── ОТПРАВКА В TELEGRAM ─────────────────────────────────────────────────────
async function sendToTelegram(message) {
  const text = message.content
    .replace(/@everyone|@here/g, "")
    .trim();

  const attachment = message.attachments.first();
  const imageUrl = attachment?.contentType?.startsWith("image/")
    ? attachment.url
    : null;

  // 🖼 Фото + текст
  if (imageUrl) {
    await fetch(`${TG_API}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        photo: imageUrl,
        caption: text || undefined,
        parse_mode: "HTML"
      })
    });
    return;
  }

  // 📝 Только текст
  if (text) {
    await fetch(`${TG_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text,
        parse_mode: "HTML"
      })
    });
  }
}

// ─── ОБРАБОТКА СООБЩЕНИЙ DISCORD ─────────────────────────────────────────────
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.channelId !== process.env.DISCORD_CHANNEL_ID) return;

  try {
    await sendToTelegram(message);
  } catch (err) {
    console.error("Ошибка отправки в Telegram:", err);
  }
});

// ─── ЗАПУСК ─────────────────────────────────────────────────────────────────
client.once("ready", () => {
  console.log(`✅ Бот запущен как ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
