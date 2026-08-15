import AdminHeader from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdminUser } from "@/auth";
import { getCategories } from "@/lib/categories";
import { getUnits } from "@/lib/units";
import { createProductAction } from "@/lib/actions";
import { ProductForm } from "@/components/product-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewProductPage() {
  const user = await requireAdminUser("/admin/produtos");
  const categories = await getCategories({ includeInactive: true });
  const units = await getUnits();

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader email={user.email} />
      <div className="lg:flex">
        <AdminSidebar current="produtos" />
        <section className="flex-1 p-4 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-ink">Novo produto</h1>
              <p className="mt-1 text-slate-600">Crie um novo produto para o catálogo.</p>
            </div>
            <Button asChild>
              <Link href="/admin/produtos">Voltar</Link>
            </Button>
          </div>

          <div className="max-w-3xl">
            <ProductForm categories={categories} units={units} submitLabel="Criar produto" submitIcon={<></>} action={createProductAction} />
          </div>
        </section>
      </div>
    </main>
  );
}
