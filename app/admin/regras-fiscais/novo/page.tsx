import AdminHeader from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdminUser } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import TaxRuleForm from "@/components/admin/tax-rule-form";
import { createTaxRuleAction } from "@/lib/actions";

export default async function NewTaxRulePage() {
  const user = await requireAdminUser("/admin/regras-fiscais");

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader email={user.email} />
      <div className="lg:flex">
        <AdminSidebar current="regras-fiscais" />
        <section className="flex-1 p-4 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-ink">Nova Regra Fiscal</h1>
              <p className="mt-1 text-slate-600">Crie uma nova regra fiscal para NF-e.</p>
            </div>
            <Button asChild>
              <Link href="/admin/regras-fiscais">Voltar</Link>
            </Button>
          </div>

          <div className="max-w-2xl">
            <form action={createTaxRuleAction}>
              <TaxRuleForm />
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
