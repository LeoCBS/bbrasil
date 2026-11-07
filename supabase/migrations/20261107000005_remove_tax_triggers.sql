-- Remover triggers e função de cálculo de impostos do banco de dados
-- Isso é necessário porque movemos a lógica para o backend TypeScript

-- Remover triggers (se existirem)
DROP TRIGGER IF EXISTS trigger_calculate_taxes_order_items_insert ON public.order_items;
DROP TRIGGER IF EXISTS trigger_calculate_taxes_order_items_update ON public.order_items;

-- Remover a função de cálculo (se existir)
DROP FUNCTION IF EXISTS public.calculate_item_taxes() CASCADE;

-- Nota: Os campos (tax_rule_id, v_pis, v_cofins, v_tot_trib) são mantidos
-- pois o cálculo agora é feito no backend TypeScript
