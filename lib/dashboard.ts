import { unstable_noStore as noStore } from "next/cache";
import { getSupabase } from "@/lib/supabase";

export interface DashboardStats {
  revenue: number;
  revenueGrowth: number;
  ordersCount: number;
  ordersGrowth: number;
  activeClients: number;
  clientsGrowth: number;
  averageTicket: number;
  ticketGrowth: number;
  itemsSold: number;
  itemsGrowth: number;
}

export interface RevenueByMonth {
  month: string;
  value: number;
}

export interface SalesByCategory {
  category: string;
  value: number;
  percentage: number;
}

export interface RevenueEvolution {
  date: string;
  value: number;
  unitId?: string;
  unitName?: string;
}

export interface SalesEvolution {
  date: string;
  currentPeriod: number;
  previousPeriod: number;
  unitId?: string;
  unitName?: string;
}

export interface VisitsBySalesperson {
  salesperson: string;
  visits: number;
}

export interface KeyIndicators {
  conversionRate: number;
  conversionRateGrowth: number;
  defaultRate: number;
  defaultRateGrowth: number;
  inventoryTurnover: number;
  inventoryTurnoverGrowth: number;
  serviceLevel: number;
  serviceLevelGrowth: number;
}

const fallbackStats: DashboardStats = {
  revenue: 128950,
  revenueGrowth: 12.5,
  ordersCount: 64,
  ordersGrowth: 8.3,
  activeClients: 532,
  clientsGrowth: 5.7,
  averageTicket: 2015.63,
  ticketGrowth: 9.2,
  itemsSold: 1284,
  itemsGrowth: 11.8
};

const fallbackRevenueByMonth: RevenueByMonth[] = [
  { month: 'Jun/24', value: 85000 },
  { month: 'Jul/24', value: 92000 },
  { month: 'Ago/24', value: 88000 },
  { month: 'Set/24', value: 95000 },
  { month: 'Out/24', value: 102000 },
  { month: 'Nov/24', value: 110000 },
  { month: 'Dez/24', value: 118000 },
  { month: 'Jan/25', value: 95000 },
  { month: 'Fev/25', value: 102000 },
  { month: 'Mar/25', value: 108000 },
  { month: 'Abr/25', value: 115000 },
  { month: 'Mai/25', value: 128950 }
];

const fallbackSalesByCategory: SalesByCategory[] = [
  { category: 'Papel', value: 45000, percentage: 35 },
  { category: 'Limpeza', value: 32000, percentage: 25 },
  { category: 'Descartáveis', value: 25000, percentage: 19 },
  { category: 'EPI', value: 15000, percentage: 12 },
  { category: 'Diversos', value: 11450, percentage: 9 }
];

const fallbackVisitsBySalesperson: VisitsBySalesperson[] = [
  { salesperson: 'João Silva', visits: 24 },
  { salesperson: 'Maria Santos', visits: 18 },
  { salesperson: 'Carlos Lima', visits: 15 },
  { salesperson: 'Pedro Oliveira', visits: 12 },
  { salesperson: 'Ana Paula', visits: 10 },
  { salesperson: 'Lucas Pereira', visits: 8 },
  { salesperson: 'Fernanda Costa', visits: 6 }
];

const fallbackKeyIndicators: KeyIndicators = {
  conversionRate: 24.6,
  conversionRateGrowth: 3.2,
  defaultRate: 2.1,
  defaultRateGrowth: -0.4,
  inventoryTurnover: 4.2,
  inventoryTurnoverGrowth: 0.6,
  serviceLevel: 96.8,
  serviceLevelGrowth: 1.2
};

