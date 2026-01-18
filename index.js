import { Client, GatewayIntentBits } from "discord.js";
import fetch from "node-fetch";

// ───────────────── DISCORD ─────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ───────────────── TELEGRAM ─────────────────
const TG_API = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}`;
const TG_CHAT = process.env.TELEGRAM_CHAT_ID;
const DISCORD_CHANNEL = process.env.DISCORD_CHANNEL_ID;

// ───────────────── UTILS ─────────────────
async function sendToTelegram(message) {
  // 🟢 1. ТЕКСТ (берём из embed ИЛИ обычного текста)
  let text = "";

  if (message.embeds.length > 0) {
    const embed = message.embeds[0];

    if (embed.title) text += `${embed.title}\n\n`;
    if (embed.description) text += embed.description;
  } else {
    text = message.content;
  }

  text = text
    .replace(/@everyone|@here/g, "")
    .trim();

  // 🟢 2. КАРТИНКА
  let imageUrl = null;

  // из embed
  if (message.embeds[0]?.image?.url) {
    imageUrl = message.embeds[0].image.url;
  }

  // или из attachment
  if (!imageUrl) {
    const attachment = message.attachments.first();
    if (attachment && attachment.contentType?.startsWith("image/")) {
      imageUrl = attachment.url;
    }
  }

  // ─────── ОТПРАВКА В TELEGRAM ───────
  try {
    if (imageUrl) {
      const res = await fetch(`${TG_API}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TG_CHAT,
          photo: imageUrl,
          caption: text || undefined
        })
      });

      const data = await res.json();
      console.log("TG PHOTO:", data);
      return;
    }

    if (text) {
      const res = await fetch(`${TG_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TG_CHAT,
          text
        })
      });

      const data = await res.json();
      console.log("TG TEXT:", data);
    }
  } catch (err) {
    console.error("❌ Telegram error:", err);
  }
}

// ───────────────── EVENTS ─────────────────
client.on("messageCreate", async (message) => {
  // ❗ НЕ ОТФИЛЬТРОВЫВАЕМ webhook
  if (message.channelId !== DISCORD_CHANNEL) return;

  try {
    await sendToTelegram(message);
  } catch (e) {
    console.error("Send error:", e);
  }
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
