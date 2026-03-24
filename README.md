# ROAS Intelligence Dashboard

Meta Ads + Cashfree live dashboard with AI analyst chat.

## Deploy to Vercel (5 minutes)

### Step 1 — Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2 — Deploy
```bash
cd roas-dashboard
vercel
```
- When asked **"Set up and deploy?"** → press Enter (Yes)
- When asked **"Which scope?"** → choose your account
- When asked **"Link to existing project?"** → N
- When asked **"Project name?"** → `roas-dashboard` (or anything you like)
- When asked **"In which directory is your code?"** → `.` (just press Enter)
- All other questions → press Enter (accept defaults)

### Step 3 — Set environment variables
After deploy, run these one by one:

```bash
vercel env add META_TOKEN
# Paste your Meta access token

vercel env add META_ACCOUNT
# Paste your Meta ad account ID (numbers only, without "act_")

vercel env add CF_APP_ID
# Paste your Cashfree App ID

vercel env add CF_SECRET
# Paste your Cashfree Secret Key
```
When asked which environments → select all three (Production, Preview, Development) by pressing Space, then Enter.

### Step 4 — Redeploy with env vars
```bash
vercel --prod
```

Your dashboard will be live at `https://roas-dashboard-xxxx.vercel.app` 🎉

---

## Project structure
```
roas-dashboard/
├── api/
│   ├── meta.js        ← Meta Ads proxy (serverless function)
│   └── cashfree.js    ← Cashfree proxy (serverless function)
├── public/
│   └── index.html     ← Dashboard frontend
├── vercel.json        ← Routing config
├── package.json
└── README.md
```

## How it works
- `/api/meta` — runs server-side, calls Meta Graph API, returns campaign insights
- `/api/cashfree` — runs server-side, calls Cashfree PG API, returns revenue + order data
- `public/index.html` — frontend calls `/api/meta` and `/api/cashfree` (same origin, no CORS)
- AI chat calls Anthropic API directly from the browser with your live data as context
