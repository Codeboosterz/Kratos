# Kratos E-books Module

> Admin upload + Stripe Checkout + beveiligde download

## Install

```bash
npm install
cp .env.example .env   # Vul de waarden in
npm start
```

## Admin Panel

Open: `http://localhost:3000/admin`

- **Basic Auth** via `ADMIN_USER` en `ADMIN_PASS` in `.env`
- Upload PDF, stel titel, prijs, beschrijving en cover in
- Catalog wordt opgeslagen in `private/ebooks/catalog.json`
- Bestanden worden opgeslagen in `private/ebooks/` (NIET publiek)

## API Endpoints

### Public

| Method | Path | Beschrijving |
|--------|------|-------------|
| `GET` | `/api/ebooks` | Catalog ophalen (zonder file paths) |
| `POST` | `/api/create-ebook-checkout-session` | Stripe Checkout starten |
| `GET` | `/api/ebook-download-link` | Download-token genereren |
| `GET` | `/api/ebook-download` | PDF downloaden (token vereist) |

### Admin (Basic Auth)

| Method | Path | Beschrijving |
|--------|------|-------------|
| `GET` | `/admin` | Admin paneel |
| `POST` | `/api/admin/ebooks/upload` | PDF uploaden + catalogus bijwerken |
| `DELETE` | `/api/admin/ebooks/:id` | E-book verwijderen |

## Checkout Flow

```
1. Frontend → POST /api/create-ebook-checkout-session { ebook_id }
2. Server → Stripe Checkout sessie aanmaken → { url }
3. Klant betaalt op Stripe
4. Redirect terug → /?payment=success&product=ebook&ebook_id=...&session_id=...#ebooks
5. Frontend → GET /api/ebook-download-link?ebook_id=...&session_id=...
6. Server → verifieert betaling → { download_url: /api/ebook-download?token=... }
7. Frontend → window.open(download_url) → PDF stream
```

## Download Beveiliging

- PDF's staan in `/private/ebooks/` — NOOIT bereikbaar via `express.static`
- Download vereist HMAC-gesigneerd token met 5 minuten verlooptijd
- Token wordt gesigneerd met `DOWNLOAD_TOKEN_SECRET`
- `crypto.timingSafeEqual` voorkomt timing attacks
- Betaling wordt geverifieerd via:
  1. **Webhook** (aanbevolen): Stripe stuurt `checkout.session.completed` → opgeslagen in `orders.json`
  2. **Fallback**: Directe Stripe session verificatie met session_id

## Stripe Webhook (aanbevolen)

1. Configureer in Stripe Dashboard: `POST https://YOUR_DOMAIN/api/stripe-webhook`
2. Stel `STRIPE_WEBHOOK_SECRET` in de `.env`
3. Events: `checkout.session.completed`

> Zonder webhook werkt de fallback (session verificatie), maar webhook is betrouwbaarder.

## Environment Variables

| Variabele | Verplicht | Beschrijving |
|-----------|-----------|-------------|
| `STRIPE_SECRET_KEY` | ✅ | Stripe API key |
| `BASE_URL` | ✅ | Publieke URL (bijv. `https://kratosfitness.be`) |
| `ADMIN_USER` | ✅ | Admin gebruikersnaam |
| `ADMIN_PASS` | ✅ | Admin wachtwoord |
| `DOWNLOAD_TOKEN_SECRET` | ✅ | Geheim voor download tokens |
| `PORT` | ❌ | Server poort (default: 3000) |
| `STRIPE_WEBHOOK_SECRET` | ❌ | Stripe webhook geheim |
| `SPOONACULAR_API_KEY` | ❌ | Meal plan API key |
| `MAX_EBOOK_MB` | ❌ | Max upload grootte (default: 50 MB) |

## Security Checklist

- [x] Serve static ONLY from `/public`
- [x] PDF's in `/private/ebooks` — nooit direct bereikbaar
- [x] Admin met Basic Auth
- [x] Rate limiting op alle gevoelige endpoints
- [x] HMAC getekende download tokens (5 min TTL)
- [x] JSON body limit: 10kb
- [x] CSP headers
- [x] Geen secrets in frontend code
- [x] Multer file filter: alleen PDF
- [x] Multer size limit: configureerbaar via `MAX_EBOOK_MB`
