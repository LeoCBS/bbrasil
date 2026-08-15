create table if not exists public.units (
  id uuid primary key default gen_random_uuid(), name text not null unique, address text not null default '', phone text not null default '', whatsapp_number text not null default '', email text not null default '', active boolean not null default true, created_at timestamptz not null default now()
);

insert into public.units (name, address, phone, whatsapp_number, email) values
('FLORIANOPOLIS SC', 'Rua Sao Ludgero, 1580 - CEP 88117-270' || E'\n' || 'Barreiros - Sao Jose - SC', '(48) 3240 0074', '554832400074', 'comercial@bbrasilprodutosdelimpeza.com.br'),
('JOINVILLE SC', 'Rua Rocha Pombo, 252 - CEP 89222-060' || E'\n' || 'Iririu - Joinville - SC', '(47) 3026 6607', '554730266607', 'joinville@bbrasilprodutosdelimpeza.com.br'),
('ITAJAI SC', 'Rua Blumenau, 1520 - Bl. 05 - CEP 88305-104' || E'\n' || 'Barra do Rio - Itajai - SC', '(47) 3246 0868', '554730266607', 'itajai@bbrasilprodutosdelimpeza.com.br'),
('BLUMENAU SC', 'Rua Fritz Spernau, 912 - CEP 89052-015', '(47) 3338 5555', '554733385555', 'blumenau@bbrasilprodutosdelimpeza.com.br'),
('CRICIUMA SC', 'Rua Gonçalves Ledo, 92 sala 02 - Centro - Criciúma SC. Cep: 88802-120', '(48) 3413 5005', '554834135005', 'criciuma@bbrasilprodutosdelimpeza.com.br'),
('CURITIBA PR', 'Rua Des. Westphalen, 1642 A - CEP 80230-100', '(41) 3278 7008', '554132787008', 'curitiba@bbrasilprodutosdelimpeza.com.br'),
('SAO PAULO SP', 'Rua Cel. Mario de Azevedo, 153 - CEP 02710-020', '(11) 2679 5559', '551126795559', 'sp@bbrasilprodutosdelimpeza.com.br') on conflict (name) do nothing;

alter table public.products add column if not exists unit_id uuid references public.units(id) on delete restrict;
alter table public.clients add column if not exists unit_id uuid references public.units(id) on delete restrict;
alter table public.salespeople add column if not exists unit_id uuid references public.units(id) on delete restrict;
update public.products p set unit_id = u.id from public.units u where p.unit_id is null and p.company = u.name;
update public.clients c set unit_id = u.id from public.units u where c.unit_id is null and c.unit = u.name;
create index if not exists products_unit_id_idx on public.products(unit_id);
create index if not exists clients_unit_id_idx on public.clients(unit_id);
create index if not exists salespeople_unit_id_idx on public.salespeople(unit_id);

alter table public.products drop column if exists company;
