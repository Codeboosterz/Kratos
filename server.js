require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const app = express();

// ─── Path Constants ──────────────────────────────────────────────────────────
const PUBLIC_DIR = path.join(__dirname, 'public');
const EBOOK_DIR = path.join(__dirname, process.env.EBOOK_STORAGE_DIR || 'private/ebooks');
const CATALOG_PATH = path.join(__dirname, process.env.EBOOK_CATALOG_PATH || 'private/ebooks/catalog.json');
const ORDERS_PATH = path.join(__dirname, process.env.EBOOK_ORDERS_PATH || 'private/ebooks/orders.json');
const MAX_EBOOK_MB = Number(process.env.MAX_EBOOK_MB || '50');
const MAX_EBOOK_BYTES = MAX_EBOOK_MB * 1024 * 1024;

// Ensure directories exist (gracefully handle read-only filesystems like Vercel)
try { fs.mkdirSync(PUBLIC_DIR, { recursive: true }); } catch {}
try { fs.mkdirSync(EBOOK_DIR, { recursive: true }); } catch {}

// ─── JSON File Helpers ───────────────────────────────────────────────────────
function readJsonSafe(filePath, fallbackObj) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallbackObj;
  } catch {
    return fallbackObj;
  }
}

function writeJsonSafe(filePath, obj) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), 'utf8');
  } catch {
    // Read-only filesystem (e.g., Vercel) — silently skip write
  }
}

function nowIso() {
  return new Date().toISOString();
}

// ─── Catalog Helpers ─────────────────────────────────────────────────────────
function readCatalog() {
  const catalog = readJsonSafe(CATALOG_PATH, { items: [] });
  catalog.items = Array.isArray(catalog.items) ? catalog.items : [];
  return catalog;
}

function writeCatalog(catalog) {
  writeJsonSafe(CATALOG_PATH, catalog);
}

function getEbookById(ebook_id) {
  const catalog = readCatalog();
  return catalog.items.find((x) => x.ebook_id === ebook_id) || null;
}

function publicEbookView(item) {
  return {
    ebook_id: item.ebook_id,
    title_nl: item.title_nl,
    short_desc_nl: item.short_desc_nl,
    price_cents: item.price_cents,
    currency: item.currency || 'eur',
    cover_img: item.cover_img || null,
    features: item.features || [],
    created_at: item.created_at,
  };
}

// ─── Admin Basic Auth Middleware ──────────────────────────────────────────────
function adminAuth(req, res, next) {
  const user = process.env.ADMIN_USER || '';
  const pass = process.env.ADMIN_PASS || '';
  const auth = req.headers.authorization || '';

  if (!user || !pass) {
    return res.status(503).send('Admin is niet geconfigureerd.');
  }

  if (!auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Kratos Admin"');
    return res.status(401).send('Authenticatie vereist.');
  }

  const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf8');
  const [u, ...pParts] = decoded.split(':');
  const p = pParts.join(':'); // password may contain ':'

  if (u !== user || p !== pass) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Kratos Admin"');
    return res.status(401).send('Ongeldige inloggegevens.');
  }
  next();
}

// ─── Base URL Helper ─────────────────────────────────────────────────────────
function getBaseUrl(req) {
  const envBase = process.env.BASE_URL;
  if (envBase) return envBase.replace(/\/$/, '');
  const proto = (req.headers['x-forwarded-proto'] || 'http').toString().split(',')[0];
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

// ─── In-Memory Rate Limiter ──────────────────────────────────────────────────
function createRateLimiter(windowMs, maxHits) {
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (now - entry.start > windowMs) hits.delete(key);
    }
  }, 60_000).unref();

  return (req, res, next) => {
    const key = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').toString().split(',')[0].trim();
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
const adminLimiter    = createRateLimiter(60_000, 10);

// ─── Security Headers + CSP ──────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Frame-Options', 'DENY');

  // CSP — allows Tailwind CDN, Google Fonts, wa.me links, Stripe checkout
  const csp = [
    "default-src 'self'",
    "script-src 'self' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com 'unsafe-inline'",
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

// ─── Stripe Webhook (MUST be before express.json — needs raw body) ───────────
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // If not configured, return 200 so Stripe doesn't keep retrying in dev.
    return res.status(200).send('Webhook not configured.');
  }

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const product = session.metadata?.product;
      const ebook_id = session.metadata?.ebook_id;

      if (product === 'ebook' && ebook_id) {
        const orders = readJsonSafe(ORDERS_PATH, { paid: [] });
        orders.paid = Array.isArray(orders.paid) ? orders.paid : [];

        // Avoid duplicate entries
        const exists = orders.paid.some(
          (o) => o.session_id === session.id && o.ebook_id === ebook_id
        );

        if (!exists) {
          orders.paid.push({
            ebook_id,
            session_id: session.id,
            customer_email: session.customer_details?.email || null,
            paid_at: nowIso(),
          });
          writeJsonSafe(ORDERS_PATH, orders);
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    res.status(500).send('Webhook handler failed.');
  }
});

