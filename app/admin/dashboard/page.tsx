import AdminHeader from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdminUser, getCurrentUserProfile } from "@/auth";
import { getDashboardStats, getRevenueByMonth, getVisitsBySalesperson, getKeyIndicators, getRevenueEvolution, getSalesEvolution } from "@/lib/dashboard";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ startDate?: string; endDate?: string; aggregation?: string; unitId?: string }>;
}) {
  const user = await requireAdminUser();
  const userProfile = await getCurrentUserProfile();
  const unitId = userProfile?.unit_id || undefined;
  const params = await searchParams;
  
  const startDateParam = params.startDate ? new Date(params.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDateParam = params.endDate ? new Date(params.endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  const aggregation = (params.aggregation as 'daily' | 'weekly') || 'daily';
  // Se unitId estiver vazio na URL, usar a unidade do usuário para evitar timeout no server-side
  const selectedUnitId = params.unitId || unitId || undefined;

  try {
    const [stats, revenueByMonth, visitsBySalesperson, keyIndicators, revenueEvolution, salesEvolution] = await Promise.all([
      getDashboardStats(selectedUnitId || undefined),
      getRevenueByMonth(selectedUnitId || undefined),
      getVisitsBySalesperson(selectedUnitId || undefined),
      getKeyIndicators(selectedUnitId || undefined),
      getRevenueEvolution(startDateParam, endDateParam, aggregation, selectedUnitId || undefined),
      getSalesEvolution(startDateParam, endDateParam, aggregation, selectedUnitId || undefined)
    ]);

    return (
      <main className="min-h-screen bg-slate-50">
        <AdminHeader email={user.email} />
        <div className="lg:flex">
          <AdminSidebar current="dashboard" />
          <section className="flex-1 p-4 md:p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-brand-ink">Dashboard</h1>
              <p className="mt-1 text-slate-600">Visão geral do seu negócio</p>
            </div>

            <DashboardClient 
              initialStartDate={startDateParam}
              initialEndDate={endDateParam}
              initialAggregation={aggregation}
              initialUnitId={selectedUnitId || ''}
              initialStats={stats}
              initialRevenueByMonth={revenueByMonth}
              initialVisitsBySalesperson={visitsBySalesperson}
              initialKeyIndicators={keyIndicators}
              initialRevenueEvolution={revenueEvolution}
              initialSalesEvolution={salesEvolution}
            />
          </section>
        </div>
      </main>
    );
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    return (
      <main className="min-h-screen bg-slate-50">
        <AdminHeader email={user.email} />
        <div className="lg:flex">
          <AdminSidebar current="dashboard" />
          <section className="flex-1 p-4 md:p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-brand-ink">Dashboard</h1>
              <p className="mt-1 text-slate-600">Visão geral do seu negócio</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">Erro ao carregar dados do dashboard. Por favor, tente novamente.</p>
              <p className="text-red-600 text-sm mt-2">{error instanceof Error ? error.message : 'Erro desconhecido'}</p>
            </div>
          </section>
        </div>
      </main>
    );
  }
}
