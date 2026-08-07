// Vercel Serverless Function: Secure Telegram Bot Notification API
// Location: api/telegram.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8719318935:AAEltW1gxcf084aat-L-AkpBSf6dW7tdq4U';
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '6233775039';

    const { action, name, contact, customMessage } = req.body || {};
    const eventName = action || 'Portfolio Visitor Interaction';

    // Get visitor IP & Vercel Location Headers
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || '';
    const vercelCity = req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : null;
    const vercelCountry = req.headers['x-vercel-ip-country'] || null;

    let locationStr = 'Unknown Location';
    if (vercelCity && vercelCountry) {
      locationStr = `${vercelCity}, ${vercelCountry}`;
    } else if (clientIp && !clientIp.includes('127.0.0.1') && !clientIp.includes('::1')) {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,city,country,org`);
        const geoData = await geoRes.json();
        if (geoData.status === 'success') {
          locationStr = `${geoData.city}, ${geoData.country} (${geoData.org})`;
        }
      } catch(e) {}
    }

    // Parse Device User Agent
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    let deviceStr = 'Desktop Browser';
    if (/mobile/i.test(userAgent)) deviceStr = '📱 Mobile Device';
    else if (/tablet|ipad/i.test(userAgent)) deviceStr = '📱 Tablet Device';
    else if (/macintosh|mac os x/i.test(userAgent)) deviceStr = '💻 Mac Desktop';
    else if (/windows/i.test(userAgent)) deviceStr = '💻 Windows PC';

    let messageText = `🚨 *SPIDER-SIGNAL ALERT!* 🕷️\n\n`;
    messageText += `🎯 *Action:* ${eventName}\n`;
    messageText += `📍 *Location:* ${locationStr}\n`;
    messageText += `💻 *Device:* ${deviceStr}\n`;
    messageText += `📅 *Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n`;

    if (customMessage) {
      messageText += `\n💬 *DIRECT MESSAGE FROM VISITOR:*\n`;
      if (name) messageText += `👤 *Sender:* ${name}\n`;
      if (contact) messageText += `📧 *Contact:* ${contact}\n`;
      messageText += `📝 *Text:* "${customMessage}"\n`;
    }

    const telegramRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: messageText,
        parse_mode: 'Markdown'
      })
    });

    const data = await telegramRes.json();
    return res.status(200).json({ ok: true, data });
  } catch (err) {
    console.error('[Telegram API Error]', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
