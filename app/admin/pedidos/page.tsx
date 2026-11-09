import Link from "next/link";
import { Search, Download } from "lucide-react";
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
import { QuotationConverter } from "@/components/quotation-converter";
import { EmitNFeButton } from "@/components/admin/emit-nfe-button";

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
              <table className="w-full min-w-[1120px] table-fixed border-collapse">
                <colgroup>
                  <col className="w-[6%]" />
                  <col className="w-[18%]" />
                  <col className="w-[13%]" />
                  <col className="w-[16%]" />
                  <col className="w-[14%]" />
                  <col className="w-[9%]" />
                  <col className="w-[24%]" />
                </colgroup>
                <thead>
                  <tr className="bg-slate-50 text-left text-sm text-slate-600">
                    <th className="p-3 whitespace-nowrap">ID</th>
                    <th className="p-3 whitespace-nowrap">Cliente</th>
                    <th className="p-3 whitespace-nowrap">CNPJ</th>
                    <th className="p-3 whitespace-nowrap">Vendedor</th>
                    <th className="p-3 whitespace-nowrap">Unidade</th>
                    <th className="p-3 whitespace-nowrap">Total</th>
                    <th className="p-3 text-right whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order: Order) => (
                    <tr key={order.id} className="border-t">
                      <td className="p-3 whitespace-nowrap">
                        #{order.id}
                      </td>
                      <td className="overflow-hidden p-3">
                        <div
                          className="truncate whitespace-nowrap overflow-hidden cursor-help"
                          title={order.client_name}
                        >
                          {order.client_name}
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {order.client_cnpj}
                      </td>
                      <td className="overflow-hidden p-3">
                        {order.client_salesperson_name || order.user_name || '-'}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {order.unit_name}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                        <Link
                          href={`/admin/pedidos/${order.id}/edit`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-brand-ink"
                          title="Editar pedido"
                          aria-label="Editar pedido"
                        >
                          ✏️
                        </Link>
                        <a
                          href={`/api/orders/${order.id}/nfe-xml`}
                          download
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-brand-ink"
                          title="Baixar XML NFe"
                          aria-label="Baixar XML da NF-e"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <EmitNFeButton orderId={order.id} />
                        <DeleteOrderButton orderId={order.id} />
                        </div>
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
