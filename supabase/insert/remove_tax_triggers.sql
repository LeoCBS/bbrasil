-- Script para remover triggers e função de cálculo de impostos do banco de dados
-- Execute este script no SQL Editor do Supabase antes de aplicar a nova migration

-- Remover triggers (se existirem)
DROP TRIGGER IF EXISTS trigger_calculate_taxes_order_items_insert ON public.order_items;
DROP TRIGGER IF EXISTS trigger_calculate_taxes_order_items_update ON public.order_items;

-- Remover a função de cálculo (se existir)
DROP FUNCTION IF EXISTS public.calculate_item_taxes() CASCADE;

-- Verificar se foram removidos
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'order_items';

-- Verificar se a função foi removida
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'calculate_item_taxes';
