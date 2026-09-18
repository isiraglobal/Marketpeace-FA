# Marketpeace GitHub-to-GitHub Fork & Vercel Deployment Prompt

## Source Repository
- **URL:** `https://github.com/isiraglobal/Marketpeace-FA`
- **Branch:** `main`

## Target Repository
- **Name:** `marketpeace`
- **Owner:** Your GitHub account (replace `YOUR_GITHUB_USERNAME` below)
- **Visibility:** Private (recommended)

---

## Phase 1: Fork & Create New Repo (GitHub API / gh CLI)

```bash
# Option A: GitHub CLI (recommended)
gh repo create YOUR_GITHUB_USERNAME/marketpeace --private --clone=false

# Option B: GitHub REST API
curl -X POST https://api.github.com/user/repos \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -d '{"name":"marketpeace","private":true,"description":"Marketpeace - Local Marketplace Platform"}'
```

---

## Phase 2: Copy Contents from Source to Target (GitHub Importer / Mirror Push)

```bash
# Clone source as bare mirror, push to target
git clone --bare https://github.com/isiraglobal/Marketpeace-FA.git
cd Marketpeace-FA.git
git push --mirror https://github.com/YOUR_GITHUB_USERNAME/marketpeace.git
cd ..
rm -rf Marketpeace-FA.git
```

**Or via GitHub Importer (UI):**
1. Go to https://github.com/new/import
2. Source: `https://github.com/isiraglobal/Marketpeace-FA`
3. Owner: `YOUR_GITHUB_USERNAME`
4. Name: `marketpeace`
5. Click "Begin import"

---

## Phase 3: Add Environment Variables to Target Repo (GitHub Actions Secrets)

Go to: `https://github.com/YOUR_GITHUB_USERNAME/marketpeace/settings/secrets/actions`

Add these as **Repository Secrets** (not Environment secrets):

| Secret Name | Value | Source |
|-------------|-------|--------|
| `STRIPE_SECRET_KEY` | `sk_live_...` or `sk_test_...` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe Dashboard → Webhooks → Signing Secret |
| `GOOGLE_SCRIPT_URL` | `https://script.google.com/macros/s/.../exec` | Apps Script Deployment URL |
| `INTERNAL_WEBHOOK_SECRET` | `[32-char base64]` | Generate: `openssl rand -base64 32` |
| `ADMIN_ID` | `[admin username]` | Your choice |
| `ADMIN_PASS` | `[admin password]` | Your choice (strong) |
| `APP_URL` | `https://YOUR_VERCEL_DOMAIN.vercel.app` | Vercel project URL (update after deploy) |

---

## Phase 4: Deploy to Vercel (via GitHub Integration)

### Option A: Vercel GitHub App (Automatic)

1. Install Vercel GitHub App: https://github.com/apps/vercel
2. Grant access to `YOUR_GITHUB_USERNAME/marketpeace`
3. Go to Vercel Dashboard → "Add New Project"
4. Import `YOUR_GITHUB_USERNAME/marketpeace`
5. Framework: **Vite** (auto-detected)
6. Root Directory: `./`
7. Click "Deploy"

### Option B: Vercel CLI with GitHub Token

```bash
# Requires Vercel CLI and GitHub token
vercel login
vercel link YOUR_GITHUB_USERNAME/marketpeace --scope=YOUR_VERCEL_TEAM
vercel env pull .env.local  # Pull existing env vars (if any)
```

---

## Phase 5: Sync GitHub Secrets → Vercel Environment Variables

**Automated via GitHub Action (recommended):**

Create `.github/workflows/sync-env-to-vercel.yml` in the target repo:

```yaml
name: Sync Secrets to Vercel
on:
  workflow_dispatch:
  push:
    branches: [main]
    paths:
      - '.github/workflows/sync-env-to-vercel.yml'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Vercel CLI
        run: npm i -g vercel@latest
      
      - name: Pull Vercel Project
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Sync Secrets
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
        run: |
          vercel env add STRIPE_SECRET_KEY production <<< "${{ secrets.STRIPE_SECRET_KEY }}"
          vercel env add STRIPE_WEBHOOK_SECRET production <<< "${{ secrets.STRIPE_WEBHOOK_SECRET }}"
          vercel env add GOOGLE_SCRIPT_URL production <<< "${{ secrets.GOOGLE_SCRIPT_URL }}"
          vercel env add INTERNAL_WEBHOOK_SECRET production <<< "${{ secrets.INTERNAL_WEBHOOK_SECRET }}"
          vercel env add ADMIN_ID production <<< "${{ secrets.ADMIN_ID }}"
          vercel env add ADMIN_PASS production <<< "${{ secrets.ADMIN_PASS }}"
          vercel env add APP_URL production <<< "${{ secrets.APP_URL }}"
          
          # Also add to preview/development
          for env in preview development; do
            vercel env add STRIPE_SECRET_KEY $env <<< "${{ secrets.STRIPE_SECRET_KEY }}"
            vercel env add STRIPE_WEBHOOK_SECRET $env <<< "${{ secrets.STRIPE_WEBHOOK_SECRET }}"
            vercel env add GOOGLE_SCRIPT_URL $env <<< "${{ secrets.GOOGLE_SCRIPT_URL }}"
            vercel env add INTERNAL_WEBHOOK_SECRET $env <<< "${{ secrets.INTERNAL_WEBHOOK_SECRET }}"
            vercel env add ADMIN_ID $env <<< "${{ secrets.ADMIN_ID }}"
            vercel env add ADMIN_PASS $env <<< "${{ secrets.ADMIN_PASS }}"
            vercel env add APP_URL $env <<< "${{ secrets.APP_URL }}"
          done
          
      - name: Redeploy
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

**Add these additional secrets to GitHub Actions:**
- `VERCEL_TOKEN` — from Vercel Account Settings → Tokens
- `VERCEL_ORG_ID` — from `.vercel/project.json` after first `vercel link`
- `VERCEL_PROJECT_ID` — from `.vercel/project.json`

---

## Phase 6: Configure Stripe Webhook

1. After first Vercel deploy, note the production URL: `https://marketpeace-xxx.vercel.app`
2. Update `APP_URL` secret in GitHub to match
3. Go to Stripe Dashboard → Developers → Webhooks
4. Add endpoint: `https://YOUR_VERCEL_DOMAIN.vercel.app/api/stripe-webhook`
5. Events: `checkout.session.completed`
6. Copy Signing Secret → Update `STRIPE_WEBHOOK_SECRET` in GitHub Secrets
6. Trigger workflow re-run to sync to Vercel

