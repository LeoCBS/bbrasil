import AdminHeader from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdminUser } from "@/auth";
import { getOrder } from "@/lib/orders";
import { getClients } from "@/lib/clients";
import { getProducts } from "@/lib/products";
import { getProfiles } from "@/lib/users";
import { updateOrderAction } from "@/lib/actions";
import { OrderForm } from "@/components/order-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LinkPending } from "@/components/ui/link-pending";
import { Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser("/admin/pedidos");

  const { id } = await params;
  const orderId = parseInt(id, 10);

  const [order, clients, products, profiles] = await Promise.all([
    getOrder(orderId),
    getClients({ includeInactive: false }),
    getProducts({ includeInactive: true }),
    getProfiles()
  ]);

  if (!order) {
    return <div className="p-8">Pedido não encontrado.</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader email={user.email} />
      <div className="lg:flex">
        <AdminSidebar current="pedidos" />
        <section className="flex-1 p-4 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-ink">{order.status === "finalized" ? "Visualizar pedido" : "Editar pedido"}</h1>
              <p className="mt-1 text-slate-600">{order.status === "finalized" ? "Detalhes do pedido finalizado." : "Edite o pedido selecionado."}</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <a href={`/api/orders/${orderId}/nfe-xml`} download>
                  <Download className="mr-2 h-4 w-4" />
                  XML NFe
                </a>
              </Button>
              <Button asChild>
                <Link href="/admin/pedidos"><LinkPending>Voltar</LinkPending></Link>
              </Button>
            </div>
          </div>

          {order.status === "finalized" ? (
            <Card className="max-w-4xl">
              <CardContent className="space-y-6 p-6">
                <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900">
                  Pedido finalizado após a autorização da NF-e. Os dados estão disponíveis somente para consulta.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><div className="text-sm text-slate-500">Cliente</div><div className="font-medium">{order.client_name}</div></div>
                  <div><div className="text-sm text-slate-500">CNPJ</div><div className="font-medium">{order.client_cnpj}</div></div>
                  <div><div className="text-sm text-slate-500">Unidade</div><div className="font-medium">{order.unit_name}</div></div>
                  <div><div className="text-sm text-slate-500">Vendedor</div><div className="font-medium">{order.client_salesperson_name || order.user_name || "—"}</div></div>
                </div>
                {order.observation && <div><div className="text-sm text-slate-500">Observação</div><p>{order.observation}</p></div>}
                {order.nfe_info && <div><div className="text-sm text-slate-500">Informações da NF-e</div><p>{order.nfe_info}</p></div>}
                <div>
                  <h2 className="mb-3 font-semibold text-brand-ink">Produtos</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead><tr className="border-b text-slate-500"><th className="py-2">Produto</th><th className="py-2">Qtd.</th><th className="py-2">Valor unitário</th><th className="py-2 text-right">Total</th></tr></thead>
                      <tbody>{order.items?.map(item => <tr key={item.id} className="border-b last:border-0"><td className="py-3">{item.product_name}{item.product_code ? ` (${item.product_code})` : ""}</td><td className="py-3">{item.quantity}</td><td className="py-3">{formatCurrency(item.unit_price)}</td><td className="py-3 text-right">{formatCurrency(item.total_price)}</td></tr>)}</tbody>
                    </table>
                  </div>
                  <p className="mt-4 text-right text-lg font-semibold">Total do pedido: {formatCurrency(order.total_amount)}</p>
                </div>
              </CardContent>
            </Card>
          ) : <div className="max-w-4xl">
            <OrderForm 
              order={order} 
              action={updateOrderAction} 
              clients={clients} 
              products={products} 
              profiles={profiles}
              submitLabel="Salvar" 
              submitIcon={<></>}
              userUnitId={order.unit_id || undefined}
              userUnitName={order.unit_name}
              userId={order.user_id || undefined}
              userName={order.user_name || undefined}
              userEmail={order.user_email || undefined}
            />
          </div>}
        </section>
      </div>
    </main>
  );
}
