# B.Brasil Higiene Profissional

Projeto Next.js inspirado no prototipo fornecido, com Tailwind CSS, componentes no estilo shadcn/ui e painel admin para CRUD de produtos e categorias via Supabase.

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse:

- Site: `http://localhost:3000`
- Login do admin: `http://localhost:3000/admin/login`
- Admin do catalogo: `http://localhost:3000/admin/produtos`

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
  category_id uuid not null,
  description text not null,
  size text not null,
  price numeric(10, 2),
  image_blob bytea,
  image_mime_type text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  icon text not null default 'package',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.products
  add constraint products_category_id_fkey
  foreign key (category_id) references public.categories(id);

alter table public.products enable row level security;
alter table public.categories enable row level security;

create policy "Produtos ativos visiveis publicamente"
on public.products for select
using (active = true);

create policy "Categorias ativas visiveis publicamente"
on public.categories for select
using (active = true);
```

O admin usa `SUPABASE_SERVICE_ROLE_KEY` em server actions. Nao exponha essa chave no navegador.

As categorias usam o campo `icon` com estes valores aceitos pelo site: `package`, `spray`, `shield`, `sparkles`, `trash` e `waves`.

Para acessar o admin, crie um usuario em **Supabase Auth > Users** com e-mail e senha. O login usa Supabase Auth nativo, sem providers externos.

Se voce ja criou a tabela com `image_url`, rode esta migracao:

```sql
alter table public.products
  drop column if exists image_url,
  add column if not exists image_blob bytea,
  add column if not exists image_mime_type text;
```
