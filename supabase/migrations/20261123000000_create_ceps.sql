-- Tabela local de CEPs para autocomplete de endereço no cadastro de clientes.
-- A consulta tenta o banco primeiro; se o CEP não existir, busca na API do
-- ViaCEP e grava o resultado aqui (carga progressiva).
-- Uma carga inicial em massa pode ser feita por scripts/generate-ceps-import.mjs.

create table if not exists public.ceps (
  cep text primary key,
  logradouro text not null default '',
  complemento text not null default '',
  bairro text not null default '',
  cidade text not null default '',
  uf text not null default '',
  ibge text not null default '',
  ddd text not null default ''
);

create index if not exists ceps_cidade_idx on public.ceps (cidade);
create index if not exists ceps_uf_idx on public.ceps (uf);

-- Dados de CEP não são sensíveis, mas a escrita fica restrita ao service role.
alter table public.ceps enable row level security;

create policy "CEPs visiveis publicamente" on public.ceps for select using (true);

revoke insert, update, delete on public.ceps from anon, authenticated;
