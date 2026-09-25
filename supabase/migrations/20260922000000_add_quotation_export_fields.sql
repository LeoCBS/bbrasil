-- Adicionar campo NCM à tabela de produtos
alter table public.products
  add column if not exists ncm text default '';

-- Adicionar campos extras à tabela de clientes
alter table public.clients
  add column if not exists plan text default '',
  add column if not exists contact_person text default '',
  add column if not exists contact_phone text default '';

-- Adicionar campos extras à tabela de orçamentos
alter table public.quotations
  add column if not exists consultant text default '',
  add column if not exists payment_condition text default '',
  add column if not exists delivery_period text default '',
  add column if not exists additional_info text default '';

-- Adicionar campo NCM aos itens de orçamento
alter table public.quotation_items
  add column if not exists ncm text default '';

-- Adicionar campo NCM aos itens de pedido
alter table public.order_items
  add column if not exists ncm text default '';

-- Criar índices para os novos campos
create index if not exists products_ncm_idx on public.products(ncm);
create index if not exists clients_plan_idx on public.clients(plan);
create index if not exists quotations_consultant_idx on public.quotations(consultant);