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
  ('ALTOLIM', 'Linha Altolim para rotinas profissionais de limpeza.', 'spray', 10),
  ('EQUIPAMENTOS E ACESSÓRIOS', 'Equipamentos e acessorios para limpeza profissional.', 'package', 20),
  ('DESCARTÁVEIS', 'Descartaveis para empresas, cozinhas e ambientes de alto fluxo.', 'trash', 30),
  ('HIGIENE PESSOAL', 'Itens para cuidado, assepsia e higiene pessoal.', 'shield', 40),
  ('COPA/COZINHA', 'Produtos para copa, cozinha e areas de preparo.', 'sparkles', 50),
  ('EPI', 'Equipamentos de protecao individual para operacoes seguras.', 'shield', 60),
  ('LIMPEZA E HIGIENE', 'Solucoes para limpeza, higienizacao e manutencao diaria.', 'spray', 70),
  ('DISPENSER', 'Dispensers e suportes para ambientes profissionais.', 'package', 80),
  ('GERENCIAMENTO DE RESÍDUOS', 'Produtos para descarte, coleta e gestao de residuos.', 'trash', 90),
  ('PANOS', 'Panos e acessorios texteis para limpeza profissional.', 'waves', 100)
on conflict (name) do update set
  description = excluded.description,
  icon = excluded.icon,
  sort_order = excluded.sort_order;
