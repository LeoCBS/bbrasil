-- Substitui a categoria textual de products por uma chave estrangeira para categories.
-- Os nomes abaixo sao exatamente os da coluna CATEGORIA da planilha recebida.
insert into public.categories (name, description, icon, active, sort_order)
values
  ('COPA/COZINHA', 'Categoria COPA/COZINHA.', 'sparkles', true, 10),
  ('DESCARTÁVEIS', 'Categoria DESCARTÁVEIS.', 'trash', true, 20),
  ('DIVERSOS', 'Categoria DIVERSOS.', 'package', true, 30),
  ('EPI', 'Categoria EPI.', 'shield', true, 40),
  ('EQUIPAMENTOS, ACESSÓRIOS E DISPENSERS', 'Categoria EQUIPAMENTOS, ACESSÓRIOS E DISPENSERS.', 'package', true, 50),
  ('GERENCIMENTO DE RESÍDUOS', 'Categoria GERENCIMENTO DE RESÍDUOS.', 'trash', true, 60),
  ('HIGIENE PESSOAL', 'Categoria HIGIENE PESSOAL.', 'shield', true, 70),
  ('LIMPEZA E HIGIENE', 'Categoria LIMPEZA E HIGIENE.', 'spray', true, 80),
  ('PANOS', 'Categoria PANOS.', 'waves', true, 90),
  ('PERFUMARIA', 'Categoria PERFUMARIA.', 'sparkles', true, 100)
on conflict (name) do update set
  description = excluded.description,
  icon = excluded.icon,
  active = excluded.active,
  sort_order = excluded.sort_order;

alter table public.products add column if not exists category_id uuid;

-- Converte as categorias antigas para os nomes presentes na planilha.
update public.products product
set category_id = category.id
from public.categories category
where category.name = case product.category
  -- when 'ALTOLIM' then 'LIMPEZA E HIGIENE'
  when 'EQUIPAMENTOS E ACESSÓRIOS' then 'EQUIPAMENTOS, ACESSÓRIOS E DISPENSERS'
  when 'DISPENSER' then 'EQUIPAMENTOS, ACESSÓRIOS E DISPENSERS'
  when 'GERENCIAMENTO DE RESÍDUOS' then 'GERENCIMENTO DE RESÍDUOS'
  else product.category
end;

do $$
begin
  if exists (select 1 from public.products where category_id is null) then
    raise exception 'Existem produtos sem categoria correspondente. Corrija-os antes de executar esta migracao.';
  end if;
end $$;

alter table public.products alter column category_id set not null;
alter table public.products
  add constraint products_category_id_fkey
  foreign key (category_id) references public.categories(id) on update cascade on delete restrict;
create index if not exists products_category_id_idx on public.products (category_id);
alter table public.products drop column category;

-- As categorias antigas que nao constam na planilha deixam de existir apos a conversao.
--delete from public.categories
--where name not in (
--  'COPA/COZINHA', 'DESCARTÁVEIS', 'DIVERSOS', 'EPI',
--  'EQUIPAMENTOS, ACESSÓRIOS E DISPENSERS', 'GERENCIMENTO DE RESÍDUOS',
--  'HIGIENE PESSOAL', 'LIMPEZA E HIGIENE', 'PANOS', 'PERFUMARIA'
--);
