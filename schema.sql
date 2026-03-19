-- =============================================
--  DIGITAL CREATIVE SOLUTIONS — Supabase Schema
--  Run this in your Supabase SQL editor
-- =============================================

-- Enable UUID generation
create extension if not exists "pgcrypto";


-- ─── AGENTS ────────────────────────────────────────────────────────────────────
create table agents (
  id         text primary key,              -- e.g. 'jordan', 'sarah', 'marcus'
  name       text not null,
  email      text not null unique,
  code       text not null unique,          -- login code e.g. 'JD42'
  active     boolean default true,
  created_at timestamptz default now()
);

-- Seed initial agents
insert into agents (id, name, email, code) values
  ('jordan',  'Jordan Dlamini',   'jordan@digitalcreativesolutions.co.za',  'JD42'),
  ('sarah',   'Sarah Kruger',     'sarah@digitalcreativesolutions.co.za',   'SK77'),
  ('marcus',  'Marcus Petersen',  'marcus@digitalcreativesolutions.co.za',  'MP19');


-- ─── LEADS ─────────────────────────────────────────────────────────────────────
create table leads (
  id               uuid primary key default gen_random_uuid(),
  agent_id         text references agents(id) on delete set null,
  agent_name       text,                     -- denormalised for history
  status           text not null default 'pending'
                     check (status in ('pending','reviewed','quoted','declined','won','lost')),

  -- Client info
  client_company   text not null,
  contact_name     text not null,
  contact_email    text not null,
  contact_phone    text,
  industry         text,
  company_size     text,

  -- Scope
  problem_statement text,
  project_type      text,
  entities          text[],                  -- array of entity names
  features          text[],                  -- array of feature ids
  integrations      text[],
  custom_integration text,
  user_roles        text,
  monthly_users     text,
  data_volume       text,
  notes             text,

  -- AI Assessment
  complexity_tier        text,               -- Low / Medium / High / Needs Scoping
  estimated_hours_min    int,
  estimated_hours_max    int,
  key_drivers            text[],
  risk_flags             text[],
  scope_notes            text,
  needs_deeper_scoping   boolean default false,
  scoping_reason         text,

  submitted_at     timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_updated_at
  before update on leads
  for each row execute procedure set_updated_at();


-- ─── STATUS HISTORY ────────────────────────────────────────────────────────────
create table lead_status_history (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid references leads(id) on delete cascade,
  from_status text,
  to_status  text not null,
  changed_by text,                            -- agent_id or 'admin'
  note       text,
  changed_at timestamptz default now()
);


-- ─── ROW-LEVEL SECURITY ────────────────────────────────────────────────────────
-- Disable for now (using the service role key from the tool).
-- Re-enable and configure once you add proper auth.
alter table agents  disable row level security;
alter table leads   disable row level security;
alter table lead_status_history disable row level security;


-- ─── INDEXES ───────────────────────────────────────────────────────────────────
create index leads_agent_id_idx    on leads (agent_id);
create index leads_status_idx      on leads (status);
create index leads_submitted_at_idx on leads (submitted_at desc);


-- ─── USEFUL VIEWS ──────────────────────────────────────────────────────────────

-- Admin summary view
create view leads_summary as
select
  l.id,
  l.client_company,
  l.contact_name,
  l.contact_email,
  l.status,
  l.complexity_tier,
  l.estimated_hours_min,
  l.estimated_hours_max,
  l.industry,
  l.submitted_at,
  a.name as agent_name
from leads l
left join agents a on l.agent_id = a.id
order by l.submitted_at desc;

-- Pipeline stats
create view pipeline_stats as
select
  status,
  count(*) as count,
  avg(estimated_hours_min) as avg_hours_min,
  avg(estimated_hours_max) as avg_hours_max
from leads
group by status;
