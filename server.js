require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const app = express();

// ─── Security Headers Middleware ──────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Frame-Options', 'DENY');

  // CSP — allows Tailwind CDN, Google Fonts, wa.me links, Amazon links, Stripe checkout
  const csp = [
    "default-src 'self'",
    "script-src 'self' https://cdn.tailwindcss.com 'unsafe-inline'",
    "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://checkout.stripe.com",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.stripe.com",
  ].join('; ');
  res.setHeader('Content-Security-Policy', csp);

  next();
});

// ─── Body Parser with Size Limit ─────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ─── Static Files from /public ONLY ──────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '7d',             // cache static assets 7 days
  setHeaders(res, filePath) {
    // HTML should never be cached
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
  },
}));

// ─── Simple In-Memory Rate Limiter ───────────────────────────────────────────
function createRateLimiter(windowMs, maxHits) {
  const hits = new Map();

  // Cleanup old entries every minute
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (now - entry.start > windowMs) hits.delete(key);
    }
  }, 60_000).unref();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    let entry = hits.get(key);

    if (!entry || now - entry.start > windowMs) {
      entry = { count: 1, start: now };
      hits.set(key, entry);
      return next();
    }

    entry.count++;
    if (entry.count > maxHits) {
      return res.status(429).json({
        error: 'Te veel verzoeken. Probeer het over een minuut opnieuw.',
      });
    }
    next();
  };
}

const checkoutLimiter = createRateLimiter(60_000, 30);
const mealplanLimiter = createRateLimiter(60_000, 60);
const downloadLimiter = createRateLimiter(60_000, 20);

// ─── Stripe Init ─────────────────────────────────────────────────────────────
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ─── Package Config ──────────────────────────────────────────────────────────
const PACKAGES = {
  pakket_1: {
    name: 'Kratos – 1 Sessie Personal Training',
    unit_amount: 5000,
    quantity: 1,
    price_id: process.env.STRIPE_PRICE_PAKKET_1 || null,
  },
  pakket_5: {
    name: 'Kratos – 5 Sessies Personal Training',
    unit_amount: 3500,
    quantity: 5,
    price_id: process.env.STRIPE_PRICE_PAKKET_5 || null,
  },
  pakket_10: {
    name: 'Kratos – 10 Sessies Personal Training',
    unit_amount: 3000,
    quantity: 10,
    price_id: process.env.STRIPE_PRICE_PAKKET_10 || null,
  },
};

const VALID_PACKAGES = new Set(['pakket_1', 'pakket_5', 'pakket_10']);

// ─── E-Book Catalog Config ──────────────────────────────────────────────────
const EBOOKS = {
  ebook_1: {
    name: 'Meal Prep Mastery',
    description: '7 dagen plannen + boodschappenlijst + macro\'s.',
    unit_amount: 1900,
    file_path: path.join(__dirname, 'private', 'ebooks', 'meal-prep-mastery.pdf'),
    price_id: process.env.STRIPE_PRICE_EBOOK_1 || null,
  },
  ebook_2: {
    name: 'Kracht & Spieropbouw',
    description: '4-week schema\'s + progressie & techniek.',
    unit_amount: 2500,
    file_path: path.join(__dirname, 'private', 'ebooks', 'kracht-spieropbouw.pdf'),
    price_id: process.env.STRIPE_PRICE_EBOOK_2 || null,
  },
  ebook_3: {
    name: 'Vetverlies Zonder Gedoe',
    description: 'Realistische aanpak + habits + voeding.',
    unit_amount: 1700,
    file_path: path.join(__dirname, 'private', 'ebooks', 'vetverlies-zonder-gedoe.pdf'),
    price_id: process.env.STRIPE_PRICE_EBOOK_3 || null,
  },
};

const VALID_EBOOKS = new Set(['ebook_1', 'ebook_2', 'ebook_3']);

