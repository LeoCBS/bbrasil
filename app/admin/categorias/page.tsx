import Link from "next/link";
import { ArrowLeft, ArrowRight, Trash2, Pen, Search } from "lucide-react";
import { requireAdminUser } from "@/auth";
import { getPaginatedCategories, type CategoriesPage } from "@/lib/categories";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import AdminHeader from "@/components/admin/admin-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteCategoryAction as deleteAction } from "@/lib/actions";
import { buildHref, parsePageParam } from "@/lib/pagination";

const pageSize = 10;

type Props = {
  searchParams?: Promise<{ busca?: string; page?: string }>;
};

export default async function CategoriesPage({ searchParams }: Props) {
  const user = await requireAdminUser("/admin/categorias");
  const params = await searchParams;
  const search = params?.busca?.trim();
  const page = parsePageParam(params?.page);
  const hrefFor = (target: number) => buildHref("/admin/categorias", { busca: search }, target);

  const { categories, total, totalPages } = await getPaginatedCategories({ includeInactive: true, page, pageSize, search });

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader email={user.email} />
      <div className="lg:flex">
        <AdminSidebar current="categorias" />
        <section className="flex-1 p-4 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-ink">Categorias</h1>
              <p className="mt-1 text-slate-600">Gerencie categorias do catálogo.</p>
            </div>
            <Button asChild>
              <Link href="/admin/categorias/novo">+ Nova categoria</Link>
            </Button>
          </div>

          <form className="mb-4 flex gap-3" action="/admin/categorias">
            <div className="flex-1">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input name="busca" defaultValue={search ?? ""} placeholder="Buscar categoria..." className="pl-10 h-11 w-full rounded-md border border-input bg-background px-3 text-sm" />
              </div>
            </div>
            <Button type="submit">Pesquisar</Button>
          </form>

          <Card>
            <CardContent className="p-0">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-left text-sm text-slate-600">
                    <th className="p-4">Nome</th>
                    <th className="p-4">Ordem</th>
                    <th className="p-4">Ativa</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id} className="border-t">
                      <td className="p-4">{cat.name}</td>
                      <td className="p-4">{cat.sort_order}</td>
                      <td className="p-4">{cat.active ? "Sim" : "Não"}</td>
                      <td className="p-4 text-right">
                        <Link href={`/admin/categorias/${cat.id}/edit`} className="inline-flex items-center gap-2 mr-2 text-slate-600 hover:text-brand-ink">
                          <Pen className="h-4 w-4" /> Editar
                        </Link>
                        <form action={deleteAction} className="inline-block">
                          <input type="hidden" name="id" value={cat.id} />
                          <button type="submit" className="inline-flex items-center gap-2 text-destructive">
                            <Trash2 className="h-4 w-4" /> Excluir
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {total > 0 ? (
            <nav className="mt-4 flex items-center justify-between">
              <div className="text-sm text-slate-600">Mostrando {categories.length} de {total} categorias</div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" disabled={page <= 1}>
                  <Link href={hrefFor(page - 1)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div className="px-3 py-1 border rounded-md">{page}</div>
                <Button asChild variant="outline" disabled={page >= totalPages}>
                  <Link href={hrefFor(page + 1)}>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </nav>
          ) : null}
        </section>
      </div>
    </main>
  );
}
