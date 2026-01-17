import { Client, GatewayIntentBits } from "discord.js";
import fetch from "node-fetch";

const {
  DISCORD_TOKEN,
  TELEGRAM_TOKEN,
  TELEGRAM_CHAT_ID,
  DISCORD_CHANNEL_ID
} = process.env;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

function cleanText(text) {
  return text
    .replace(/@everyone/g, "")
    .replace(/@here/g, "")
    .trim();
}

async function sendTelegramMessage(text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      disable_web_page_preview: false
    })
  });
}

async function sendTelegramPhoto(url) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      photo: url
    })
  });
}

client.on("ready", () => {
  console.log(`✅ Бот запущен как ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== DISCORD_CHANNEL_ID) return;

  const text = cleanText(message.content);

  if (text) {
    await sendTelegramMessage(text);
  }

  for (const attachment of message.attachments.values()) {
    if (attachment.contentType?.startsWith("image")) {
      await sendTelegramPhoto(attachment.url);
    }
  }
});

client.login(DISCORD_TOKEN);
