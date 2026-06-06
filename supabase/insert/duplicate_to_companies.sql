-- Duplicar todos os produtos de FLORIANOPOLIS SC para as outras empresas

-- JOINVILLE SC
INSERT INTO public.products (name, category, description, size, price, active, image_url, company)
SELECT name, category, description, size, price, active, image_url, 'JOINVILLE SC'
FROM public.products
WHERE company = 'FLORIANOPOLIS SC';

-- ITAJAI SC
INSERT INTO public.products (name, category, description, size, price, active, image_url, company)
SELECT name, category, description, size, price, active, image_url, 'ITAJAI SC'
FROM public.products
WHERE company = 'FLORIANOPOLIS SC';

-- BLUMENAU SC
INSERT INTO public.products (name, category, description, size, price, active, image_url, company)
SELECT name, category, description, size, price, active, image_url, 'BLUMENAU SC'
FROM public.products
WHERE company = 'FLORIANOPOLIS SC';

-- CRICIUMA SC
INSERT INTO public.products (name, category, description, size, price, active, image_url, company)
SELECT name, category, description, size, price, active, image_url, 'CRICIUMA SC'
FROM public.products
WHERE company = 'FLORIANOPOLIS SC';

-- CURITIBA PR
INSERT INTO public.products (name, category, description, size, price, active, image_url, company)
SELECT name, category, description, size, price, active, image_url, 'CURITIBA PR'
FROM public.products
WHERE company = 'FLORIANOPOLIS SC';

-- SAO PAULO SP
INSERT INTO public.products (name, category, description, size, price, active, image_url, company)
SELECT name, category, description, size, price, active, image_url, 'SAO PAULO SP'
FROM public.products
WHERE company = 'FLORIANOPOLIS SC';
