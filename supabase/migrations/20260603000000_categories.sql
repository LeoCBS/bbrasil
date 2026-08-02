create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  icon text not null default 'package',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists categories_active_sort_order_idx on public.categories (active, sort_order, name);

alter table public.categories enable row level security;

drop policy if exists "Categorias ativas visiveis publicamente" on public.categories;

create policy "Categorias ativas visiveis publicamente"
on public.categories for select
using (active = true);

insert into public.categories (name, description, icon, sort_order)
values
  ('COPA/COZINHA', 'Categoria COPA/COZINHA.', 'sparkles', 10),
  ('DESCARTÁVEIS', 'Categoria DESCARTÁVEIS.', 'trash', 20),
  ('DIVERSOS', 'Categoria DIVERSOS.', 'package', 30),
  ('EPI', 'Categoria EPI.', 'shield', 40),
  ('EQUIPAMENTOS, ACESSÓRIOS E DISPENSERS', 'Categoria EQUIPAMENTOS, ACESSÓRIOS E DISPENSERS.', 'package', 50),
  ('GERENCIMENTO DE RESÍDUOS', 'Categoria GERENCIMENTO DE RESÍDUOS.', 'trash', 60),
  ('HIGIENE PESSOAL', 'Categoria HIGIENE PESSOAL.', 'shield', 70),
  ('LIMPEZA E HIGIENE', 'Categoria LIMPEZA E HIGIENE.', 'spray', 80),
  ('PANOS', 'Categoria PANOS.', 'waves', 90),
  ('PERFUMARIA', 'Categoria PERFUMARIA.', 'sparkles', 100)
on conflict (name) do update set
  description = excluded.description,
  icon = excluded.icon,
  sort_order = excluded.sort_order;
