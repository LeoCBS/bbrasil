create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  corporate_name text not null,
  cnpj text not null,
  state_registration text not null default '',
  address text not null default '',
  neighborhood text not null default '',
  notes text not null default '',
  city text not null default '',
  state text not null default '',
  zip_code text not null default '',
  email text not null default '',
  phone text not null default '',
  salesperson text not null default '',
  unit text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint clients_cnpj_unique unique (cnpj)
);

create index if not exists clients_corporate_name_idx on public.clients (corporate_name);
create index if not exists clients_cnpj_idx on public.clients (cnpj);