// HMAC secret for download tokens — derived from Stripe key for simplicity
const HMAC_SECRET = process.env.STRIPE_SECRET_KEY || 'kratos-fallback-secret-change-me';
const TOKEN_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// ─── Create Checkout Session (Packages) ─────────────────────────────────────
app.post('/api/create-checkout-session', checkoutLimiter, async (req, res) => {
  try {
    const { package_id } = req.body;

    // Input validation
    if (!package_id || typeof package_id !== 'string' || !VALID_PACKAGES.has(package_id)) {
      return res.status(400).json({ error: 'Ongeldig pakket.' });
    }

    const pkg = PACKAGES[package_id];
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

    let line_items;
    if (pkg.price_id) {
      line_items = [{ price: pkg.price_id, quantity: pkg.quantity }];
    } else {
      line_items = [{
        price_data: {
          currency: 'eur',
          product_data: { name: pkg.name },
          unit_amount: pkg.unit_amount,
        },
        quantity: pkg.quantity,
      }];
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      billing_address_collection: 'auto',
      success_url: `${baseUrl}/?payment=success#contact`,
      cancel_url: `${baseUrl}/?payment=cancel#prijzen`,
      locale: 'nl',
      metadata: { package_id },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: 'Er ging iets mis bij het aanmaken van de checkout.' });
  }
});

// ─── Create Ebook Checkout Session ──────────────────────────────────────────
app.post('/api/create-ebook-checkout-session', checkoutLimiter, async (req, res) => {
  try {
    const { ebook_id } = req.body;

    // Input validation — allowlist only
    if (!ebook_id || typeof ebook_id !== 'string' || !VALID_EBOOKS.has(ebook_id)) {
      return res.status(400).json({ error: 'Ongeldig e-book.' });
    }

    const ebook = EBOOKS[ebook_id];
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

    let line_items;
    if (ebook.price_id) {
      line_items = [{ price: ebook.price_id, quantity: 1 }];
    } else {
      line_items = [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Kratos E-Book – ${ebook.name}`,
            description: ebook.description,
          },
          unit_amount: ebook.unit_amount,
        },
        quantity: 1,
      }];
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      billing_address_collection: 'auto',
      success_url: `${baseUrl}/?payment=success&product=ebook&ebook_id=${ebook_id}&session_id={CHECKOUT_SESSION_ID}#ebooks`,
      cancel_url: `${baseUrl}/?payment=cancel&product=ebook&ebook_id=${ebook_id}#ebooks`,
      locale: 'nl',
      metadata: { ebook_id, product_type: 'ebook' },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Ebook Stripe error:', err.message);
    res.status(500).json({ error: 'Er ging iets mis bij het openen van de checkout. Probeer opnieuw of neem contact op.' });
  }
});

// ─── Ebook Download Link (Verify Payment + Generate Token) ──────────────────
app.get('/api/ebook-download-link', downloadLimiter, async (req, res) => {
  try {
    const { ebook_id, session_id } = req.query;

    // Validate inputs
    if (!ebook_id || typeof ebook_id !== 'string' || !VALID_EBOOKS.has(ebook_id)) {
      return res.status(400).json({ error: 'Ongeldig e-book ID.' });
    }

    if (!session_id || typeof session_id !== 'string' || session_id.length > 200) {
      return res.status(400).json({ error: 'Ongeldig sessie ID.' });
    }

    // Verify Stripe session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (!session || session.payment_status !== 'paid') {
      return res.status(403).json({ error: 'Betaling niet gevonden of nog niet afgerond.' });
    }

    // Verify the session was for this ebook
    if (session.metadata?.ebook_id !== ebook_id) {
      return res.status(403).json({ error: 'Dit sessie-ID hoort niet bij dit e-book.' });
    }

    // Generate short-lived HMAC download token
    const timestamp = Date.now();
    const payload = `${ebook_id}:${timestamp}`;
    const hmac = crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
    const token = Buffer.from(`${payload}:${hmac}`).toString('base64url');

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    res.json({ download_url: `${baseUrl}/api/ebook-download?token=${token}` });
  } catch (err) {
    console.error('Download link error:', err.message);

    if (err.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ error: 'Ongeldige sessie. Probeer opnieuw of neem contact op.' });
    }

    res.status(500).json({ error: 'Er ging iets mis. Probeer opnieuw of neem contact op.' });
  }
});