export async function getDashboardStats(unitId?: string): Promise<DashboardStats> {
  noStore();
  const supabase = getSupabase();
  if (!supabase) return fallbackStats;

  try {
    // Calcular faturamento do mês atual (contas a receber pagas)
    const currentMonth = new Date();
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
    const currentMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString();
    
    let revenueQuery = supabase
      .from("receivables")
      .select("amount")
      .gte("payment_date", currentMonthStart)
      .lt("payment_date", currentMonthEnd)
      .eq("status", "paid");
    
    if (unitId) {
      revenueQuery = revenueQuery.eq("unit_id", unitId);
    }
    
    const { data: currentMonthRevenue } = await revenueQuery;

    const revenue = currentMonthRevenue?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;

    // Calcular pedidos do mês atual
    let ordersQuery = supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", currentMonthStart)
      .lt("created_at", currentMonthEnd);
    
    if (unitId) {
      ordersQuery = ordersQuery.eq("unit_id", unitId);
    }
    
    const { count: ordersCount } = await ordersQuery;

    // Contar clientes ativos (filtrar por unidade se fornecido)
    let clientsQuery = supabase
      .from("clients")
      .select("*", { count: "exact", head: true });
    
    if (unitId) {
      clientsQuery = clientsQuery.eq("unit_id", unitId);
    }
    
    const { count: activeClients } = await clientsQuery;

    // Calcular ticket médio
    const averageTicket = (ordersCount || 0) > 0 ? revenue / (ordersCount || 0) : 0;

    // Calcular itens vendidos (soma de quantidade nos pedidos)
    let orderItemsQuery = supabase
      .from("order_items")
      .select("quantity")
      .gte("created_at", currentMonthStart)
      .lt("created_at", currentMonthEnd);
    
    if (unitId) {
      orderItemsQuery = orderItemsQuery.eq("unit_id", unitId);
    }
    
    const { data: orderItems } = await orderItemsQuery;

    const itemsSold = orderItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

    // Valores de crescimento (simulados por enquanto - implementar cálculo real comparando com mês anterior)
    const revenueGrowth = 12.5;
    const ordersGrowth = 8.3;
    const clientsGrowth = 5.7;
    const ticketGrowth = 9.2;
    const itemsGrowth = 11.8;

    return {
      revenue,
      revenueGrowth,
      ordersCount: ordersCount || 0,
      ordersGrowth,
      activeClients: activeClients || 0,
      clientsGrowth,
      averageTicket,
      ticketGrowth,
      itemsSold,
      itemsGrowth
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    return fallbackStats;
  }
}

export async function getRevenueByMonth(unitId?: string): Promise<RevenueByMonth[]> {
  noStore();
  const supabase = getSupabase();
  if (!supabase) return fallbackRevenueByMonth;

  try {
    // Buscar faturamento dos últimos 12 meses por mês
    const data: RevenueByMonth[] = [];
    const today = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();
      
      let monthRevenueQuery = supabase
        .from("receivables")
        .select("amount")
        .gte("payment_date", monthStart)
        .lt("payment_date", monthEnd)
        .eq("status", "paid");
      
      if (unitId) {
        monthRevenueQuery = monthRevenueQuery.eq("unit_id", unitId);
      }
      
      const { data: monthRevenue } = await monthRevenueQuery;

      const total = monthRevenue?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
      
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      data.push({
        month: `${monthNames[date.getMonth()]}/${String(date.getFullYear()).slice(2)}`,
        value: total
      });
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar faturamento por mês:', error);
    return fallbackRevenueByMonth;
  }
}

export async function getRevenueEvolution(startDate: Date, endDate: Date, aggregation: 'daily' | 'weekly' = 'daily', unitId?: string): Promise<RevenueEvolution[]> {
  noStore();
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    // Se unitId não for fornecido, buscar dados de todas as unidades
    if (!unitId) {
      const { data: units } = await supabase
        .from("units")
        .select("id, name");
      
      if (!units || units.length === 0) return [];
      
      const allData: RevenueEvolution[] = [];
      
      for (const unit of units) {
        const unitData = await getRevenueEvolutionForUnit(startDate, endDate, aggregation, unit.id, unit.name);
        allData.push(...unitData);
      }
      
      return allData;
    }
    
    // Se unitId for fornecido, buscar apenas dessa unidade
    const { data: unit } = await supabase
      .from("units")
      .select("id, name")
      .eq("id", unitId)
      .single();
    
    return await getRevenueEvolutionForUnit(startDate, endDate, aggregation, unitId, unit?.name);
  } catch (error) {
    console.error('Erro ao buscar evolução de faturamento:', error);
    return [];
  }
}

async function getRevenueEvolutionForUnit(startDate: Date, endDate: Date, aggregation: 'daily' | 'weekly', unitId: string, unitName: string): Promise<RevenueEvolution[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const data: RevenueEvolution[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    let periodStart: Date;
    let periodEnd: Date;
    let label: string;

    if (aggregation === 'weekly') {
      // Agrupar por semana
      const dayOfWeek = currentDate.getDay();
      periodStart = new Date(currentDate);
      periodStart.setDate(currentDate.getDate() - dayOfWeek);
      periodStart.setHours(0, 0, 0, 0);
      
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 6);
      periodEnd.setHours(23, 59, 59, 999);
      
      label = `${periodStart.getDate()}/${periodStart.getMonth() + 1}`;
      
      // Avançar para a próxima semana
      currentDate.setDate(currentDate.getDate() + 7);
    } else {
      // Agrupar por dia
      periodStart = new Date(currentDate);
      periodStart.setHours(0, 0, 0, 0);
      
      periodEnd = new Date(currentDate);
      periodEnd.setHours(23, 59, 59, 999);
      
      label = `${currentDate.getDate()}/${currentDate.getMonth() + 1}`;
      
      // Avançar para o próximo dia
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const periodRevenueQuery = supabase
      .from("receivables")
      .select("amount")
      .gte("payment_date", periodStart.toISOString())
      .lte("payment_date", periodEnd.toISOString())
      .eq("status", "paid")
      .eq("unit_id", unitId);
    
    const { data: periodRevenue } = await periodRevenueQuery;

    const total = periodRevenue?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
    
    data.push({
      date: label,
      value: total,
      unitId,
      unitName
    });
  }

  return data;
}