// ─── Body Parser (after webhook — limits JSON body) ──────────────────────────
app.use(express.json({ limit: '10kb' }));

// ─── Static Files from /public ONLY ──────────────────────────────────────────
app.use(express.static(PUBLIC_DIR, {
  setHeaders(res, filePath) {
    const base = path.basename(filePath);
    // index.html should never be cached to keep deployments fresh
    if (base === 'index.html') {
      res.setHeader('Cache-Control', 'no-store');
      return;
    }
    // Basic asset caching
    const ext = path.extname(filePath).toLowerCase();
    const cacheable = ['.js', '.css', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
    if (cacheable.includes(ext)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  },
}));

// ─── Stripe Init ─────────────────────────────────────────────────────────────
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ─── Training Packages (existing allowlist) ──────────────────────────────────
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

app.post('/api/create-checkout-session', checkoutLimiter, async (req, res) => {
  try {
    const { package_id } = req.body || {};
    if (!package_id || typeof package_id !== 'string' || !VALID_PACKAGES.has(package_id)) {
      return res.status(400).json({ error: 'Ongeldig pakket.' });
    }

    const pkg = PACKAGES[package_id];
    const baseUrl = getBaseUrl(req);

    const line_items = pkg.price_id
      ? [{ price: pkg.price_id, quantity: pkg.quantity }]
      : [{
          price_data: {
            currency: 'eur',
            product_data: { name: pkg.name },
            unit_amount: pkg.unit_amount,
          },
          quantity: pkg.quantity,
        }];

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
    res.status(500).json({ error: 'Er ging iets mis bij het aanmaken van de checkout.' });
  }
});

// ─── Spoonacular Meal Plan Proxy ─────────────────────────────────────────────
const mealplanCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

app.get('/api/mealplan', mealplanLimiter, async (req, res) => {
  try {
    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'Meal plan service is niet beschikbaar. Neem contact op met Omar.',
      });
    }

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

    const cacheKey = `${targetCalories}-${timeFrame}-${diet}-${exclude}`;
    const cached = mealplanCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return res.json(cached.data);
    }

    const params = new URLSearchParams({
      apiKey,
      timeFrame,
      targetCalories: String(targetCalories),
    });
    if (diet) params.set('diet', diet);
    if (exclude) params.set('exclude', exclude);

    const spoonUrl = `https://api.spoonacular.com/mealplanner/generate?${params}`;
    const response = await fetch(spoonUrl);

    if (!response.ok) {
      return res.status(502).json({
        error: 'Oeps, dat lukt nu even niet. Probeer opnieuw of stuur Omar een bericht.',
      });
    }

    const data = await response.json();
    mealplanCache.set(cacheKey, { data, ts: Date.now() });
    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: 'Oeps, dat lukt nu even niet. Probeer opnieuw of stuur Omar een bericht.',
    });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// E-BOOKS MODULE: Admin Upload + Catalog + Checkout + Secure Download
// ═════════════════════════════════════════════════════════════════════════════

// ─── Multer Upload Config ────────────────────────────────────────────────────
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, EBOOK_DIR),
    filename: (_req, file, cb) => {
      const id = crypto.randomBytes(8).toString('hex');
      cb(null, `ebook_${Date.now()}_${id}.pdf`);
    },
  }),
  limits: { fileSize: MAX_EBOOK_BYTES },
  fileFilter: (_req, file, cb) => {
    const okMime = file.mimetype === 'application/pdf';
    const okExt = path.extname(file.originalname).toLowerCase() === '.pdf';
    if (!okMime && !okExt) return cb(new Error('Alleen PDF-bestanden zijn toegestaan.'));
    cb(null, true);
  },
});

