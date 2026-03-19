# Digital Creative Solutions — Site & Sales System

A complete, costless-to-deploy sales infrastructure for DCS.

```
dcs-site/
├── index.html                  # Company landing page  → yourname.github.io
├── ref/
│   ├── jordan/index.html       # Agent page            → yourname.github.io/ref/jordan/
│   ├── sarah/index.html        # Agent page            → yourname.github.io/ref/sarah/
│   ├── marcus/index.html       # Agent page            → yourname.github.io/ref/marcus/
│   └── _template.html          # Template for new agents
├── tool/
│   └── index.html              # Sales scoping tool    → deploy separately (Netlify)
├── supabase/
│   └── schema.sql              # Database schema
├── discord/
│   └── notify.js               # Discord webhook module
├── _config.yml                 # GitHub Pages config
└── README.md
```

---

## 1. Deploy the Company Site (GitHub Pages — Free)

1. Create a new GitHub repo: `yourusername/yourusername.github.io` (or any repo name)
2. Push this folder's contents to the repo's `main` branch
3. Go to repo **Settings → Pages → Source → Deploy from branch → main / (root)**
4. Site goes live at `https://yourusername.github.io` (or your custom domain)

### Custom Domain (optional, free)
1. Buy a domain (Namecheap ~R100/yr) e.g. `digitalcreativesolutions.co.za`
2. In GitHub Pages settings, add your custom domain
3. Add a CNAME DNS record: `www → yourusername.github.io`
4. GitHub issues the SSL cert automatically

---

## 2. Deploy the Sales Tool (Netlify — Free)

The sales tool (`tool/index.html`) needs to be deployed separately so agents
can access it without it being publicly linked from the main site.

1. Go to [netlify.com](https://netlify.com) → New site → Deploy manually
2. Drag the `tool/` folder into the deploy dropzone
3. It gets a URL like `https://random-name.netlify.app`
4. Optionally rename to `https://tool.digitalcreativesolutions.co.za` in Netlify settings

**Agent logins (update in tool/index.html):**
| Agent        | Code  |
|-------------|-------|
| Jordan      | JD42  |
| Sarah       | SK77  |
| Marcus      | MP19  |
| Admin       | ADMIN99 |

---

## 3. Set Up Supabase (Free tier — when ready)

Supabase free tier gives you: PostgreSQL database, auth, realtime, and 500MB storage.

1. Create account at [supabase.com](https://supabase.com)
2. New project → name it `dcs-quotr`
3. Go to **SQL Editor** → paste and run `supabase/schema.sql`
4. Go to **Settings → API** → copy your `Project URL` and `anon public` key
5. In `tool/index.html`, find `// SUPABASE INTEGRATION` and replace:
   ```js
   const SUPABASE_URL = 'https://your-project.supabase.co'
   const SUPABASE_KEY = 'your-anon-key'
   ```
6. Replace `window.storage` calls with Supabase client calls (see migration guide below)

### Supabase migration — replace storage calls

```js
// OLD (artifact storage)
await window.storage.set("quotr_leads", JSON.stringify(state.leads));

// NEW (Supabase)
const { error } = await supabase.from('leads').insert([formatLead(lead)]);
```

---

## 4. Set Up Discord Webhook (Free — no bot hosting needed)

1. In your Discord server: **Server Settings → Integrations → Webhooks → New Webhook**
2. Choose your `#leads` channel, name it `DCS Quotr`, copy the webhook URL
3. In `tool/index.html`, find the submit function and add:
   ```js
   await notifyDiscord(lead, 'YOUR_WEBHOOK_URL_HERE');
   ```
4. Done. Every submitted lead posts a formatted embed to your channel.

For status changes, call `notifyStatusChange()` from the admin dashboard's status update handler.

---

## 5. Set Up Cal.com Booking (Free)

Each agent needs their own Cal.com account for the booking widget.

1. Go to [cal.com](https://cal.com) → Sign up (free)
2. Create a **30-minute** event type: "DCS Scoping Session"
3. Connect your Google Calendar or Outlook
4. In the agent's page (`ref/jordan/index.html`), replace the placeholder div:
   ```html
   <!-- Replace the .cal-embed placeholder with: -->
   <div style="width:100%;height:600px;overflow:scroll">
     <iframe
       src="https://cal.com/jordan-dcs/scoping"
       style="width:100%;height:100%;border:none"
       title="Book a session with Jordan"
     ></iframe>
   </div>
   ```

---

## 6. Adding a New Agent

1. Copy `ref/_template.html` to `ref/[agentname]/index.html`
2. Replace all `{{PLACEHOLDER}}` values
3. Add their code to the `AGENTS` array in `tool/index.html`:
   ```js
   { id: "newagent", name: "New Agent", code: "NA99" }
   ```
4. Add their card to `index.html` in the `#team` section
5. Push to GitHub — live in seconds

---

## Cost Summary

| Service         | Plan  | Cost     |
|----------------|-------|----------|
| GitHub Pages   | Free  | R0/mo    |
| Netlify        | Free  | R0/mo    |
| Supabase       | Free  | R0/mo    |
| Discord        | Free  | R0/mo    |
| Cal.com        | Free  | R0/mo    |
| Domain (optional) | —  | ~R100/yr |

**Total: R0/month until your first paid project.**

---

## When You Land Your First Gig

Move to paid hosting in this order:
1. **Supabase Pro** (~$25/mo) — more DB, backups, no pausing
2. **Vercel Pro** (~$20/mo) — for the tool (better performance, custom domain)
3. **Custom email** (Google Workspace ~$6/user/mo)

Everything is built to migrate cleanly. No lock-in.
