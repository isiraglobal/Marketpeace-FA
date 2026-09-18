# Marketpeace Repository Setup & Vercel Deployment Prompt

## Repository Information
- **Source Repo (local):** `/Users/lakshitsinghvi/Documents/Repos/Marketpeace-FA-download`
- **Target GitHub Repo:** `https://github.com/isiraglobal/Marketpeace-FA`
- **New Repo Name:** `marketpeace`
- **Owner:** `isiraglobal`

---

## Required Environment Variables for Vercel

Copy these to Vercel Dashboard → Settings → Environment Variables (Production, Preview, Development):

| Variable | Value | Notes |
|----------|-------|-------|
| `STRIPE_SECRET_KEY` | `sk_live_...` or `sk_test_...` | Stripe secret key (NEVER expose client-side) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | From Stripe Dashboard → Webhooks → Signing Secret |
| `GOOGLE_SCRIPT_URL` | `https://script.google.com/macros/s/.../exec` | Apps Script deployment URL (server-only) |
| `INTERNAL_WEBHOOK_SECRET` | `[32-char base64 random]` | Generate: `openssl rand -base64 32` |
| `ADMIN_ID` | `[your admin username]` | Admin panel login username |
| `ADMIN_PASS` | `[your admin password]` | Admin panel login password |
| `APP_URL` | `https://marketpeace.isira.club` | Production URL for Stripe redirects |

---

## Apps Script Script Properties (Set in Google Apps Script UI)

| Property | Value |
|----------|-------|
| `DISCORD_WEBHOOK_URL` | Discord webhook URL for notifications |
| `NVIDIA_NIM_API_KEY` | NVIDIA NIM API key for AI offers |
| `STRIPE_SECRET_KEY` | Same as Vercel (for Payment Links) |
| `INTERNAL_SECRET` | **Must match** Vercel's `INTERNAL_WEBHOOK_SECRET` |
| `VENUE_WEBHOOK_URL` | Webhook URL for venue sync |

---

## Step-by-Step Commands

### 1. Initialize New Repo & Push to GitHub

```bash
cd /Users/lakshitsinghvi/Documents/Repos/Marketpeace-FA-download

# Ensure clean state
git status

# Rename remote if needed, or add new one
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/isiraglobal/Marketpeace-FA.git

# Verify remote
git remote -v

# Push to GitHub (main branch)
git push -u origin main

# If repo doesn't exist yet, create it first via GitHub CLI:
# gh repo create isiraglobal/Marketpeace-FA --private --source=. --push
```

### 2. Connect to Vercel

**Option A: Vercel CLI (Recommended)**

```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login to Vercel
vercel login

# Link project (run from repo root)
vercel link

# Or create new project
vercel init marketpeace
```

**Option B: Vercel Dashboard**

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import `isiraglobal/Marketpeace-FA`
4. Framework Preset: **Vite**
5. Root Directory: `./` (default)
6. Build Command: `npm run build` (default)
7. Output Directory: `dist` (default)
8. Click "Deploy"

### 3. Add Environment Variables to Vercel

**Via CLI (bulk):**

```bash
# Set each variable (run for each)
vercel env add STRIPE_SECRET_KEY production
# Enter value when prompted

vercel env add STRIPE_WEBHOOK_SECRET production
# Enter value when prompted

vercel env add GOOGLE_SCRIPT_URL production
# Enter value when prompted

vercel env add INTERNAL_WEBHOOK_SECRET production
# Enter value when prompted

vercel env add ADMIN_ID production
# Enter value when prompted

vercel env add ADMIN_PASS production
# Enter value when prompted

vercel env add APP_URL production
# Enter value when prompted

# Repeat for preview/development if different values needed
```

**Via Dashboard:**
1. Go to Project Settings → Environment Variables
2. Add each variable for **Production**, **Preview**, and **Development**
3. Redeploy after adding: `vercel --prod`

### 4. Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://marketpeace.isira.club/api/stripe-webhook`
3. Select events: `checkout.session.completed`
4. Copy **Signing Secret** → Add as `STRIPE_WEBHOOK_SECRET` in Vercel

### 5. Deploy Google Apps Script

