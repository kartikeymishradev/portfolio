// Vercel Serverless Function: Secure Telegram Bot Notification API
// Location: api/telegram.js
// Security Hardened: Rate limiting, Origin validation, Input sanitization

// ── IN-MEMORY RATE LIMITER (per Vercel instance) ──
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5;       // max 5 requests per IP per minute

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  return false;
}

// ── ALLOWED ORIGINS (add your production domains here) ──
const ALLOWED_ORIGINS = [
  'https://portfolio-alpha-roan-38.vercel.app',
  'https://kartikeymishradev.vercel.app',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
];

function isOriginAllowed(origin) {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some(allowed =>
    origin === allowed || origin.endsWith('.vercel.app')
  );
}

// ── INPUT SANITIZATION ──
function sanitizeString(input, maxLength = 500) {
  if (typeof input !== 'string') return '';
  // Trim, enforce max length, escape Telegram Markdown special chars
  let clean = input.trim().slice(0, maxLength);
  // Escape Markdown V1 special characters: _ * ` [
  clean = clean.replace(/([_*`\[])/g, '\\$1');
  return clean;
}

export default async function handler(req, res) {
  // ── CORS HEADERS ──
  const origin = req.headers['origin'] || '';
  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ── ORIGIN VALIDATION ──
  if (!isOriginAllowed(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // ── RATE LIMITING ──
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  try {
    // ── SECRETS FROM ENVIRONMENT ONLY (no hardcoded fallbacks!) ──
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      console.error('[Telegram Config Error] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variables.');
      return res.status(500).json({ error: 'Service temporarily unavailable.' });
    }

    // ── INPUT VALIDATION & SANITIZATION ──
    const body = req.body || {};
    const action = sanitizeString(body.action, 100) || 'Portfolio Visitor Interaction';
    const name = sanitizeString(body.name, 100);
    const contact = sanitizeString(body.contact, 200);
    const customMessage = sanitizeString(body.customMessage, 1000);

    // ── HONEYPOT CHECK (bot trap) ──
    if (body.website || body.url || body.honeypot) {
      // Silently reject — likely a bot filling hidden fields
      return res.status(200).json({ ok: true });
    }

    // ── GEOLOCATION (HTTPS only) ──
    const vercelCity = req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : null;
    const vercelCountry = req.headers['x-vercel-ip-country'] || null;

    let locationStr = 'Unknown Location';
    if (vercelCity && vercelCountry) {
      locationStr = `${vercelCity}, ${vercelCountry}`;
    } else if (clientIp && !clientIp.includes('127.0.0.1') && !clientIp.includes('::1') && clientIp !== 'unknown') {
      try {
        // FIXED: Using HTTPS instead of HTTP (MED-04)
        const geoRes = await fetch(`https://ipapi.co/${clientIp}/json/`, {
          signal: AbortSignal.timeout(3000) // 3 second timeout
        });
        const geoData = await geoRes.json();
        if (geoData.city && geoData.country_name) {
          locationStr = `${geoData.city}, ${geoData.country_name}${geoData.org ? ` (${geoData.org})` : ''}`;
        }
      } catch (e) {
        // Geo lookup failed silently — non-critical
      }
    }

    // ── DEVICE DETECTION ──
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    let deviceStr = '💻 Desktop Browser';
    if (/mobile/i.test(userAgent)) deviceStr = '📱 Mobile Device';
    else if (/tablet|ipad/i.test(userAgent)) deviceStr = '📱 Tablet Device';
    else if (/macintosh|mac os x/i.test(userAgent)) deviceStr = '💻 Mac Desktop';
    else if (/windows/i.test(userAgent)) deviceStr = '💻 Windows PC';

    // ── BUILD TELEGRAM MESSAGE ──
    let messageText = `🚨 *SPIDER\\-SIGNAL ALERT\\!* 🕷️\n\n`;
    messageText += `🎯 *Action:* ${action}\n`;
    messageText += `📍 *Location:* ${locationStr}\n`;
    messageText += `💻 *Device:* ${deviceStr}\n`;
    messageText += `📅 *Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n`;

    if (customMessage) {
      messageText += `\n💬 *DIRECT MESSAGE FROM VISITOR:*\n`;
      if (name) messageText += `👤 *Sender:* ${name}\n`;
      if (contact) messageText += `📧 *Contact:* ${contact}\n`;
      messageText += `📝 *Text:* "${customMessage}"\n`;
    }

    // ── SEND TO TELEGRAM ──
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

    // Don't expose Telegram API response details to client
    return res.status(200).json({ ok: data.ok || false });

  } catch (err) {
    // FIXED: Log full error server-side, return ONLY generic message to client (MED-01)
    console.error('[Telegram API Error]', err.message, err.stack);
    return res.status(500).json({ error: 'Service temporarily unavailable.' });
  }
}
