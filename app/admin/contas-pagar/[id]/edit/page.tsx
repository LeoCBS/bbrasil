import AdminHeader from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdminUser } from "@/auth";
import { getPayable } from "@/lib/payables";
import { getUnits } from "@/lib/units";
import { PayableForm } from "@/components/payable-form";
import { updatePayableAction } from "@/lib/actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function EditPayablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser("/admin/contas-pagar");

  const { id } = await params;
  const payableId = parseInt(id, 10);

  const [payable, units] = await Promise.all([
    getPayable(payableId),
    getUnits()
  ]);

  if (!payable) {
    return <div className="p-8">Conta a pagar não encontrada.</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader email={user.email} />
      <div className="lg:flex">
        <AdminSidebar current="contas-pagar" />
        <section className="flex-1 p-4 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-ink">Editar conta a pagar</h1>
              <p className="mt-1 text-slate-600">Edite a conta a pagar selecionada.</p>
            </div>
            <Button asChild>
              <Link href="/admin/contas-pagar">Voltar</Link>
            </Button>
          </div>

          <div className="max-w-4xl">
            <PayableForm 
              payable={payable} 
              action={updatePayableAction} 
              submitLabel="Salvar" 
              submitIcon={<></>}
              userUnitId={payable.unit_id || undefined}
              userUnitName={payable.unit_name}
              userId={payable.user_id || undefined}
              userName={payable.user_name || undefined}
              userEmail={payable.user_email || undefined}
              units={units}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