// ─── Ebook Download (Token-Based PDF Streaming) ─────────────────────────────
app.get('/api/ebook-download', downloadLimiter, (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string' || token.length > 500) {
      return res.status(400).json({ error: 'Ongeldige download link.' });
    }

    // Decode and verify token
    let decoded;
    try {
      decoded = Buffer.from(token, 'base64url').toString('utf-8');
    } catch {
      return res.status(400).json({ error: 'Ongeldige download link.' });
    }

    const parts = decoded.split(':');
    if (parts.length !== 3) {
      return res.status(400).json({ error: 'Ongeldige download link.' });
    }

    const [ebook_id, timestampStr, providedHmac] = parts;
    const timestamp = parseInt(timestampStr, 10);

    // Validate ebook_id
    if (!VALID_EBOOKS.has(ebook_id)) {
      return res.status(400).json({ error: 'Ongeldig e-book.' });
    }

    // Verify HMAC
    const expectedPayload = `${ebook_id}:${timestamp}`;
    const expectedHmac = crypto.createHmac('sha256', HMAC_SECRET).update(expectedPayload).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(providedHmac, 'hex'), Buffer.from(expectedHmac, 'hex'))) {
      return res.status(403).json({ error: 'Download link is ongeldig of verlopen.' });
    }

    // Check expiry
    if (Date.now() - timestamp > TOKEN_EXPIRY_MS) {
      return res.status(403).json({ error: 'Download link is verlopen. Vraag een nieuwe link aan.' });
    }

    // Stream the PDF
    const ebook = EBOOKS[ebook_id];
    const filePath = ebook.file_path;

    if (!fs.existsSync(filePath)) {
      console.error(`Ebook file not found: ${filePath}`);
      return res.status(404).json({ error: 'E-book bestand niet gevonden. Neem contact op met Omar.' });
    }

    const fileName = path.basename(filePath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => {
      console.error('Stream error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Fout bij downloaden. Probeer opnieuw.' });
      }
    });
    stream.pipe(res);
  } catch (err) {
    console.error('Download error:', err.message);
    res.status(500).json({ error: 'Er ging iets mis bij het downloaden.' });
  }
});

// ─── Spoonacular Meal Plan Proxy ─────────────────────────────────────────────
const mealplanCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Node <18 fetch polyfill guard
const fetchFn = typeof globalThis.fetch === 'function'
  ? globalThis.fetch
  : (() => { try { return require('node-fetch'); } catch { return null; } })();

app.get('/api/mealplan', mealplanLimiter, async (req, res) => {
  try {
    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'Meal plan service is niet beschikbaar. Neem contact op met Omar.',
      });
    }

    if (!fetchFn) {
      return res.status(503).json({
        error: 'Server configuratie fout. Neem contact op met Omar.',
      });
    }

    // Input validation
    const targetCalories = parseInt(req.query.targetCalories, 10) || 2000;
    if (targetCalories < 1200 || targetCalories > 4500) {
      return res.status(400).json({ error: 'Calorieën moeten tussen 1200 en 4500 liggen.' });
    }

    const timeFrame = req.query.timeFrame === 'week' ? 'week' : 'day';

    const diet = typeof req.query.diet === 'string'
      ? req.query.diet.slice(0, 30).replace(/[^a-zA-Z\s]/g, '')
      : '';

    const exclude = typeof req.query.exclude === 'string'
      ? req.query.exclude.slice(0, 120)
      : '';

    // Cache check
    const cacheKey = `${targetCalories}-${timeFrame}-${diet}-${exclude}`;
    const cached = mealplanCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return res.json(cached.data);
    }

    // Build Spoonacular URL
    const params = new URLSearchParams({
      apiKey,
      timeFrame,
      targetCalories: String(targetCalories),
    });
    if (diet) params.set('diet', diet);
    if (exclude) params.set('exclude', exclude);

    const spoonUrl = `https://api.spoonacular.com/mealplanner/generate?${params}`;
    const response = await fetchFn(spoonUrl);

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Spoonacular error:', response.status, errBody);
      return res.status(502).json({
        error: 'Oeps, dat lukt nu even niet. Probeer opnieuw of stuur Omar een bericht.',
      });
    }

    const data = await response.json();
    mealplanCache.set(cacheKey, { data, ts: Date.now() });
    res.json(data);
  } catch (err) {
    console.error('Mealplan proxy error:', err.message);
    res.status(500).json({
      error: 'Oeps, dat lukt nu even niet. Probeer opnieuw of stuur Omar een bericht.',
    });
  }
});

// ─── Fallback: serve index.html ──────────────────────────────────────────────
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Kratos server draait op http://localhost:${PORT}`);
});
