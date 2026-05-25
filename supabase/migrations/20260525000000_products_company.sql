alter table public.products
  add column if not exists company text not null default 'FLORIANOPOLIS SC';

create index if not exists products_company_idx on public.products (company);
