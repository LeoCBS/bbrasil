import AdminHeader from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdminUser, getCurrentUserProfile } from "@/auth";
import { getClients } from "@/lib/clients";
import { getProducts } from "@/lib/products";
import { getUnits } from "@/lib/units";
import { getProfiles } from "@/lib/users";
import { createQuotationAction } from "@/lib/actions";
import { QuotationForm } from "@/components/quotation-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewQuotationPage() {
  const user = await requireAdminUser("/admin/orcamentos");
  const userProfile = await getCurrentUserProfile();

  const [clients, products, units, profiles] = await Promise.all([
    getClients({ includeInactive: false }),
    getProducts({ includeInactive: true }),
    getUnits(),
    getProfiles()
  ]);

  // Get user's unit info
  const userUnit = userProfile?.unit_id ? units.find(u => u.id === userProfile.unit_id) : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader email={user.email} />
      <div className="lg:flex">
        <AdminSidebar current="orcamentos" />
        <section className="flex-1 p-4 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-ink">Novo orçamento</h1>
              <p className="mt-1 text-slate-600">Crie um novo orçamento{userUnit ? ` para ${userUnit.name}` : ''}.</p>
            </div>
            <Button asChild>
              <Link href="/admin/orcamentos">Voltar</Link>
            </Button>
          </div>

          <div className="max-w-4xl">
            <QuotationForm 
              action={createQuotationAction} 
              clients={clients} 
              products={products} 
              profiles={profiles}
              submitLabel="Criar orçamento" 
              submitIcon={<></>}
              userUnitId={userProfile?.unit_id || undefined}
              userUnitName={userUnit?.name}
              userId={user.id}
              userName={userProfile?.name || undefined}
              userEmail={user.email}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