// ─── Admin UI ────────────────────────────────────────────────────────────────
app.get('/admin', adminAuth, (_req, res) => {
  const catalog = readCatalog();
  const itemRows = catalog.items.map((item) => `
    <tr>
      <td>${item.ebook_id}</td>
      <td>${item.title_nl}</td>
      <td>€${(item.price_cents / 100).toFixed(2)}</td>
      <td>${item.file_name || '—'}</td>
      <td>${item.created_at || '—'}</td>
    </tr>
  `).join('');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(`<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Kratos Admin — E-books</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:system-ui,-apple-system,Arial,sans-serif;margin:0;padding:24px;max-width:960px;margin:auto;background:#0a0a0a;color:#e0e0e0}
    h1{color:#c4d64c;font-size:1.5rem;margin-bottom:4px}
    h2{color:#9ab832;margin-top:40px}
    p.muted{opacity:.6;margin-top:4px;font-size:.875rem}
    label{display:block;margin:14px 0 6px;font-weight:600;font-size:.875rem}
    input,textarea{width:100%;padding:10px 12px;border:1px solid #333;border-radius:8px;background:#1a1a1a;color:#e0e0e0;font-size:.875rem}
    input:focus,textarea:focus{outline:none;border-color:#c4d64c}
    button[type="submit"]{padding:12px 24px;margin-top:18px;cursor:pointer;background:#c4d64c;color:#0a0a0a;border:none;border-radius:8px;font-weight:700;font-size:.875rem}
    button[type="submit"]:hover{background:#9ab832}
    .row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    table{width:100%;border-collapse:collapse;margin-top:12px;font-size:.8rem}
    th,td{border:1px solid #222;padding:8px 10px;text-align:left}
    th{background:#1a1a1a;color:#c4d64c}
    code{background:#1a1a1a;padding:2px 6px;border-radius:4px;font-size:.8rem}
    hr{border:none;border-top:1px solid #222;margin:32px 0}
    .badge{display:inline-block;background:#c4d64c;color:#0a0a0a;padding:2px 8px;border-radius:4px;font-size:.7rem;font-weight:700}
  </style>
</head>
<body>
  <h1>🏋️ Kratos Admin — E-books</h1>
  <p class="muted">Upload een PDF en voeg titel/prijs toe. PDF's worden privé opgeslagen en zijn NIET publiek toegankelijk.</p>

  <form action="/api/admin/ebooks/upload" method="post" enctype="multipart/form-data">
    <div class="row">
      <div>
        <label>Titel (NL)</label>
        <input name="title_nl" required placeholder="Bijv. Meal Prep Mastery"/>
      </div>
      <div>
        <label>Prijs (EUR, bijv. 19.00)</label>
        <input name="price_eur" required placeholder="19.00" type="number" step="0.01" min="0.50"/>
      </div>
    </div>

    <label>Korte beschrijving (NL)</label>
    <textarea name="short_desc_nl" rows="3" placeholder="7 dagen plannen + boodschappenlijst + macro's."></textarea>

    <label>Cover image pad (optioneel, bijv. ./img/ebook_mealprep.svg)</label>
    <input name="cover_img" placeholder="./img/ebook_cover.svg"/>

    <label>Features (komma-gescheiden, bijv: 7-daagse planning, Complete boodschappenlijst)</label>
    <input name="features" placeholder="Feature 1, Feature 2, Feature 3"/>

    <label>PDF bestand (max ${MAX_EBOOK_MB} MB)</label>
    <input type="file" name="pdf" accept="application/pdf" required/>

    <button type="submit">📤 Upload e-book</button>
  </form>

  <hr/>
  <h2>📚 Catalog <span class="badge">${catalog.items.length} items</span></h2>
  <p class="muted">Public API: <code>GET /api/ebooks</code></p>

  ${catalog.items.length > 0 ? `
  <table>
    <thead>
      <tr><th>ID</th><th>Titel</th><th>Prijs</th><th>Bestand</th><th>Aangemaakt</th></tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
  ` : '<p class="muted">Nog geen e-books geüpload.</p>'}

</body>
</html>`);
});

