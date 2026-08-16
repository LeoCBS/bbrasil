import AdminHeader from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdminUser } from "@/auth";
import { getUnits } from "@/lib/units";
import { createProfileAction } from "@/lib/user-actions";
import { UserForm } from "@/components/user-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewUserPage() {
  const user = await requireAdminUser("/admin/usuarios");
  const units = await getUnits();

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader email={user.email} />
      <div className="lg:flex">
        <AdminSidebar current="usuarios" />
        <section className="flex-1 p-4 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-ink">Novo usuário</h1>
              <p className="mt-1 text-slate-600">Crie um novo perfil de usuário.</p>
            </div>
            <Button asChild>
              <Link href="/admin/usuarios">Voltar</Link>
            </Button>
          </div>

          <div className="max-w-3xl">
            <UserForm units={units} submitLabel="Criar usuário" submitIcon={<></>} action={createProfileAction} />
          </div>
        </section>
      </div>
    </main>
  );
}
