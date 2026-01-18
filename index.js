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
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

// ───────────── MARKDOWN ─────────────
function escapeTG(text = "") {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

// Discord → Telegram
function convertMarkdown(text) {
  return escapeTG(text)
    .replace(/\\\*\\\*(.*?)\\\*\\\*/g, "*$1*") // **bold**
    .replace(/\\\[(.*?)\\\]\\\((.*?)\\\)/g, "[$1]($2)"); // links
}

// ───────────── SEND ─────────────
async function sendToTelegram(message) {
  if (!message.embeds.length) return;

  const embed = message.embeds[0];
  let text = "";
  let image = embed.image?.url || message.attachments.first()?.url;

  if (embed.description) {
    text = convertMarkdown(embed.description.replace(/@everyone|@here/g, ""));
  }

  if (!text && !image) return;

  // 🖼 Фото + текст
  if (image) {
    await fetch(`${TG_API}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TG_CHAT,
        photo: image,
        caption: text,
        parse_mode: "MarkdownV2"
      })
    });
    return;
  }

  // 📝 Только текст
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

// ───────────── EVENTS ─────────────
client.on("messageCreate", async (message) => {
  if (message.channelId !== CHANNEL_ID) return;

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
