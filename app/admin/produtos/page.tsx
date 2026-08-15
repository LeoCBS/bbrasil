import Link from "next/link";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { requireAdminUser } from "@/auth";
import { deleteProductAction } from "@/lib/actions";
import { getPaginatedProducts, type Product } from "@/lib/products";
import { getCategories } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AdminHeader from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

const pageSize = 10;

type AdminProductsPageProps = {
  searchParams?: Promise<{
    busca?: string;
    page?: string;
    categoria?: string;
  }>;
};

function parsePage(value: string | undefined) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function buildHref(page: number, search?: string, category?: string) {
  const params = new URLSearchParams();
  if (search) params.set("busca", search);
  if (category) params.set("categoria", category);
  if (page > 1) params.set("page", String(page));
  const q = params.toString();
  return q ? `/admin/produtos?${q}` : "/admin/produtos";
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const user = await requireAdminUser();
  const params = await searchParams;
  const search = params?.busca?.trim();
  const page = parsePage(params?.page);
  const category = params?.categoria;

  const categories = await getCategories({ includeInactive: true });
  const { products, total, totalPages } = await getPaginatedProducts({ includeInactive: true, page, pageSize, category: category ?? undefined, search });

  return (
    <main className="min-h-screen bg-slate-50">
      <AdminHeader email={user.email} />
      <div className="lg:flex">
        <AdminSidebar current="produtos" />
        <section className="flex-1 p-4 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-ink">Produtos</h1>
              <p className="mt-1 text-slate-600">Listagem de produtos</p>
            </div>
            <Button asChild>
              <Link href="/admin/produtos/novo">+ Novo produto</Link>
            </Button>
          </div>

          <form className="mb-4 flex gap-3" action="/admin/produtos">
            <div className="flex-1">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input name="busca" defaultValue={search ?? ""} placeholder="Buscar produto..." className="pl-10" />
              </div>
            </div>
            <select name="categoria" defaultValue={category ?? ""} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <Button type="submit">Pesquisar</Button>
          </form>

          <Card>
            <CardContent className="p-0">


<table className="w-full table-fixed border-collapse">
  <thead>
    <tr className="bg-slate-50 text-left text-sm text-slate-600">
      <th className="w-[10%] p-4 whitespace-nowrap">Cod</th>
      <th className="w-[6%] p-4 whitespace-nowrap">UN</th>
      <th className="w-[36%] p-4 whitespace-nowrap">Descrição</th>
      <th className="w-[10%] p-4 whitespace-nowrap">Estoque</th>
      <th className="w-[12%] p-4 whitespace-nowrap">VL. Custo</th>
      <th className="w-[12%] p-4 whitespace-nowrap">VL. Venda</th>
      <th className="w-[8%] p-4 text-right whitespace-nowrap">%Marg.Luc</th>
      <th className="w-[10%] p-4 text-right whitespace-nowrap">Ações</th>
    </tr>
  </thead>

  <tbody>
    {products.map((p: Product) => (
      <tr key={p.id} className="border-t">
        <td className="p-4 whitespace-nowrap overflow-hidden">
          <div className="truncate" title={p.code ?? p.id}>
            {p.code ?? p.id}
          </div>
        </td>

        <td className="p-4 whitespace-nowrap overflow-hidden">
          <div className="truncate" title={p.unit ?? p.unit_name}>
            {p.unit ?? p.unit_name.split(" ")[0] ?? "--"}
          </div>
        </td>

        <td className="p-4 overflow-hidden">
          <div
            className="truncate whitespace-nowrap overflow-hidden cursor-help"
            title={p.name}
          >
            {p.name}
          </div>
        </td>

        <td className="p-4 whitespace-nowrap">
          {typeof p.stock === 'number' ? p.stock : "-"}
        </td>

        <td className="p-4 whitespace-nowrap">
          {typeof p.cost_price === 'number' ? `R$ ${p.cost_price.toFixed(2)}` : "-"}
        </td>

        <td className="p-4 whitespace-nowrap">
          {p.price ? `R$ ${p.price.toFixed(2)}` : "-"}
        </td>

        <td className="p-4 text-right whitespace-nowrap">
          {typeof p.cost_price === 'number' && p.price ? `${(((p.price - p.cost_price) / (p.cost_price || 1)) * 100).toFixed(2)}%` : "-"}
        </td>

        <td className="p-4 text-right whitespace-nowrap">
          <Link
            href={`/admin/produtos/${p.id}/edit`}
            className="mr-3 text-slate-600 hover:text-brand-ink"
          >
            ✏️
          </Link>

          <form action={deleteProductAction} className="inline-block">
            <input type="hidden" name="id" value={p.id} />

            <button
              type="submit"
              className="text-destructive"
            >
              🗑️
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
              <div className="text-sm text-slate-600">Mostrando {products.length} de {total} produtos</div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" disabled={page <= 1}>
                  <Link href={buildHref(page - 1, search ?? undefined, category ?? undefined)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>

                {/* Numeric pagination: show a window around current page with first/last and ellipses */}
                <div className="flex items-center gap-1">
                  {(() => {
                    const pages: (number | "dots")[] = [];
                    const start = Math.max(1, page - 2);
                    const end = Math.min(totalPages, page + 2);

                    if (start > 1) {
                      pages.push(1);
                      if (start > 2) pages.push("dots");
                    }

                    for (let p = start; p <= end; p++) pages.push(p);

                    if (end < totalPages) {
                      if (end < totalPages - 1) pages.push("dots");
                      pages.push(totalPages);
                    }

                    return pages.map((p, idx) => {
                      if (p === "dots") return <span key={`dots-${idx}`} className="px-2">…</span>;
                      return (
                        <Button asChild size="sm" key={p} variant={p === page ? "default" : "ghost"}>
                          <Link href={buildHref(p as number, search ?? undefined, category ?? undefined)} className={p === page ? "font-semibold" : undefined}>{p}</Link>
                        </Button>
                      );
                    });
                  })()}
                </div>

                <Button asChild variant="outline" disabled={page >= totalPages}>
                  <Link href={buildHref(page + 1, search ?? undefined, category ?? undefined)}>
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
