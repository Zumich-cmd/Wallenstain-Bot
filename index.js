import { Client, GatewayIntentBits } from "discord.js";
import fetch from "node-fetch";

// ─── DISCORD ────────────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ─── TELEGRAM ────────────────────────────────────────────────────────────────
const TG_API = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}`;

async function sendToTelegram(message) {
  const text = message.content
    .replace(/@everyone|@here/g, "")
    .trim();

  const attachment = message.attachments.first();
  const imageUrl =
    attachment && attachment.contentType?.startsWith("image/")
      ? attachment.url
      : null;

  // 🖼 Картинка + текст
  if (imageUrl) {
    await fetch(`${TG_API}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        photo: imageUrl,
        caption: text || undefined
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
        text
      })
    });
  }
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.channelId !== process.env.DISCORD_CHANNEL_ID) return;

  try {
    await sendToTelegram(message);
  } catch (e) {
    console.error("Telegram error:", e);
  }
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
