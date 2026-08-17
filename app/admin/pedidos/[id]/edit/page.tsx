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
              <h1 className="text-3xl font-bold text-brand-ink">Editar pedido</h1>
              <p className="mt-1 text-slate-600">Edite o pedido selecionado.</p>
            </div>
            <Button asChild>
              <Link href="/admin/pedidos">Voltar</Link>
            </Button>
          </div>

          <div className="max-w-4xl">
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
          </div>
        </section>
      </div>
    </main>
  );
}