// ─── Admin Upload Endpoint ───────────────────────────────────────────────────
app.post('/api/admin/ebooks/upload', adminAuth, adminLimiter, upload.single('pdf'), (req, res) => {
  try {
    const title_nl = String(req.body.title_nl || '').trim();
    const short_desc_nl = String(req.body.short_desc_nl || '').trim();
    const cover_img = String(req.body.cover_img || '').trim();
    const featuresRaw = String(req.body.features || '').trim();
    const price_eur_raw = String(req.body.price_eur || '').replace(',', '.').trim();

    if (!title_nl || !price_eur_raw) {
      return res.status(400).send('Titel en prijs zijn verplicht.');
    }

    const euros = Number(price_eur_raw);
    if (!Number.isFinite(euros) || euros <= 0) {
      return res.status(400).send('Ongeldige prijs.');
    }

    if (!req.file) {
      return res.status(400).send('Geen PDF-bestand geüpload.');
    }

    const features = featuresRaw
      ? featuresRaw.split(',').map((f) => f.trim()).filter(Boolean)
      : [];

    const catalog = readCatalog();
    const ebook_id = `ebook_${crypto.randomBytes(6).toString('hex')}`;

    catalog.items.push({
      ebook_id,
      title_nl,
      short_desc_nl,
      price_cents: Math.round(euros * 100),
      currency: 'eur',
      cover_img: cover_img || null,
      features,
      file_name: req.file.filename,
      created_at: nowIso(),
    });

    writeCatalog(catalog);
    res.redirect('/admin');
  } catch (err) {
    res.status(500).send('Upload mislukt.');
  }
});

// ─── Admin: Delete E-book ────────────────────────────────────────────────────
app.delete('/api/admin/ebooks/:ebook_id', adminAuth, (req, res) => {
  try {
    const ebook_id = req.params.ebook_id;
    const catalog = readCatalog();
    const idx = catalog.items.findIndex((x) => x.ebook_id === ebook_id);
    if (idx === -1) return res.status(404).json({ error: 'Niet gevonden.' });

    const item = catalog.items[idx];

    // Delete file if exists
    if (item.file_path && fs.existsSync(item.file_path)) {
      fs.unlinkSync(item.file_path);
    }

    catalog.items.splice(idx, 1);
    writeCatalog(catalog);

    res.json({ deleted: ebook_id });
  } catch (err) {
    res.status(500).json({ error: 'Verwijderen mislukt.' });
  }
});

// ─── Public Catalog API ──────────────────────────────────────────────────────
app.get('/api/ebooks', (_req, res) => {
  const catalog = readCatalog();
  res.json({ items: catalog.items.map(publicEbookView) });
});

// ─── E-book Stripe Checkout ──────────────────────────────────────────────────
app.post('/api/create-ebook-checkout-session', checkoutLimiter, async (req, res) => {
  try {
    const ebook_id = String(req.body?.ebook_id || '').trim();
    if (!ebook_id) return res.status(400).json({ error: 'Ongeldig e-book.' });

    const ebook = getEbookById(ebook_id);
    if (!ebook) return res.status(404).json({ error: 'E-book niet gevonden.' });

    const baseUrl = getBaseUrl(req);

    // Optional: Price IDs via env for fixed products
    const envKey = `STRIPE_PRICE_${ebook_id.toUpperCase()}`;
    const priceId = process.env[envKey] || null;

    const line_items = priceId
      ? [{ price: priceId, quantity: 1 }]
      : [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Kratos – ${ebook.title_nl}`,
              description: ebook.short_desc_nl || undefined,
            },
            unit_amount: Number(ebook.price_cents),
          },
          quantity: 1,
        }];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      billing_address_collection: 'auto',
      success_url: `${baseUrl}/?payment=success&product=ebook&ebook_id=${encodeURIComponent(ebook_id)}&session_id={CHECKOUT_SESSION_ID}#ebooks`,
      cancel_url: `${baseUrl}/?payment=cancel&product=ebook&ebook_id=${encodeURIComponent(ebook_id)}#ebooks`,
      locale: 'nl',
      customer_creation: 'if_required',
      metadata: { product: 'ebook', ebook_id },
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: 'Er ging iets mis bij het aanmaken van de checkout.' });
  }
});

