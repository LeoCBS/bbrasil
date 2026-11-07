import AdminHeader from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdminUser } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import TaxRuleForm from "@/components/admin/tax-rule-form";
import { updateTaxRuleAction } from "@/lib/actions";
import { getTaxRule } from "@/lib/tax-rules";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditTaxRulePage({ params }: Props) {
  const user = await requireAdminUser("/admin/regras-fiscais");
  const { id } = await params;
  const taxRule = await getTaxRule(id, { includeInactive: true });

  if (!taxRule) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader email={user.email} />
      <div className="lg:flex">
        <AdminSidebar current="regras-fiscais" />
        <section className="flex-1 p-4 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-ink">Editar Regra Fiscal</h1>
              <p className="mt-1 text-slate-600">Edite a configuração fiscal da NF-e.</p>
            </div>
            <Button asChild>
              <Link href="/admin/regras-fiscais">Voltar</Link>
            </Button>
          </div>

          <div className="max-w-2xl">
            <form action={updateTaxRuleAction}>
              <TaxRuleForm taxRule={taxRule} />
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
