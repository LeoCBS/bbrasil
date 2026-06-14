drop table if exists public.categories;

alter table if exists public.products
  drop column if exists category;