export async function getSalesEvolution(startDate: Date, endDate: Date, aggregation: 'daily' | 'weekly' = 'daily', unitId?: string): Promise<SalesEvolution[]> {
  noStore();
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    // Se unitId não for fornecido, buscar dados de todas as unidades
    if (!unitId) {
      const { data: units } = await supabase
        .from("units")
        .select("id, name");
      
      if (!units || units.length === 0) return [];
      
      const allData: SalesEvolution[] = [];
      
      for (const unit of units) {
        const unitData = await getSalesEvolutionForUnit(startDate, endDate, aggregation, unit.id, unit.name);
        allData.push(...unitData);
      }
      
      return allData;
    }
    
    // Se unitId for fornecido, buscar apenas dessa unidade
    const { data: unit } = await supabase
      .from("units")
      .select("id, name")
      .eq("id", unitId)
      .single();
    
    return await getSalesEvolutionForUnit(startDate, endDate, aggregation, unitId, unit?.name);
  } catch (error) {
    console.error('Erro ao buscar evolução de vendas:', error);
    return [];
  }
}

async function getSalesEvolutionForUnit(startDate: Date, endDate: Date, aggregation: 'daily' | 'weekly', unitId: string, unitName: string): Promise<SalesEvolution[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const data: SalesEvolution[] = [];
  const currentDate = new Date(startDate);
  
  // Calcular período anterior (mesmo período do ano anterior)
  const previousStartDate = new Date(startDate);
  previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
  const previousEndDate = new Date(endDate);
  previousEndDate.setFullYear(previousEndDate.getFullYear() - 1);
  
  while (currentDate <= endDate) {
    let periodStart: Date;
    let periodEnd: Date;
    let label: string;

    if (aggregation === 'weekly') {
      const dayOfWeek = currentDate.getDay();
      periodStart = new Date(currentDate);
      periodStart.setDate(currentDate.getDate() - dayOfWeek);
      periodStart.setHours(0, 0, 0);
      
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 6);
      periodEnd.setHours(23, 59, 59, 999);
      
      label = `${periodStart.getDate()}/${periodStart.getMonth() + 1}`;
      
      currentDate.setDate(currentDate.getDate() + 7);
    } else {
      periodStart = new Date(currentDate);
      periodStart.setHours(0, 0, 0);
      
      periodEnd = new Date(currentDate);
      periodEnd.setHours(23, 59, 59, 999);
      
      label = `${currentDate.getDate()}/${currentDate.getMonth() + 1}`;
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calcular offset para o período anterior
    const previousPeriodStart = new Date(periodStart);
    previousPeriodStart.setFullYear(previousPeriodStart.getFullYear() - 1);
    const previousPeriodEnd = new Date(periodEnd);
    previousPeriodEnd.setFullYear(previousPeriodEnd.getFullYear() - 1);

    // Buscar vendas do período atual
    const currentPeriodSalesQuery = supabase
      .from("orders")
      .select("total_amount")
      .gte("created_at", periodStart.toISOString())
      .lte("created_at", periodEnd.toISOString())
      .eq("unit_id", unitId);
    
    const { data: currentPeriodSales } = await currentPeriodSalesQuery;

    const currentTotal = currentPeriodSales?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

    // Buscar vendas do período anterior
    const previousPeriodSalesQuery = supabase
      .from("orders")
      .select("total_amount")
      .gte("created_at", previousPeriodStart.toISOString())
      .lte("created_at", previousPeriodEnd.toISOString())
      .eq("unit_id", unitId);
    
    const { data: previousPeriodSales } = await previousPeriodSalesQuery;

    const previousTotal = previousPeriodSales?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
    
    data.push({
      date: label,
      currentPeriod: currentTotal,
      previousPeriod: previousTotal,
      unitId,
      unitName
    });
  }

  return data;
}

