-- Exibe timestamptz no fuso de Sao Paulo no painel do Supabase.
-- timestamptz e sempre armazenado em UTC; isso altera apenas a sessao de exibicao.
-- Nivel de banco (novas conexoes):
ALTER DATABASE postgres SET timezone TO 'America/Sao_Paulo';

-- Nivel de role (o SQL Editor e o Table Editor conectam como postgres):
ALTER ROLE postgres IN DATABASE postgres SET timezone TO 'America/Sao_Paulo';
