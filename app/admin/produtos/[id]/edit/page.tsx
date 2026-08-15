import AdminHeader from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdminUser } from "@/auth";
import { getProduct } from "@/lib/products";
import { getCategories } from "@/lib/categories";
import { getUnits } from "@/lib/units";
import { updateProductAction } from "@/lib/actions";
import { ProductForm } from "@/components/product-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser("/admin/produtos");

  const { id } = await params;

  const [product, categories, units] = await Promise.all([
    getProduct(id, { includeInactive: true }),
    getCategories({ includeInactive: true }),
    getUnits(),
  ]);

  if (!product) {
    return <div className="p-8">Produto não encontrado.</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader email={user.email} />
      <div className="lg:flex">
        <AdminSidebar current="produtos" />
        <section className="flex-1 p-4 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-ink">Editar produto</h1>
              <p className="mt-1 text-slate-600">Edite o produto selecionado.</p>
            </div>
            <Button asChild>
              <Link href="/admin/produtos">Voltar</Link>
            </Button>
          </div>

          <div className="max-w-3xl">
            <ProductForm product={product} action={updateProductAction} categories={categories} units={units} submitLabel="Salvar" submitIcon={<></>} />
          </div>
        </section>
      </div>
    </main>
  );
}
