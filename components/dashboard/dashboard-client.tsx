'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from "@/lib/format";
import { TrendingUp, TrendingDown, Package, Users, ShoppingCart, DollarSign, BarChart3, Loader2 } from "lucide-react";
import { DateRangePicker } from "./date-range-picker";
import { getUnits } from "@/lib/units";
import { type KeyIndicators, type RevenueEvolution, type SalesEvolution, type DashboardStats, type RevenueByMonth, type VisitsBySalesperson } from "@/lib/dashboard";

interface DashboardClientProps {
  initialStartDate: Date;
  initialEndDate: Date;
  initialAggregation: 'daily' | 'weekly';
  initialUnitId: string;
  initialStats: DashboardStats;
  initialRevenueByMonth: RevenueByMonth[];
  initialVisitsBySalesperson: VisitsBySalesperson[];
  initialKeyIndicators: KeyIndicators;
  initialRevenueEvolution: RevenueEvolution[];
  initialSalesEvolution: SalesEvolution[];
}

export function DashboardClient({ 
  initialStartDate, 
  initialEndDate, 
  initialAggregation, 
  initialUnitId,
  initialStats,
  initialRevenueByMonth,
  initialVisitsBySalesperson,
  initialKeyIndicators,
  initialRevenueEvolution,
  initialSalesEvolution
}: DashboardClientProps) {
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [revenueByMonth, setRevenueByMonth] = useState<RevenueByMonth[]>(initialRevenueByMonth);
  const [visitsBySalesperson, setVisitsBySalesperson] = useState<VisitsBySalesperson[]>(initialVisitsBySalesperson);
  const [keyIndicators, setKeyIndicators] = useState<KeyIndicators>(initialKeyIndicators);
  const [revenueEvolution, setRevenueEvolution] = useState<RevenueEvolution[]>(initialRevenueEvolution);
  const [salesEvolution, setSalesEvolution] = useState<SalesEvolution[]>(initialSalesEvolution);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [aggregation, setAggregation] = useState(initialAggregation);
  const [unitId, setUnitId] = useState(initialUnitId);
  const [units, setUnits] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    // Carregar unidades
    getUnits().then(setUnits);
  }, []);

  // Carregar dados iniciais apenas uma vez ao montar
  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async (overrideUnitId?: string) => {
    setLoadingStats(true);
    setLoadingCharts(true);
    try {
      const params = new URLSearchParams();
      // Usa o valor passado ou o estado atual
      const currentUnitId = overrideUnitId !== undefined ? overrideUnitId : unitId;
      // Só adiciona unitId se não estiver vazio
      if (currentUnitId && currentUnitId !== '') params.append('unitId', currentUnitId);

      const [statsData, revenueByMonthData, visitsBySalespersonData, keyIndicatorsData] = await Promise.all([
        fetch(`/api/dashboard/stats?${params.toString()}`).then(r => r.json()),
        fetch(`/api/dashboard/revenue-by-month?${params.toString()}`).then(r => r.json()),
        fetch(`/api/dashboard/visits-by-salesperson?${params.toString()}`).then(r => r.json()),
        fetch(`/api/dashboard/key-indicators?${params.toString()}`).then(r => r.json())
      ]);

      const evolutionParams = new URLSearchParams();
      // Usa o valor passado ou o estado atual
      // Só adiciona unitId se não estiver vazio
      if (currentUnitId && currentUnitId !== '') evolutionParams.append('unitId', currentUnitId);
      evolutionParams.append('startDate', startDate.toISOString());
      evolutionParams.append('endDate', endDate.toISOString());
      evolutionParams.append('aggregation', aggregation);

      const [revenueEvolutionData, salesEvolutionData] = await Promise.all([
        fetch(`/api/dashboard/revenue-evolution?${evolutionParams.toString()}`).then(r => r.json()),
        fetch(`/api/dashboard/sales-evolution?${evolutionParams.toString()}`).then(r => r.json())
      ]);

      setStats(statsData);
      setRevenueByMonth(revenueByMonthData);
      setVisitsBySalesperson(visitsBySalespersonData);
      setKeyIndicators(keyIndicatorsData);
      setRevenueEvolution(revenueEvolutionData);
      setSalesEvolution(salesEvolutionData);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoadingStats(false);
      setLoadingCharts(false);
    }
  };

  const handleDateChange = (newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    loadDashboardData();
  };

  const handleAggregationChange = (value: 'daily' | 'weekly') => {
    setAggregation(value);
    loadDashboardData();
  };

  const handleUnitChange = (value: string) => {
    setUnitId(value);
    loadDashboardData(value);
  };

  return (
    <>
      {/* Seleção de período e unidade */}
      <div className="mb-6 flex items-center gap-3">
        <select
          value={unitId}
          onChange={(e) => handleUnitChange(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
        >
          <option value="">Todas as unidades</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>
        
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onDateChange={handleDateChange}
        />
        
        <select
          value={aggregation}
          onChange={(e) => handleAggregationChange(e.target.value as 'daily' | 'weekly')}
          className="px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
        >
          <option value="daily">Diário</option>
          <option value="weekly">Semanal</option>
        </select>

        {(loadingStats || loadingCharts) && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Atualizando...</span>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <KPICard
          title="Faturamento (mês)"
          value={formatCurrency(stats?.revenue || 0)}
          growth={stats?.revenueGrowth || 0}
          icon={<DollarSign className="h-5 w-5" />}
          loading={loadingStats}
        />
        <KPICard
          title="Pedidos (mês)"
          value={stats?.ordersCount?.toString() || '0'}
          growth={stats?.ordersGrowth || 0}
          icon={<ShoppingCart className="h-5 w-5" />}
          loading={loadingStats}
        />
        <KPICard
          title="Clientes ativos"
          value={stats?.activeClients?.toString() || '0'}
          growth={stats?.clientsGrowth || 0}
          icon={<Users className="h-5 w-5" />}
          loading={loadingStats}
        />
        <KPICard
          title="Ticket médio"
          value={formatCurrency(stats?.averageTicket || 0)}
          growth={stats?.ticketGrowth || 0}
          icon={<BarChart3 className="h-5 w-5" />}
          loading={loadingStats}
        />
        <KPICard
          title="Itens vendidos"
          value={stats?.itemsSold?.toString() || '0'}
          growth={stats?.itemsGrowth || 0}
          icon={<Package className="h-5 w-5" />}
          loading={loadingStats}
        />
      </div>

      {/* Gráficos de linha */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartCard title="Evolução do faturamento (R$)" loading={loadingCharts}>
          <LineChart data={revenueEvolution} />
        </ChartCard>
        <ChartCard title="Evolução das vendas (R$)" loading={loadingCharts}>
          <DoubleLineChart data={salesEvolution} />
        </ChartCard>
      </div>

      {/* Gráficos adicionais - 2 por linha */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartCard title="Faturamento por mês (últimos 12 meses)" loading={loadingCharts}>
          <BarChart data={revenueByMonth} />
        </ChartCard>
        <ChartCard title="Visitação por vendedor (mês)" loading={loadingCharts}>
          <HorizontalBarChart data={visitsBySalesperson} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartCard title="Principais indicadores" loading={loadingCharts}>
          <KeyIndicatorsList indicators={keyIndicators} />
        </ChartCard>
      </div>
    </>
  );
}

function KPICard({ title, value, growth, icon, loading }: { title: string; value: string; growth: number; icon: React.ReactNode; loading?: boolean }) {
  const isPositive = growth >= 0;
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-center h-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-600">{title}</span>
        <div className="text-slate-500">{icon}</div>
      </div>
      <div className="text-2xl font-bold text-brand-ink mb-2">{value}</div>
      <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
        <span>{Math.abs(growth)}% vs mês anterior</span>
      </div>
    </div>
  );
}

function ChartCard({ title, children, loading }: { title: string; children: React.ReactNode; loading?: boolean }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-brand-ink mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-brand-ink mb-4">{title}</h3>
      {children}
    </div>
  );
}

function LineChart({ data }: { data: RevenueEvolution[] }) {
  // Agrupar dados por unidade
  const units = Array.from(new Set(data.map(d => d.unitId)));
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  // Cores para diferentes unidades
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
  
  return (
    <div className="h-64">
      <svg viewBox="0 0 400 200" className="w-full h-full">
        {/* Eixo Y */}
        <line x1="40" y1="10" x2="40" y2="190" stroke="#e2e8f0" strokeWidth="1" />
        {Array.from({ length: 5 }).map((_, i) => {
          const y = 190 - (i * 45);
          const value = (maxValue * (i / 4));
          return (
            <g key={i}>
              <line x1="35" y1={y} x2="395" y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x="30" y={y + 4} fontSize="10" fill="#64748b" textAnchor="end">
                {formatCompactNumber(value)}
              </text>
            </g>
          );
        })}
        
        {/* Linhas do gráfico (uma por unidade) */}
        {units.map((unitId, unitIndex) => {
          const unitData = data.filter(d => d.unitId === unitId);
          const unitColor = colors[unitIndex % colors.length];
          
          return (
            <g key={unitId}>
              <polyline
                fill="none"
                stroke={unitColor}
                strokeWidth="2"
                points={unitData.map((point, index) => {
                  const x = 40 + (index / (unitData.length - 1)) * 350;
                  const y = 190 - (point.value / maxValue) * 180;
                  return `${x},${y}`;
                }).join(' ')}
              />
              
              {/* Pontos */}
              {unitData.map((point, index) => {
                const x = 40 + (index / (unitData.length - 1)) * 350;
                const y = 190 - (point.value / maxValue) * 180;
                return (
                  <g key={index}>
                    <circle
                      cx={x}
                      cy={y}
                      r="3"
                      fill={unitColor}
                      className="hover:r-5 transition-all cursor-pointer"
                    />
                    <title>{`${point.unitName || 'Unidade'}: ${formatCurrency(point.value)}`}</title>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      
      {/* Legenda de unidades */}
      {units.length > 1 && (
        <div className="flex flex-wrap gap-3 mt-4 text-sm">
          {units.map((unitId, index) => {
            const unitName = data.find(d => d.unitId === unitId)?.unitName || `Unidade ${index + 1}`;
            const unitColor = colors[index % colors.length];
            return (
              <div key={unitId} className="flex items-center gap-2">
                <div className="w-4 h-1" style={{ backgroundColor: unitColor }} />
                <span className="text-slate-700">{unitName}</span>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Labels do eixo X */}
      <div className="flex justify-between mt-2 text-xs text-slate-600 px-10">
        {data.filter(d => d.unitId === units[0]).map((point, index) => (
          <span key={index} className="text-center">
            {index % Math.ceil(data.filter(d => d.unitId === units[0]).length / 6) === 0 ? point.date : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

function DoubleLineChart({ data }: { data: SalesEvolution[] }) {
  // Agrupar dados por unidade
  const units = Array.from(new Set(data.map(d => d.unitId)));
  const maxValue = Math.max(...data.map(d => Math.max(d.currentPeriod, d.previousPeriod)), 1);
  
  // Cores para diferentes unidades
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
  
  return (
    <div className="h-64">
      <svg viewBox="0 0 400 200" className="w-full h-full">
        {/* Eixo Y */}
        <line x1="40" y1="10" x2="40" y2="190" stroke="#e2e8f0" strokeWidth="1" />
        {Array.from({ length: 5 }).map((_, i) => {
          const y = 190 - (i * 45);
          const value = (maxValue * (i / 4));
          return (
            <g key={i}>
              <line x1="35" y1={y} x2="395" y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x="30" y={y + 4} fontSize="10" fill="#64748b" textAnchor="end">
                {formatCompactNumber(value)}
              </text>
            </g>
          );
        })}
        
        {/* Linhas do gráfico (uma por unidade) */}
        {units.map((unitId, unitIndex) => {
          const unitData = data.filter(d => d.unitId === unitId);
          const unitColor = colors[unitIndex % colors.length];
          
          return (
            <g key={unitId}>
              {/* Linha do período anterior (cinza tracejada) */}
              <polyline
                fill="none"
                stroke="#9ca3af"
                strokeWidth="2"
                strokeDasharray="5,5"
                points={unitData.map((point, index) => {
                  const x = 40 + (index / (unitData.length - 1)) * 350;
                  const y = 190 - (point.previousPeriod / maxValue) * 180;
                  return `${x},${y}`;
                }).join(' ')}
              />
              
              {/* Linha do período atual (colorida) */}
              <polyline
                fill="none"
                stroke={unitColor}
                strokeWidth="2"
                points={unitData.map((point, index) => {
                  const x = 40 + (index / (unitData.length - 1)) * 350;
                  const y = 190 - (point.currentPeriod / maxValue) * 180;
                  return `${x},${y}`;
                }).join(' ')}
              />
              
              {/* Pontos do período atual */}
              {unitData.map((point, index) => {
                const x = 40 + (index / (unitData.length - 1)) * 350;
                const y = 190 - (point.currentPeriod / maxValue) * 180;
                return (
                  <g key={index}>
                    <circle
                      cx={x}
                      cy={y}
                      r="3"
                      fill={unitColor}
                      className="hover:r-5 transition-all cursor-pointer"
                    />
                    <title>{`${point.unitName || 'Unidade'} - Este período: ${formatCurrency(point.currentPeriod)}`}</title>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      
      {/* Legenda de unidades */}
      {units.length > 1 && (
        <div className="flex flex-wrap gap-3 mt-4 text-sm">
          {units.map((unitId, index) => {
            const unitName = data.find(d => d.unitId === unitId)?.unitName || `Unidade ${index + 1}`;
            const unitColor = colors[index % colors.length];
            return (
              <div key={unitId} className="flex items-center gap-2">
                <div className="w-4 h-1" style={{ backgroundColor: unitColor }} />
                <span className="text-slate-700">{unitName}</span>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Legenda de período */}
      <div className="flex justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-blue-500" />
          <span className="text-slate-700">Este período</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-gray-400 border-dashed border-t-2" />
          <span className="text-slate-700">Período anterior</span>
        </div>
      </div>
      
      {/* Labels do eixo X */}
      <div className="flex justify-between mt-2 text-xs text-slate-600 px-10">
        {data.filter(d => d.unitId === units[0]).map((point, index) => (
          <span key={index} className="text-center">
            {index % Math.ceil(data.filter(d => d.unitId === units[0]).length / 6) === 0 ? point.date : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data }: { data: RevenueByMonth[] }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="h-64">
      <svg viewBox="0 0 400 200" className="w-full h-full">
        {/* Eixo Y */}
        <line x1="40" y1="10" x2="40" y2="190" stroke="#e2e8f0" strokeWidth="1" />
        {Array.from({ length: 5 }).map((_, i) => {
          const y = 190 - (i * 45);
          const value = (maxValue * (i / 4));
          return (
            <g key={i}>
              <line x1="35" y1={y} x2="395" y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x="30" y={y + 4} fontSize="10" fill="#64748b" textAnchor="end">
                {formatCompactNumber(value)}
              </text>
            </g>
          );
        })}
        
        {/* Barras */}
        {data.map((item, index) => {
          const height = maxValue > 0 ? (item.value / maxValue) * 180 : 0;
          const x = 40 + (index / (data.length - 1)) * 350;
          const y = 190 - height;
          const barWidth = 350 / data.length - 4;
          
          return (
            <g key={index}>
              <rect
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={height}
                fill="#3b82f6"
                className="hover:fill-blue-600 transition-colors cursor-pointer"
              />
              <title>{formatCurrency(item.value)}</title>
            </g>
          );
        })}
      </svg>
      
      {/* Labels do eixo X */}
      <div className="flex justify-between mt-2 text-xs text-slate-600 px-10">
        {data.map((item, index) => (
          <span key={index} className="text-center">
            {index % Math.ceil(data.length / 6) === 0 ? item.month : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

function HorizontalBarChart({ data }: { data: VisitsBySalesperson[] }) {
  const maxValue = Math.max(...data.map(d => d.visits), 1);
  
  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const width = maxValue > 0 ? (item.visits / maxValue) * 100 : 0;
        return (
          <div key={index} className="flex items-center gap-4">
            <div className="w-32 text-sm text-slate-700 truncate" title={item.salesperson}>
              {item.salesperson}
            </div>
            <div className="flex-1">
              <div 
                className="h-6 bg-blue-500 rounded flex items-center px-2"
                style={{ width: `${width}%` }}
              >
                <span className="text-xs text-white font-medium">{item.visits}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KeyIndicatorsList({ indicators }: { indicators: KeyIndicators | null }) {
  const indicatorItems = [
    { label: 'Taxa de conversão', value: `${indicators?.conversionRate?.toFixed(1) || 0}%`, growth: indicators?.conversionRateGrowth || 0, unit: 'p.p.' },
    { label: 'Inadimplência', value: `${indicators?.defaultRate?.toFixed(1) || 0}%`, growth: indicators?.defaultRateGrowth || 0, unit: 'p.p.' },
    { label: 'Giro de estoque', value: indicators?.inventoryTurnover?.toFixed(1) || 0, growth: indicators?.inventoryTurnoverGrowth || 0, unit: '' },
    { label: 'Nível de serviço', value: `${indicators?.serviceLevel?.toFixed(1) || 0}%`, growth: indicators?.serviceLevelGrowth || 0, unit: 'p.p.' }
  ];

  return (
    <div className="space-y-4">
      {indicatorItems.map((item, index) => {
        const isPositive = item.growth >= 0;
        return (
          <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <div className="text-sm text-slate-600">{item.label}</div>
              <div className="text-lg font-bold text-brand-ink">{item.value}</div>
            </div>
            <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              <span>{isPositive ? '+' : ''}{item.growth} {item.unit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatCompactNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return value.toFixed(0);
}
