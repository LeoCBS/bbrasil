import AdminHeader from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdminUser } from "@/auth";
import { getReceivable } from "@/lib/receivables";
import { ReceivableForm } from "@/components/receivable-form";
import { updateReceivableAction } from "@/lib/actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function EditReceivablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser("/admin/contas-receber");

  const { id } = await params;
  const receivableId = parseInt(id, 10);

  const receivable = await getReceivable(receivableId);

  if (!receivable) {
    return <div className="p-8">Conta a receber não encontrada.</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader email={user.email} />
      <div className="lg:flex">
        <AdminSidebar current="contas-receber" />
        <section className="flex-1 p-4 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-ink">Editar conta a receber</h1>
              <p className="mt-1 text-slate-600">Edite a conta a receber selecionada.</p>
            </div>
            <Button asChild>
              <Link href="/admin/contas-receber">Voltar</Link>
            </Button>
          </div>

          <div className="max-w-4xl">
            <ReceivableForm 
              receivable={receivable} 
              action={updateReceivableAction} 
              submitLabel="Salvar" 
              submitIcon={<></>}
              userUnitId={receivable.unit_id || undefined}
              userUnitName={receivable.unit_name}
              userId={receivable.user_id || undefined}
              userName={receivable.user_name || undefined}
              userEmail={receivable.user_email || undefined}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
