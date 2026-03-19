/**
 * DCS Discord Webhook Notifier
 * ─────────────────────────────
 * Drop this file anywhere in your project.
 * Call notifyDiscord(lead) whenever a lead is submitted.
 *
 * SETUP:
 * 1. In Discord: Server Settings → Integrations → Webhooks → New Webhook
 * 2. Pick your #leads channel, copy the webhook URL
 * 3. Set DISCORD_WEBHOOK_URL below (or use an env variable)
 */

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "PASTE_YOUR_WEBHOOK_URL_HERE";

/**
 * Send a lead notification to Discord.
 * @param {Object} lead  — the full lead object from the sales tool
 */
async function notifyDiscord(lead) {
  const a = lead.assessment;
  const tierColour = { Low: 0x79cc14, Medium: 0xffcc00, High: 0xff8800, "Needs Scoping": 0xff4466 };
  const colour = tierColour[a?.complexityTier] ?? 0x888888;

  const fields = [
    { name: "Company",       value: lead.form.clientCompany || "—",   inline: true },
    { name: "Contact",       value: lead.form.contactName   || "—",   inline: true },
    { name: "Email",         value: lead.form.contactEmail  || "—",   inline: true },
    { name: "Industry",      value: lead.form.industry      || "—",   inline: true },
    { name: "Company Size",  value: lead.form.companySize   || "—",   inline: true },
    { name: "Project Type",  value: lead.form.projectType   || "—",   inline: true },
  ];

  if (a) {
    fields.push({
      name: "Complexity",
      value: a.complexityTier || "—",
      inline: true
    });
    if (!a.needsDeeperScoping && a.estimatedHoursMin > 0) {
      fields.push({
        name: "Est. Hours",
        value: `${a.estimatedHoursMin}–${a.estimatedHoursMax}h`,
        inline: true
      });
    }
    if (a.scopeNotes) {
      fields.push({ name: "Assessment Summary", value: a.scopeNotes, inline: false });
    }
    if (a.riskFlags?.length) {
      fields.push({
        name: "⚠ Risk Flags",
        value: a.riskFlags.map(r => `• ${r}`).join("\n"),
        inline: false
      });
    }
  }

  if (lead.form.notes) {
    fields.push({ name: "Agent Notes", value: lead.form.notes, inline: false });
  }

  const payload = {
    username: "DCS Quotr",
    avatar_url: "https://cdn.discordapp.com/embed/avatars/0.png",
    embeds: [
      {
        title: `📥 New Lead — ${lead.form.clientCompany}`,
        description: lead.form.problemStatement
          ? `> ${lead.form.problemStatement.slice(0, 280)}${lead.form.problemStatement.length > 280 ? "…" : ""}`
          : "No problem statement captured.",
        color: colour,
        fields,
        footer: {
          text: `Submitted by ${lead.agentName} · ${new Date(lead.submittedAt).toLocaleString("en-ZA")}`,
        },
        timestamp: lead.submittedAt,
      }
    ]
  };

  const res = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    console.error("Discord webhook failed:", res.status, await res.text());
  }
}


/**
 * Send a status-change notification to Discord.
 * @param {Object} lead      — the updated lead object
 * @param {string} fromStatus
 * @param {string} toStatus
 * @param {string} changedBy  — agent name or "Admin"
 */
async function notifyStatusChange(lead, fromStatus, toStatus, changedBy = "Admin") {
  const statusEmoji = {
    pending: "🕐", reviewed: "👀", quoted: "💰", declined: "❌", won: "🏆", lost: "🪦"
  };
  const emoji = statusEmoji[toStatus] ?? "🔄";

  const payload = {
    username: "DCS Quotr",
    embeds: [
      {
        title: `${emoji} Status Update — ${lead.form.clientCompany}`,
        description: `**${fromStatus}** → **${toStatus}**`,
        color: toStatus === "won" ? 0x79cc14 : toStatus === "declined" || toStatus === "lost" ? 0xff4466 : 0x1c6eff,
        fields: [
          { name: "Changed by", value: changedBy, inline: true },
          { name: "Agent", value: lead.agentName || "—", inline: true },
        ],
        timestamp: new Date().toISOString(),
      }
    ]
  };

  await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}


// ─── Integration with the sales tool ─────────────────────────────────────────
// In tool/index.html, replace the submitLead() function's saveLeads() call with:
//
//   await saveLeads();
//   await fetch('/api/notify', { method: 'POST', body: JSON.stringify(lead) });
//
// Or if deploying the tool as a pure static site (GitHub Pages), call the
// Discord webhook directly from the browser using your webhook URL:
//
//   async function submitLead() {
//     const lead = { ...formData };
//     state.leads = [lead, ...state.leads];
//     await saveLeads();
//     await notifyDiscord(lead);   // <-- add this line
//     state.submitted = true;
//     render();
//   }
//
// IMPORTANT: For production, proxy through a Supabase Edge Function or
// Vercel serverless function to avoid exposing your webhook URL in the browser.


// ─── Supabase Edge Function wrapper (optional) ───────────────────────────────
// Create file: supabase/functions/notify-discord/index.ts
//
// import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
//
// serve(async (req) => {
//   const lead = await req.json()
//   await notifyDiscord(lead)
//   return new Response(JSON.stringify({ ok: true }), {
//     headers: { "Content-Type": "application/json" }
//   })
// })

module.exports = { notifyDiscord, notifyStatusChange };
