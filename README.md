# B.Brasil Higiene Profissional

Projeto Next.js inspirado no prototipo fornecido, com Tailwind CSS, componentes no estilo shadcn/ui e painel admin para CRUD de produtos via Supabase.

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse:

- Site: `http://localhost:3000`
- Admin de produtos: `http://localhost:3000/admin/produtos`

## Supabase

Crie um arquivo `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-anon-key"
SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"
```

Crie a tabela:

```sql
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text not null,
  size text not null,
  price numeric(10, 2),
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Produtos ativos visiveis publicamente"
on public.products for select
using (active = true);
```

O admin usa `SUPABASE_SERVICE_ROLE_KEY` em server actions. Nao exponha essa chave no navegador.
