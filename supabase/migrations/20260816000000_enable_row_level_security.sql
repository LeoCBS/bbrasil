-- Habilita row level security nas tabelas que ficaram sem protecao.
-- Sem RLS, qualquer pessoa com a NEXT_PUBLIC_SUPABASE_ANON_KEY (exposta no navegador)
-- consegue ler e escrever nessas tabelas pela API REST do Supabase.
-- O admin do site usa a SUPABASE_SERVICE_ROLE_KEY no servidor, que ignora RLS.

alter table public.products enable row level security;
alter table public.units enable row level security;
alter table public.clients enable row level security;
alter table public.salespeople enable row level security;

-- Catalogo publico: apenas registros ativos podem ser lidos com a anon key.
drop policy if exists "Produtos ativos visiveis publicamente" on public.products;

create policy "Produtos ativos visiveis publicamente"
on public.products for select
using (active = true);

drop policy if exists "Unidades ativas visiveis publicamente" on public.units;

create policy "Unidades ativas visiveis publicamente"
on public.units for select
using (active = true);

-- Dados de clientes e vendedores sao restritos ao admin (service role).
-- Nenhuma policy e criada para clients/salespeople, portanto anon e authenticated
-- nao tem acesso algum. Os grants abaixo reforcam esse bloqueio.
revoke all on public.clients from anon, authenticated;
revoke all on public.salespeople from anon, authenticated;
revoke insert, update, delete on public.products from anon, authenticated;
revoke insert, update, delete on public.categories from anon, authenticated;
revoke insert, update, delete on public.units from anon, authenticated;
