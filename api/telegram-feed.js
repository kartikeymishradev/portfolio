// Vercel Serverless Function: Telegram Command Feed (/setmessage parser)
// Location: api/telegram-feed.js

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8719318935:AAEltW1gxcf084aat-L-AkpBSf6dW7tdq4U';
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '6233775039';

    // Fetch latest 20 updates from Telegram Bot API
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-20&limit=20`, {
      signal: AbortSignal.timeout(4000)
    });

    const data = await response.json();
    if (!data.ok || !data.result) {
      return res.status(200).json({
        ok: true,
        broadcast: "Catching datasets and turning them into business decisions.",
        time: "Active Now"
      });
    }

    // Filter messages for /setmessage or /broadcast commands sent by CHAT_ID
    const cmdMessages = data.result
      .map(u => u.message || u.channel_post || u.edited_message)
      .filter(m => m && m.text && String(m.chat?.id) === String(CHAT_ID))
      .filter(m => m.text.startsWith('/setmessage') || m.text.startsWith('/broadcast') || m.text.startsWith('/status'));

    if (cmdMessages.length === 0) {
      return res.status(200).json({
        ok: true,
        broadcast: "Catching datasets and turning them into business decisions.",
        time: "Active Now"
      });
    }

    // Get the latest command message
    const latestMsg = cmdMessages[cmdMessages.length - 1];
    let cleanText = latestMsg.text
      .replace(/^\/(setmessage|broadcast|status)\s*/i, '')
      .trim();

    if (!cleanText) {
      cleanText = "Catching datasets and turning them into business decisions.";
    }

    const formattedTime = latestMsg.date
      ? new Date(latestMsg.date * 1000).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        })
      : "Active Now";

    return res.status(200).json({
      ok: true,
      broadcast: cleanText,
      time: formattedTime
    });
  } catch (err) {
    return res.status(200).json({
      ok: true,
      broadcast: "Catching datasets and turning them into business decisions.",
      time: "Active Now"
    });
  }
}
