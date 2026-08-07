// Vercel Serverless Function: Secure Telegram Bot Notification API
// Location: api/telegram.js
// Fixed: HTML Parse Mode, Reliable Origin Validation, Robust Credentials

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;      // 10 requests per IP per minute

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
}

function isOriginAllowed(req) {
  const origin = req.headers['origin'];
  const referer = req.headers['referer'];
  if (!origin && !referer) return true; // Same origin or direct fetch
  const target = origin || referer || '';
  return (
    target.includes('vercel.app') ||
    target.includes('github.io') ||
    target.includes('localhost') ||
    target.includes('127.0.0.1')
  );
}

export default async function handler(req, res) {
  const origin = req.headers['origin'] || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!isOriginAllowed(req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(clientIp)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      console.error('[Telegram Config Error] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment variables.');
      return res.status(500).json({ error: 'Telegram credentials missing in environment variables' });
    }

    const body = req.body || {};
    const action = escapeHTML(body.action || 'Portfolio Visitor Interaction').slice(0, 100);
    const name = escapeHTML(body.name || '').slice(0, 100);
    const contact = escapeHTML(body.contact || '').slice(0, 200);
    const customMessage = escapeHTML(body.customMessage || '').slice(0, 1000);

    // Bot trap check
    if (body.website || body.url || body.honeypot) {
      return res.status(200).json({ ok: true });
    }

    // Geolocation
    const vercelCity = req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : null;
    const vercelCountry = req.headers['x-vercel-ip-country'] || null;

    let locationStr = 'Unknown Location';
    if (vercelCity && vercelCountry) {
      locationStr = `${vercelCity}, ${vercelCountry}`;
    } else if (clientIp && !clientIp.includes('127.0.0.1') && !clientIp.includes('::1') && clientIp !== 'unknown') {
      try {
        const geoRes = await fetch(`https://ipapi.co/${clientIp}/json/`, { signal: AbortSignal.timeout(3000) });
        const geoData = await geoRes.json();
        if (geoData.city && geoData.country_name) {
          locationStr = `${geoData.city}, ${geoData.country_name}`;
        }
      } catch (e) {}
    }

    // Device
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    let deviceStr = '💻 Desktop Browser';
    if (/mobile/i.test(userAgent)) deviceStr = '📱 Mobile Device';
    else if (/tablet|ipad/i.test(userAgent)) deviceStr = '📱 Tablet Device';
    else if (/macintosh|mac os x/i.test(userAgent)) deviceStr = '💻 Mac Desktop';
    else if (/windows/i.test(userAgent)) deviceStr = '💻 Windows PC';

    // HTML Message Body
    let messageText = `🚨 <b>SPIDER-SIGNAL ALERT!</b> 🕷️\n\n`;
    messageText += `🎯 <b>Action:</b> ${action}\n`;
    messageText += `📍 <b>Location:</b> ${locationStr}\n`;
    messageText += `💻 <b>Device:</b> ${deviceStr}\n`;
    messageText += `📅 <b>Time:</b> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n`;

    if (customMessage) {
      messageText += `\n💬 <b>DIRECT MESSAGE FROM VISITOR:</b>\n`;
      if (name) messageText += `👤 <b>Sender:</b> ${name}\n`;
      if (contact) messageText += `📧 <b>Contact:</b> ${contact}\n`;
      messageText += `📝 <b>Text:</b> "${customMessage}"\n`;
    }

    const telegramRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: messageText,
        parse_mode: 'HTML'
      })
    });

    const data = await telegramRes.json();
    return res.status(200).json({ ok: data.ok || false, result: data });
  } catch (err) {
    console.error('[Telegram API Error]', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
