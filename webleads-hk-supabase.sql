-- WebLeads HK — Supabase SQL Editor
-- Creates the leads table with deduplication by google_place_id

create extension if not exists pgcrypto;

create table if not exists public.leads (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Business info
  google_place_id     text not null,
  business_name       text not null,
  business_type       text,
  district            text,
  full_address        text,
  phone               text,
  email               text,
  google_maps_url     text,
  google_rating       decimal(2,1),
  google_review_count integer,

  -- Social
  instagram_handle    text,
  facebook_url        text,

  -- Website status
  has_website         boolean not null default false,
  website_url         text,

  -- CRM tracking
  status              text not null default 'new',
  notes               text,
  contacted_at        timestamptz,
  closed_at           timestamptz,
  deal_value_hkd      integer not null default 2000,

  -- Source tracking
  source              text not null default 'google_maps',
  raw_data            jsonb,

  constraint leads_google_place_id_key unique (google_place_id),
  constraint leads_status_check check (
    status in ('new', 'contacted', 'responded', 'meeting', 'won', 'lost', 'not_interested')
  )
);

create index if not exists idx_leads_google_place_id on public.leads(google_place_id);
create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_district on public.leads(district);
create index if not exists idx_leads_business_type on public.leads(business_type);
create index if not exists idx_leads_has_website on public.leads(has_website);
create index if not exists idx_leads_created_at on public.leads(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_leads_updated_at on public.leads;
create trigger trg_leads_updated_at
before update on public.leads
for each row
execute function public.set_updated_at();

alter table public.leads enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'leads'
      and policyname = 'Authenticated users can do everything'
  ) then
    create policy "Authenticated users can do everything"
    on public.leads
    for all
    to authenticated
    using (true)
    with check (true);
  end if;
end $$;

-- Example insert pattern in app code:
-- supabase.from('leads').upsert(payload, { onConflict: 'google_place_id' })
