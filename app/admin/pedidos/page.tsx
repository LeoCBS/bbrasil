import Link from "next/link";
import { Search } from "lucide-react";
import { requireAdminUser, getCurrentUserProfile } from "@/auth";
import { getPaginatedOrders } from "@/lib/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AdminHeader from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { buildHref, parsePageParam } from "@/lib/pagination";
import { QuotationConverter } from "@/components/quotation-converter";
import { OrdersTable } from "@/components/admin/orders-table";

const pageSize = 10;

type AdminOrdersPageProps = {
  searchParams?: Promise<{
    busca?: string;
    page?: string;
  }>;
};

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const user = await requireAdminUser();
  const userProfile = await getCurrentUserProfile();
  const params = await searchParams;
  const search = params?.busca?.trim();
  const page = parsePageParam(params?.page);
  const hrefFor = (target: number) => buildHref("/admin/pedidos", { busca: search }, target);

  // Filter by user's unit if user has a unit_id
  const unitId = userProfile?.unit_id || undefined;

  const { orders, total, totalPages } = await getPaginatedOrders({ 
    page, 
    pageSize, 
    search,
    unitId 
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader email={user.email} />
      <div className="lg:flex">
        <AdminSidebar current="pedidos" />
        <section className="flex-1 p-4 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-ink">Pedidos</h1>
              <p className="mt-1 text-slate-600">Listagem de pedidos{unitId ? ` da unidade` : ''}</p>
            </div>
            <Button asChild>
              <Link href="/admin/pedidos/novo">+ Novo pedido</Link>
            </Button>
          </div>

          <form className="mb-4 flex gap-3" action="/admin/pedidos">
            <div className="flex-1">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input name="busca" defaultValue={search ?? ""} placeholder="Buscar pedido..." className="pl-10" />
              </div>
            </div>
            <Button type="submit">Pesquisar</Button>
          </form>

          {/* Converter orçamento em pedido */}
          <QuotationConverter />

          <Card>
            <CardContent className="overflow-x-auto p-0">
              <OrdersTable orders={orders} />
            </CardContent>
          </Card>

          {total > 0 ? (
            <AdminPagination
              className="mt-4 flex items-center justify-between"
              page={page}
              totalPages={totalPages}
              hrefFor={hrefFor}
              label={<div className="text-sm text-slate-600">Mostrando {orders.length} de {total} pedidos · Página {page} de {totalPages}</div>}
            />
          ) : (
            <div className="mt-4 text-center text-slate-600">
              Nenhum pedido encontrado.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