---

## Phase 7: Deploy Google Apps Script

1. Open https://script.google.com
2. Create new project or use existing
3. Replace `Code.gs` with contents of `infrastructure/backend_apps_script.js` from repo
4. Project Settings → Script Properties → Add:

| Property | Value |
|----------|-------|
| `DISCORD_WEBHOOK_URL` | Your Discord webhook |
| `NVIDIA_NIM_API_KEY` | Your NVIDIA NIM key |
| `STRIPE_SECRET_KEY` | Same as Vercel secret |
| `INTERNAL_SECRET` | **Must equal** `INTERNAL_WEBHOOK_SECRET` from GitHub Secrets |
| `VENUE_WEBHOOK_URL` | Your venue sync webhook |

5. Deploy → New Deployment → Web App:
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy Deployment URL → Update `GOOGLE_SCRIPT_URL` in GitHub Secrets
7. Run `setupSheets` function once
8. Run `setupTriggers` function once
9. Trigger GitHub Actions workflow to sync updated `GOOGLE_SCRIPT_URL` to Vercel

---

## Phase 8: Verify Everything Works

```bash
# Test public API
curl https://YOUR_VERCEL_DOMAIN.vercel.app/api/cities

# Test admin login (expect 401 without credentials)
curl -X POST https://YOUR_VERCEL_DOMAIN.vercel.app/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"id":"test","password":"test"}'

# Test Stripe webhook endpoint (expect 400 without signature)
curl -X POST https://YOUR_VERCEL_DOMAIN.vercel.app/api/stripe-webhook

# Test form submission (CityRequest)
curl -X POST https://YOUR_VERCEL_DOMAIN.vercel.app/api/submit \
  -H "Content-Type: application/json" \
  -d '{"type":"CityRequest","name":"Test","email":"test@test.com","phone":"1234567890","city":"TestCity","state":"TS","country":"Test"}'
```

---

## Complete Secrets Checklist (GitHub Repository Settings)

```
✅ STRIPE_SECRET_KEY
✅ STRIPE_WEBHOOK_SECRET  
✅ GOOGLE_SCRIPT_URL
✅ INTERNAL_WEBHOOK_SECRET
✅ ADMIN_ID
✅ ADMIN_PASS
✅ APP_URL
✅ VERCEL_TOKEN
✅ VERCEL_ORG_ID
✅ VERCEL_PROJECT_ID
```

---

## Apps Script Script Properties Checklist

```
✅ DISCORD_WEBHOOK_URL
✅ NVIDIA_NIM_API_KEY
✅ STRIPE_SECRET_KEY
✅ INTERNAL_SECRET (matches INTERNAL_WEBHOOK_SECRET exactly)
✅ VENUE_WEBHOOK_URL
```

---

## Critical Matching Requirements

| Pair | Must Match Exactly |
|------|-------------------|
| Vercel `INTERNAL_WEBHOOK_SECRET` ↔ Apps Script `INTERNAL_SECRET` | Yes (character-for-character) |
| Vercel `GOOGLE_SCRIPT_URL` ↔ Apps Script Deployment URL | Yes |
| Vercel `APP_URL` ↔ Stripe Webhook Domain | Yes |
| Vercel `STRIPE_WEBHOOK_SECRET` ↔ Stripe Dashboard Signing Secret | Yes |

---

## One-Command Summary (after manual setup)

```bash
# After creating repo and adding all GitHub Secrets:
gh workflow run sync-env-to-vercel.yml -R YOUR_GITHUB_USERNAME/marketpeace
```

---

## Support

- **Source Repo Issues:** https://github.com/isiraglobal/Marketpeace-FA/issues
- **Deployment Email:** isiraglobal@gmail.com
- **Marketpeace Business:** foreignaffairsllc2017@gmail.com

---

*No local machine required. All operations via GitHub API, Vercel GitHub App, and Google Apps Script UI.*