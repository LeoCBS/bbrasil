alter table public.products
  drop column if exists image_url,
  add column if not exists image_blob bytea,
  add column if not exists image_mime_type text;
