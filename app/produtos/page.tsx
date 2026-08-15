import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { ProductVisual } from "@/components/site/product-visual";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPaginatedProducts } from "@/lib/products";
import { getCategories } from "@/lib/categories";
import { getUnits } from "@/lib/units";
import { SiteHeader } from "@/components/site/site-header";

const pageSize = 10;

type ProductsPageProps = {
  searchParams?: Promise<{
    categoria?: string;
    unidade?: string;
    busca?: string;
    page?: string;
  }>;
};

function parsePage(value: string | undefined) {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function buildProductsHref({
  page,
  category,
  unitId,
  search
}: {
  page: number;
  category?: string;
  unitId?: string;
  search?: string;
}) {
  const params = new URLSearchParams();

  if (category) {
    params.set("categoria", category);
  }

  if (unitId) {
    params.set("unidade", unitId);
  }

  if (search) {
    params.set("busca", search);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query ? `/produtos?${query}` : "/produtos";
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const units = await getUnits();

  const productCategoriesRaw = await getCategories();
  const productCategories = productCategoriesRaw.map((cat) => cat.name);
  const selectedCategory = params?.categoria?.trim();
  const requestedUnitId = params?.unidade?.trim();
  const storedUnitId = cookieStore.get("bbrasil_selected_unit_id")?.value;
  const selectedUnit = units.find((unit) => unit.id === requestedUnitId) ?? units.find((unit) => unit.id === storedUnitId);
  const selectedSearch = params?.busca?.trim();
  const currentPage = parsePage(params?.page);

  const { products, total, page, totalPages } = await getPaginatedProducts({
    category: selectedCategory,
    unitId: selectedUnit?.id,
    search: selectedSearch,
    page: currentPage,
    pageSize
  });
  const hasFilters = Boolean(selectedCategory || selectedSearch);

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader selectedUnit={selectedUnit} selectedSearch={selectedSearch} units={units} />
      <section className="container py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-normal text-brand-ink">
              {selectedCategory ? `Produtos de ${selectedCategory}` : "Produtos"}
            </h1>
            <p className="mt-3 text-slate-600">
              {total > 0
                ? `${total} ${total === 1 ? "produto encontrado" : "produtos encontrados"}.`
                : "Confira as solucoes profissionais da B.Brasil."}
            </p>
            {selectedUnit ? <p className="mt-2 text-sm font-semibold text-brand-green">Unidade: {selectedUnit.name}</p> : null}
            {selectedSearch ? <p className="mt-2 text-sm font-semibold text-brand-green">Busca: {selectedSearch}</p> : null}
          </div>
          {hasFilters ? (
            <Button asChild variant="outline">
              <Link href={buildProductsHref({ page: 1, unitId: selectedUnit?.id })}>Limpar filtros</Link>
            </Button>
          ) : null}
        </div>
        <form className="mt-6 grid gap-4 rounded-lg border bg-white p-4 shadow-soft md:grid-cols-[1.2fr_1fr_auto] md:items-end" action="/produtos">
          {selectedUnit ? <input type="hidden" name="unidade" value={selectedUnit.id} /> : null}
          <label className="grid gap-2 text-sm font-medium text-brand-ink">
            Buscar produto
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="busca"
                defaultValue={selectedSearch ?? ""}
                placeholder="Titulo, descricao, categoria ou loja"
                className="h-11 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm font-normal text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </label>
          <label className="grid gap-2 text-sm font-medium text-brand-ink">
            Categorias
            <select
              key={selectedCategory}
              name="categoria"
              defaultValue={selectedCategory ?? ""}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm font-normal text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todas as categorias</option>
              {productCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit">
            <Search className="h-4 w-4" /> Filtrar produtos
          </Button>
        </form>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {products.map((product) => (
            <Link key={product.id} href={`/produtos/${product.id}`} className="block h-full">
              <Card id={product.id} className="h-full scroll-mt-28 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg">
                <CardContent className="flex h-full flex-col p-6">
                  <div className="flex justify-center">
                    <ProductVisual name={product.name} imageSrc={product.image_url} compact />
                  </div>
                  <span className="mt-5 block text-sm font-semibold text-brand-green">{product.category}</span>
                  <span className="mt-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">{product.unit_name}</span>
                  <h2 className="mt-2 text-xl font-bold text-brand-ink">{product.name}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{product.description}</p>
                  <div className="mt-auto flex items-center justify-between pt-5">
                    <span className="font-semibold text-brand-blue">{product.size}</span>
                    {product.price ? <span className="font-bold text-brand-ink">R$ {product.price.toFixed(2)}</span> : null}
                  </div>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-green">
                    Ver detalhes <ArrowRight className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        {products.length === 0 ? (
          <div className="mt-8 rounded-lg border bg-white p-8 text-center shadow-soft">
            <h2 className="text-xl font-bold text-brand-ink">Nenhum produto encontrado</h2>
            <p className="mt-3 text-slate-600">Nao encontramos produtos cadastrados para esta busca.</p>
            <Button asChild className="mt-6">
              <Link href={buildProductsHref({ page: 1, unitId: selectedUnit?.id })}>Limpar filtros</Link>
            </Button>
          </div>
        ) : null}
        {totalPages > 1 ? (
          <Pagination
            page={page}
            totalPages={totalPages}
            previousHref={buildProductsHref({ page: page - 1, category: selectedCategory, unitId: selectedUnit?.id, search: selectedSearch })}
            nextHref={buildProductsHref({ page: page + 1, category: selectedCategory, unitId: selectedUnit?.id, search: selectedSearch })}
          />
        ) : null}
      </section>
    </main>
  );
}

function Pagination({
  page,
  totalPages,
  previousHref,
  nextHref
}: {
  page: number;
  totalPages: number;
  previousHref: string;
  nextHref: string;
}) {
  return (
    <nav className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Paginacao de produtos">
      <span className="text-sm text-slate-600">
        Pagina {page} de {totalPages}
      </span>
      <div className="flex gap-3">
        {page > 1 ? (
          <Button asChild variant="outline">
            <Link href={previousHref}>
              <ArrowLeft className="h-4 w-4" /> Anterior
            </Link>
          </Button>
        ) : (
          <Button variant="outline" disabled>
            <ArrowLeft className="h-4 w-4" /> Anterior
          </Button>
        )}
        {page < totalPages ? (
          <Button asChild>
            <Link href={nextHref}>
              Proxima <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button disabled>
            Proxima <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </nav>
  );
}
