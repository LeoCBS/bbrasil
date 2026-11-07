import { describe, it, expect } from 'vitest';
import { calculateItemTaxes } from '@/lib/tax-rules';
import type { TaxRule } from '@/lib/tax-rules';

describe('calculateItemTaxes', () => {
  it('deve retornar zeros quando não há regra fiscal', () => {
    const result = calculateItemTaxes(null, 100);
    
    expect(result.v_pis).toBe(0);
    expect(result.v_cofins).toBe(0);
    expect(result.v_tot_trib).toBe(0);
  });

  it('deve calcular PIS corretamente', () => {
    const taxRule: TaxRule = {
      id: '1',
      name: 'Teste',
      active: true,
      pis_p: 0.65, // 0.65%
      cofins_p: 0,
      icms_csosn: 101,
      icms_orig: 0
    };
    
    const result = calculateItemTaxes(taxRule, 1000);
    
    // 1000 * 0.65 / 100 = 6.5
    expect(result.v_pis).toBe(6.5);
    expect(result.v_cofins).toBe(0);
    expect(result.v_tot_trib).toBe(6.5);
  });

  it('deve calcular COFINS corretamente', () => {
    const taxRule: TaxRule = {
      id: '1',
      name: 'Teste',
      active: true,
      pis_p: 0,
      cofins_p: 3.00, // 3%
      icms_csosn: 101,
      icms_orig: 0
    };
    
    const result = calculateItemTaxes(taxRule, 1000);
    
    // 1000 * 3.00 / 100 = 30
    expect(result.v_pis).toBe(0);
    expect(result.v_cofins).toBe(30);
    expect(result.v_tot_trib).toBe(30);
  });

  it('deve calcular ambos PIS e COFINS corretamente', () => {
    const taxRule: TaxRule = {
      id: '1',
      name: 'Teste',
      active: true,
      pis_p: 0.65, // 0.65%
      cofins_p: 3.00, // 3%
      icms_csosn: 101,
      icms_orig: 0
    };
    
    const result = calculateItemTaxes(taxRule, 1000);
    
    // PIS: 1000 * 0.65 / 100 = 6.5
    // COFINS: 1000 * 3.00 / 100 = 30
    // Total: 6.5 + 30 = 36.5
    expect(result.v_pis).toBe(6.5);
    expect(result.v_cofins).toBe(30);
    expect(result.v_tot_trib).toBe(36.5);
  });

  it('deve arredondar para 2 casas decimais', () => {
    const taxRule: TaxRule = {
      id: '1',
      name: 'Teste',
      active: true,
      pis_p: 0.65,
      cofins_p: 3.00,
      icms_csosn: 101,
      icms_orig: 0
    };
    
    const result = calculateItemTaxes(taxRule, 99.99);
    
    // PIS: 99.99 * 0.65 / 100 = 0.649935 → 0.65
    // COFINS: 99.99 * 3.00 / 100 = 2.9997 → 3.00
    expect(result.v_pis).toBe(0.65);
    expect(result.v_cofins).toBe(3.00);
    expect(result.v_tot_trib).toBe(3.65);
  });

  it('deve lidar com alíquotas nulas', () => {
    const taxRule: TaxRule = {
      id: '1',
      name: 'Teste',
      active: true,
      pis_p: null,
      cofins_p: null,
      icms_csosn: 101,
      icms_orig: 0
    };
    
    const result = calculateItemTaxes(taxRule, 1000);
    
    expect(result.v_pis).toBe(0);
    expect(result.v_cofins).toBe(0);
    expect(result.v_tot_trib).toBe(0);
  });

  it('deve lidar com valor base zero', () => {
    const taxRule: TaxRule = {
      id: '1',
      name: 'Teste',
      active: true,
      pis_p: 0.65,
      cofins_p: 3.00,
      icms_csosn: 101,
      icms_orig: 0
    };
    
    const result = calculateItemTaxes(taxRule, 0);
    
    expect(result.v_pis).toBe(0);
    expect(result.v_cofins).toBe(0);
    expect(result.v_tot_trib).toBe(0);
  });

  it('deve funcionar com valores decimais de exemplo do XML', () => {
    // Exemplo do NFE: vPIS=0.00, vCOFINS=0.00, vTotTrib=17.26
    // Isso sugere que outros tributos podem ser adicionados no futuro
    const taxRule: TaxRule = {
      id: '1',
      name: 'Simples Nacional',
      active: true,
      pis_p: 0.00,
      cofins_p: 0.00,
      icms_csosn: 101,
      icms_orig: 0
    };
    
    const result = calculateItemTaxes(taxRule, 411.00);
    
    expect(result.v_pis).toBe(0);
    expect(result.v_cofins).toBe(0);
    expect(result.v_tot_trib).toBe(0);
  });
});
