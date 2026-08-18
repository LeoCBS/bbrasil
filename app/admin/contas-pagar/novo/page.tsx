import AdminHeader from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdminUser, getCurrentUserProfile } from "@/auth";
import { getUnits } from "@/lib/units";
import { PayableForm } from "@/components/payable-form";
import { createPayableAction } from "@/lib/actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewPayablePage() {
  const user = await requireAdminUser("/admin/contas-pagar");
  const userProfile = await getCurrentUserProfile();

  const units = await getUnits();
  const userUnit = userProfile?.unit_id ? units.find(u => u.id === userProfile.unit_id) : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader email={user.email} />
      <div className="lg:flex">
        <AdminSidebar current="contas-pagar" />
        <section className="flex-1 p-4 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-ink">Nova conta a pagar</h1>
              <p className="mt-1 text-slate-600">Crie uma nova conta a pagar{userUnit ? ` para ${userUnit.name}` : ''}.</p>
            </div>
            <Button asChild>
              <Link href="/admin/contas-pagar">Voltar</Link>
            </Button>
          </div>

          <div className="max-w-4xl">
            <PayableForm 
              action={createPayableAction} 
              submitLabel="Criar conta" 
              submitIcon={<></>}
              userUnitId={userProfile?.unit_id || undefined}
              userUnitName={userUnit?.name}
              userId={user.id}
              userName={userProfile?.name || undefined}
              userEmail={user.email}
              units={units}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
