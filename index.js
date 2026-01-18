import { Client, GatewayIntentBits } from "discord.js";
import fetch from "node-fetch";

// ───────────── DISCORD ─────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ───────────── TELEGRAM ─────────────
const TG_API = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}`;
const TG_CHAT = process.env.TELEGRAM_CHAT_ID;
const DISCORD_CHANNEL = process.env.DISCORD_CHANNEL_ID;

// ───────────── MARKDOWN ESCAPE ─────────────
function escapeMarkdown(text = "") {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

// ───────────── SEND ─────────────
async function sendToTelegram(message) {
  let imageUrl = null;
  let text = "";

  // 🧠 EMBED
  if (message.embeds.length > 0) {
    const e = message.embeds[0];

    if (e.image?.url) imageUrl = e.image.url;

    text =
      `🔔 *ВЫШЛА НОВАЯ ГЛАВА\\!*\n\n` +
      `📚 *Тайтл:* ${escapeMarkdown(e.title || "Без названия")}\n` +
      `📄 *Глава:* 1\n\n` +
      `👀 *ЧИТАТЬ:*\n` +
      `🔗 [MangaLib](https://mangalib.me)\n` +
      `🔗 [Teletype](https://teletype.in)\n\n` +
      `✈️ *Следите за нами:*\n` +
      `🔹 [Telegram](https://t.me/wallenstainproject)\n` +
      `🔹 [Discord](https://discord.gg/a64Ceb5A)`;
  }

  // 🖼 IMAGE
  if (imageUrl) {
    await fetch(`${TG_API}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TG_CHAT,
        photo: imageUrl,
        caption: text,
        parse_mode: "MarkdownV2"
      })
    });
    return;
  }

  // 📝 TEXT ONLY
  if (text) {
    await fetch(`${TG_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TG_CHAT,
        text,
        parse_mode: "MarkdownV2"
      })
    });
  }
}

// ───────────── EVENTS ─────────────
client.on("messageCreate", async (message) => {
  if (message.channelId !== DISCORD_CHANNEL) return;

  try {
    await sendToTelegram(message);
  } catch (e) {
    console.error("TG ERROR:", e);
  }
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
