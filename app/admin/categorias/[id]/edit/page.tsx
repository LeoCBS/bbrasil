import AdminHeader from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdminUser } from "@/auth";
import { getCategories } from "@/lib/categories";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CategoryForm from "@/components/admin/category-form";
import { updateCategoryAction } from "@/lib/actions";

export default async function EditCategoryPage({ params }: { params: { id: string } }) {
  const user = await requireAdminUser("/admin/categorias");
  const categories = await getCategories({ includeInactive: true });
  const category = categories.find((c) => c.id === params.id);

  if (!category) {
    return <div className="p-8">Categoria não encontrada.</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader email={user.email} />
      <div className="lg:flex">
        <AdminSidebar current="categorias" />
        <section className="flex-1 p-4 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-ink">Editar categoria</h1>
              <p className="mt-1 text-slate-600">Edite a categoria selecionada.</p>
            </div>
            <Button asChild>
              <Link href="/admin/categorias">Voltar</Link>
            </Button>
          </div>

          <div className="max-w-2xl">
            <form action={updateCategoryAction}>
              <CategoryForm category={category} />
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
