import AdminHeader from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdminUser } from "@/auth";
import { getQuotation } from "@/lib/quotations";
import { getClients } from "@/lib/clients";
import { getProducts } from "@/lib/products";
import { getProfiles } from "@/lib/users";
import { updateQuotationAction } from "@/lib/actions";
import { QuotationForm } from "@/components/quotation-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConvertQuotationButton } from "@/components/admin/convert-quotation-button";

export default async function EditQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser("/admin/orcamentos");

  const { id } = await params;
  const quotationId = parseInt(id, 10);

  const [quotation, clients, products, profiles] = await Promise.all([
    getQuotation(quotationId),
    getClients({ includeInactive: false }),
    getProducts({ includeInactive: true }),
    getProfiles()
  ]);

  if (!quotation) {
    return <div className="p-8">Orçamento não encontrado.</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader email={user.email} />
      <div className="lg:flex">
        <AdminSidebar current="orcamentos" />
        <section className="flex-1 p-4 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-ink">Editar orçamento</h1>
              <p className="mt-1 text-slate-600">Edite o orçamento selecionado.</p>
            </div>
            <div className="flex gap-2">
              <ConvertQuotationButton quotationId={quotation.id} size="default" />
              <Button asChild>
                <Link href="/admin/orcamentos">Voltar</Link>
              </Button>
            </div>
          </div>

          <div className="max-w-4xl">
            <QuotationForm 
              quotation={quotation} 
              action={updateQuotationAction} 
              clients={clients} 
              products={products} 
              profiles={profiles}
              submitLabel="Salvar" 
              submitIcon={<></>}
              userUnitId={quotation.unit_id || undefined}
              userUnitName={quotation.unit_name}
              userId={quotation.user_id || undefined}
              userName={quotation.user_name || undefined}
              userEmail={quotation.user_email || undefined}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
