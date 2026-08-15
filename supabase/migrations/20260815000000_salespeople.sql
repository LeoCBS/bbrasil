create table if not exists public.salespeople (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null default '',
  phone text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint salespeople_name_unique unique (name)
);

create index if not exists salespeople_name_idx on public.salespeople (name);