// ─── E-book Download: Payment Verification + Token Generation ────────────────
function isEbookPaid(ebook_id, session_id) {
  const orders = readJsonSafe(ORDERS_PATH, { paid: [] });
  const paid = Array.isArray(orders.paid) ? orders.paid : [];
  // Check by ebook_id (webhook flow) or by session_id (direct verification)
  return paid.some((x) => x.ebook_id === ebook_id) || !!session_id;
}

function signToken(payloadObj) {
  const secret = process.env.DOWNLOAD_TOKEN_SECRET || '';
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token) {
  const secret = process.env.DOWNLOAD_TOKEN_SECRET || '';
  const parts = String(token || '').split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  if (!payload || !sig) return null;

  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');

  // Timing-safe comparison
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

app.get('/api/ebook-download-link', downloadLimiter, async (req, res) => {
  try {
    const ebook_id = String(req.query.ebook_id || '').trim();
    const session_id = String(req.query.session_id || '').trim();

    if (!ebook_id) return res.status(400).json({ error: 'Ongeldig e-book ID.' });

    const ebook = getEbookById(ebook_id);
    if (!ebook) return res.status(404).json({ error: 'E-book niet gevonden.' });

    if (!process.env.DOWNLOAD_TOKEN_SECRET) {
      return res.status(503).json({ error: 'Download service is niet geconfigureerd.' });
    }

    // Strategy: First check orders.json (webhook-based). If webhook not configured,
    // fall back to Stripe session verification (direct check).
    let paid = false;

    // Check webhook-based orders
    const orders = readJsonSafe(ORDERS_PATH, { paid: [] });
    const paidOrders = Array.isArray(orders.paid) ? orders.paid : [];
    paid = paidOrders.some((o) => o.ebook_id === ebook_id);

    // Fallback: verify Stripe session directly if no webhook order found
    if (!paid && session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(session_id);
        if (session && session.payment_status === 'paid' && session.metadata?.ebook_id === ebook_id) {
          paid = true;

          // Persist to orders.json for future requests (auto-heal from missing webhook)
          if (!paidOrders.some((o) => o.session_id === session_id)) {
            paidOrders.push({
              ebook_id,
              session_id,
              customer_email: session.customer_details?.email || null,
              paid_at: nowIso(),
              source: 'session_verify',
            });
            writeJsonSafe(ORDERS_PATH, { paid: paidOrders });
          }
        }
      } catch {
        // Stripe session retrieval failed — continue with paid=false
      }
    }

    if (!paid) {
      return res.status(403).json({ error: 'Geen geldige aankoop gevonden. Contacteer Omar als je hulp nodig hebt.' });
    }

    // Generate short-lived token (5 minutes)
    const expiresAt = Date.now() + 5 * 60 * 1000;
    const token = signToken({ ebook_id, exp: expiresAt });
    const baseUrl = getBaseUrl(req);
    res.json({ download_url: `${baseUrl}/api/ebook-download?token=${encodeURIComponent(token)}` });
  } catch (err) {
    res.status(500).json({ error: 'Er ging iets mis. Probeer opnieuw of neem contact op.' });
  }
});

app.get('/api/ebook-download', downloadLimiter, (req, res) => {
  try {
    const token = String(req.query.token || '');
    const payload = verifyToken(token);
    if (!payload) return res.status(403).send('Ongeldige download link.');
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) {
      return res.status(403).send('Download link is verlopen.');
    }

    const ebook_id = String(payload.ebook_id || '').trim();
    const ebook = getEbookById(ebook_id);
    if (!ebook) return res.status(404).send('E-book niet gevonden.');

    // Resolve file path — prefer file_name + EBOOK_DIR for portability
    const filePath = ebook.file_name
      ? path.join(EBOOK_DIR, ebook.file_name)
      : ebook.file_path;
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).send('Bestand niet gevonden. Neem contact op met Omar.');
    }

    // Sanitize filename for Content-Disposition
    const safeName = (ebook.title_nl || 'ebook').replace(/[^a-zA-Z0-9\-\s]/g, '').trim() || 'ebook';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.status(500).send('Fout bij downloaden. Probeer opnieuw.');
      }
    });
    stream.pipe(res);
  } catch (err) {
    res.status(500).send('Er ging iets mis bij het downloaden.');
  }
});

// ─── Fallback: serve index.html ──────────────────────────────────────────────
app.get('*', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Kratos server draait op http://localhost:${PORT}`);
});
