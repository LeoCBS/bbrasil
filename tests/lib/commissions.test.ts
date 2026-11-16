import { describe, expect, it } from 'vitest';
import { calculateCommission, calculatePriceDifferencePercent, selectCommissionRule, type CommissionRule } from '@/lib/commissions';

describe('calculateCommission', () => {
  it('gera zero quando preço de venda é igual ao preço de tabela', () => {
    expect(calculateCommission(100, 100, 1, 0)).toEqual({ baseAmount: 0, commissionAmount: 0 });
  });

  it('aplica o percentual à diferença total entre venda e tabela', () => {
    expect(calculateCommission(240, 100, 2, 50)).toEqual({ baseAmount: 40, commissionAmount: 20 });
  });

  it('preserva diferença negativa quando a venda fica abaixo da tabela', () => {
    expect(calculateCommission(90, 100, 1, 10)).toEqual({ baseAmount: -10, commissionAmount: -1 });
  });
});

describe('seleção de regra por categoria e faixa percentual', () => {
  const generic: CommissionRule = { id: 'generic', name: 'Geral', min_difference_percent: 0, max_difference_percent: 20, commission_percent: 10, category_id: null, active: true };
  const category: CommissionRule = { id: 'category', name: 'Categoria', min_difference_percent: 0, max_difference_percent: null, commission_percent: 5, category_id: 'cat-1', active: true };

  it('calcula o percentual da diferença em relação ao preço de tabela', () => {
    expect(calculatePriceDifferencePercent(110, 100)).toBe(10);
    expect(calculatePriceDifferencePercent(100, 0)).toBeNull();
  });

  it('prioriza regra da categoria sobre a faixa geral', () => {
    expect(selectCommissionRule([generic, category], 'cat-1', 10)?.id).toBe('category');
  });

  it('usa a faixa geral se não houver regra para a categoria', () => {
    expect(selectCommissionRule([generic, category], 'cat-2', 10)?.id).toBe('generic');
  });

  it('usa a regra sem máximo quando a diferença ultrapassa a faixa limitada', () => {
    const fallback: CommissionRule = { id: 'fallback', name: 'Acima das faixas', min_difference_percent: 0, max_difference_percent: null, commission_percent: 2, category_id: null, active: true };
    expect(selectCommissionRule([fallback, generic], 'cat-2', 10)?.id).toBe('generic');
    expect(selectCommissionRule([fallback, generic], 'cat-2', 25)?.id).toBe('fallback');
  });
});