1. Open Google Apps Script: https://script.google.com
2. Open project linked to `SHEET_ID: 1O2cJqGK2qNAHA9mw2vC4szRtfLshfL0jjmrQicEok6I`
3. Replace `Code.gs` with `infrastructure/backend_apps_script.js`
4. Save → Project Settings → Script Properties → Add all 5 properties above
5. Deploy → New Deployment → Web App → Execute as: Me → Anyone
6. Copy URL → Set as `GOOGLE_SCRIPT_URL` in Vercel
7. Run `setupSheets` once
8. Run `setupTriggers` once

### 6. Verify Deployment

```bash
# Test public API
curl https://marketpeace.isira.club/api/cities

# Test admin login (should return 401 without auth)
curl -X POST https://marketpeace.isira.club/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"id":"test","password":"test"}'

# Test Stripe webhook endpoint (should return 400 without signature)
curl -X POST https://marketpeace.isira.club/api/stripe-webhook

# Check Vercel deployment
vercel ls
```

---

## Post-Deployment Checklist

- [ ] GitHub repo created at `https://github.com/isiraglobal/Marketpeace-FA`
- [ ] Vercel project linked and deploying from `main` branch
- [ ] All 7 environment variables set in Vercel (Production + Preview + Development)
- [ ] Stripe webhook configured and secret in Vercel
- [ ] Google Apps Script deployed with all 5 Script Properties
- [ ] `GOOGLE_SCRIPT_URL` in Vercel matches Apps Script deployment URL
- [ ] `INTERNAL_WEBHOOK_SECRET` matches in both Vercel and Apps Script
- [ ] `APP_URL` in Vercel matches production domain
- [ ] Admin panel accessible at `/admin` with credentials
- [ ] Public pages load: `/`, `/cities`, `/vendors`, `/attendees`, `/venues`
- [ ] Form submissions work (test vendor, attendee, venue, contact, city request)
- [ ] Stripe checkout works for paid tiers
- [ ] Discord notifications firing (if configured)

---

## Quick Reference: Key Files

```
/Users/lakshitsinghvi/Documents/Repos/Marketpeace-FA-download/
├── api/
│   ├── cities.js                 # Public cities API
│   ├── admin/cities.js           # Admin cities CRUD
│   ├── admin/login.js            # Admin auth
│   ├── admin/logout.js           # Admin logout
│   ├── admin/dashboard.js        # Admin dashboard
│   ├── admin/referrals.js        # Admin referrals
│   ├── submit.js                 # Form submissions (incl. CityRequest)
│   ├── stripe-checkout.js        # Stripe checkout sessions
│   ├── stripe-webhook.js         # Stripe webhook handler
│   ├── referrals.js              # Public referral API
│   └── venues.js                 # Public venues API
├── src/
│   ├── pages/
│   │   ├── Admin.jsx             # Admin panel (city editor)
│   │   ├── Cities.jsx            # Public cities + request form
│   │   └── ...other pages
│   ├── components/Footer.jsx     # Footer with ISIRA credit
│   └── utils/stripeCheckout.js   # Client Stripe utilities
├── infrastructure/
│   └── backend_apps_script.js    # Google Apps Script backend
├── .env.example                  # Environment template
└── package.json                  # Dependencies & scripts
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Vercel build fails | Check Node version (18+), run `npm install` locally first |
| Admin login fails | Verify `ADMIN_ID`, `ADMIN_PASS`, `INTERNAL_WEBHOOK_SECRET` match |
| Cities not loading | Check `GOOGLE_SCRIPT_URL` and `INTERNAL_WEBHOOK_SECRET` in both places |
| Stripe webhook 400 | Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard |
| Forms not submitting | Check `/api/submit` rate limits (5/15min), Apps Script auth |
| CORS errors | Ensure `GOOGLE_SCRIPT_URL` deployed as "Anyone" access |

---

## Support Contacts

- **Repo Owner:** isiraglobal
- **Deployment Email:** isiraglobal@gmail.com
- **Marketpeace Contact:** foreignaffairsllc2017@gmail.com
- **Discord:** Set via `DISCORD_WEBHOOK_URL` in Apps Script

---

*Generated for Marketpeace-FA deployment. Run each step in order. Do not skip verification steps.*