export async function getSalesByCategory(unitId?: string): Promise<SalesByCategory[]> {
  noStore();
  const supabase = getSupabase();
  if (!supabase) return fallbackSalesByCategory;

  try {
    // Buscar categorias de produtos
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name");

    if (!categories || categories.length === 0) return fallbackSalesByCategory;

    // Calcular vendas por categoria
    const salesByCategory: SalesByCategory[] = [];
    let totalRevenue = 0;

    for (const category of categories) {
      // Buscar pedidos com itens desta categoria
      const { data: categoryItems } = await supabase
        .from("order_items")
        .select("order_id, quantity, unit_price, total_price")
        .eq("product_id", category.id);

      if (categoryItems && categoryItems.length > 0) {
        const categoryTotal = categoryItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
        totalRevenue += categoryTotal;
        salesByCategory.push({
          category: category.name,
          value: categoryTotal,
          percentage: 0 // Será calculado depois
        });
      }
    }

    // Calcular porcentagens
    if (totalRevenue > 0) {
      salesByCategory.forEach(item => {
        item.percentage = (item.value / totalRevenue) * 100;
      });
    }

    return salesByCategory;
  } catch (error) {
    console.error('Erro ao buscar vendas por categoria:', error);
    return fallbackSalesByCategory;
  }
}

export async function getVisitsBySalesperson(unitId?: string): Promise<VisitsBySalesperson[]> {
  noStore();
  const supabase = getSupabase();
  if (!supabase) return fallbackVisitsBySalesperson;

  try {
    // Buscar profiles com role de vendedor
    let salespeopleQuery = supabase
      .from("profiles")
      .select("id, name, email")
      .eq("role", "salesperson");
    
    if (unitId) {
      salespeopleQuery = salespeopleQuery.eq("unit_id", unitId);
    }
    
    const { data: salespeople } = await salespeopleQuery;

    if (!salespeople || salespeople.length === 0) return fallbackVisitsBySalesperson;

    // Simular contagem de visitas (em um sistema real, isso viria de uma tabela de visitas)
    const visitsBySalesperson: VisitsBySalesperson[] = salespeople.map(person => ({
      salesperson: person.name || person.email || 'Sem nome',
      visits: Math.floor(Math.random() * 30) // Simulação
    }));

    return visitsBySalesperson;
  } catch (error) {
    console.error('Erro ao buscar visitas por vendedor:', error);
    return fallbackVisitsBySalesperson;
  }
}

export async function getKeyIndicators(unitId?: string): Promise<KeyIndicators> {
  noStore();
  const supabase = getSupabase();
  if (!supabase) return fallbackKeyIndicators;

  try {
    // Calcular indicadores baseados nos dados reais
    const currentMonth = new Date();
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
    const currentMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString();

    // Taxa de conversão: (pedidos / orçamentos) * 100
    let ordersQuery = supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", currentMonthStart)
      .lt("created_at", currentMonthEnd);
    
    if (unitId) {
      ordersQuery = ordersQuery.eq("unit_id", unitId);
    }
    
    const { count: ordersCount } = await ordersQuery;

    let quotationsQuery = supabase
      .from("quotations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", currentMonthStart)
      .lt("created_at", currentMonthEnd);
    
    if (unitId) {
      quotationsQuery = quotationsQuery.eq("unit_id", unitId);
    }
    
    const { count: quotationsCount } = await quotationsQuery;

    const conversionRate = (quotationsCount || 0) > 0 ? ((ordersCount || 0) / (quotationsCount || 0)) * 100 : 0;

    // Inadimplência: (contas vencidas não pagas / total) * 100
    let overdueReceivablesQuery = supabase
      .from("receivables")
      .select("amount")
      .eq("status", "overdue");
    
    if (unitId) {
      overdueReceivablesQuery = overdueReceivablesQuery.eq("unit_id", unitId);
    }
    
    const { data: overdueReceivables } = await overdueReceivablesQuery;

    const overdueTotal = overdueReceivables?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;

    let totalReceivablesQuery = supabase
      .from("receivables")
      .select("amount")
      .eq("status", "pending");
    
    if (unitId) {
      totalReceivablesQuery = totalReceivablesQuery.eq("unit_id", unitId);
    }
    
    const { data: totalReceivables } = await totalReceivablesQuery;

    const totalReceivablesAmount = totalReceivables?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;

    const defaultRate = totalReceivablesAmount > 0 ? (overdueTotal / totalReceivablesAmount) * 100 : 0;

    // Giro de estoque (simulado - baseado em vendas / estoque médio)
    const inventoryTurnover = 4.2;

    // Nível de serviço (simulado - baseado em entregas no prazo)
    const serviceLevel = 96.8;

    // Valores de crescimento (simulados)
    const conversionRateGrowth = 3.2;
    const defaultRateGrowth = -0.4;
    const inventoryTurnoverGrowth = 0.6;
    const serviceLevelGrowth = 1.2;

    return {
      conversionRate,
      conversionRateGrowth,
      defaultRate,
      defaultRateGrowth,
      inventoryTurnover,
      inventoryTurnoverGrowth,
      serviceLevel,
      serviceLevelGrowth
    };
  } catch (error) {
    console.error('Erro ao buscar indicadores chave:', error);
    return fallbackKeyIndicators;
  }
}
