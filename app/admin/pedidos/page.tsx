import Link from "next/link";
import { Search } from "lucide-react";
import { requireAdminUser, getCurrentUserProfile } from "@/auth";
import { getPaginatedOrders, type Order } from "@/lib/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AdminHeader from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { buildHref, parsePageParam } from "@/lib/pagination";
import { formatCurrency } from "@/lib/format";
import { DeleteOrderButton } from "@/components/admin/delete-order-button";

const pageSize = 10;

type AdminOrdersPageProps = {
  searchParams?: Promise<{
    busca?: string;
    page?: string;
    status?: string;
  }>;
};

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const user = await requireAdminUser();
  const userProfile = await getCurrentUserProfile();
  const params = await searchParams;
  const search = params?.busca?.trim();
  const page = parsePageParam(params?.page);
  const status = params?.status;
  const hrefFor = (target: number) => buildHref("/admin/pedidos", { busca: search, status }, target);

  // Filter by user's unit if user has a unit_id
  const unitId = userProfile?.unit_id || undefined;

  const { orders, total, totalPages } = await getPaginatedOrders({ 
    page, 
    pageSize, 
    status: status as 'pending' | 'confirmed' | 'cancelled' | 'delivered' | undefined, 
    search,
    unitId 
  });

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
    delivered: 'Entregue'
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
    delivered: 'bg-green-100 text-green-800'
  };

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
            <select name="status" defaultValue={status ?? ""} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="confirmed">Confirmado</option>
              <option value="cancelled">Cancelado</option>
              <option value="delivered">Entregue</option>
            </select>
            <Button type="submit">Pesquisar</Button>
          </form>

          <Card>
            <CardContent className="p-0">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-left text-sm text-slate-600">
                    <th className="w-[8%] p-4 whitespace-nowrap">ID</th>
                    <th className="w-[18%] p-4 whitespace-nowrap">Cliente</th>
                    <th className="w-[14%] p-4 whitespace-nowrap">CNPJ</th>
                    <th className="w-[14%] p-4 whitespace-nowrap">Vendedor</th>
                    <th className="w-[12%] p-4 whitespace-nowrap">Unidade</th>
                    <th className="w-[10%] p-4 whitespace-nowrap">Status</th>
                    <th className="w-[10%] p-4 whitespace-nowrap">Total</th>
                    <th className="w-[8%] p-4 text-right whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order: Order) => (
                    <tr key={order.id} className="border-t">
                      <td className="p-4 whitespace-nowrap">
                        #{order.id}
                      </td>
                      <td className="p-4 overflow-hidden">
                        <div
                          className="truncate whitespace-nowrap overflow-hidden cursor-help"
                          title={order.client_name}
                        >
                          {order.client_name}
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {order.client_cnpj}
                      </td>
                      <td className="p-4 whitespace-nowrap overflow-hidden">
                        {order.client_salesperson_name || order.user_name || '-'}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {order.unit_name}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/pedidos/${order.id}/edit`}
                          className="mr-3 text-slate-600 hover:text-brand-ink"
                        >
                          ✏️
                        </Link>
                        <DeleteOrderButton orderId={order.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {total > 0 ? (
            <AdminPagination
              className="mt-4 flex items-center justify-between"
              page={page}
              totalPages={totalPages}
              hrefFor={hrefFor}
              label={<div className="text-sm text-slate-600">Mostrando {orders.length} de {total} pedidos</div>}
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
