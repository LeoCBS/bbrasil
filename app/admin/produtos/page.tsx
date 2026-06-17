import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Database,
  LogOut,
  PackageCheck,
  Plus,
  Save,
  Search,
  ShieldPlus,
  Sparkles,
  SprayCan,
  Trash2,
  Waves
} from "lucide-react";
import { logoutAction, requireAdminUser } from "@/auth";
import {
  createCategoryAction,
  createProductAction,
  deleteCategoryAction,
  deleteProductAction,
  updateCategoryAction,
  updateProductAction
} from "@/lib/actions";
import { getCategories, type Category } from "@/lib/categories";
import { getPaginatedProducts, type Product } from "@/lib/products";
import { productCompanies } from "@/lib/companies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/site/logo";
import { ProductVisual } from "@/components/site/product-visual";
import { ProductForm } from "@/components/product-form";

const categoryIconOptions = [
  { value: "package", label: "Pacote", icon: PackageCheck },
  { value: "spray", label: "Limpeza", icon: SprayCan },
  { value: "shield", label: "Protecao", icon: ShieldPlus },
  { value: "sparkles", label: "Brilho", icon: Sparkles },
  { value: "trash", label: "Residuos", icon: Trash2 },
  { value: "waves", label: "Panos", icon: Waves }
];
const pageSize = 5;

type AdminProductsPageProps = {
  searchParams?: Promise<{
    aba?: string;
    busca?: string;
    page?: string;
  }>;
};

function parsePage(value: string | undefined) {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function buildAdminProductsHref(page: number, search?: string, tab = "produtos") {
  const params = new URLSearchParams();

  if (tab !== "produtos") {
    params.set("aba", tab);
  }

  if (search) {
    params.set("busca", search);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query ? `/admin/produtos?${query}` : "/admin/produtos";
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const user = await requireAdminUser();
  const params = await searchParams;
  const selectedSearch = params?.busca?.trim();
  const currentPage = parsePage(params?.page);
  const selectedTab = params?.aba === "categorias" ? "categorias" : "produtos";
  const categories = await getCategories({ includeInactive: true });
  const activeCategories = categories.filter((category) => category.active);
  const { products, total, page, totalPages } = await getPaginatedProducts({
    includeInactive: true,
    search: selectedSearch,
    page: currentPage,
    pageSize
  });
  const isConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container flex h-24 items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 md:inline">{user.email}</span>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" /> Voltar ao site
              </Link>
            </Button>
            <form action={logoutAction}>
              <SubmitButton pendingLabel="Saindo..." variant="outline" className="text-destructive hover:text-destructive">
                <LogOut className="h-4 w-4" /> Sair
              </SubmitButton>
            </form>
          </div>
        </div>
      </header>

      <section className="container py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-normal text-brand-ink">Admin do catalogo</h1>
            <p className="mt-3 text-slate-600">
              Cadastre produtos e organize as categorias exibidas no site.
            </p>
            {selectedSearch ? <p className="mt-2 text-sm font-semibold text-brand-green">Busca: {selectedSearch}</p> : null}
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border bg-white px-4 py-3 text-sm text-slate-600">
            <Database className="h-4 w-4 text-brand-green" />
            {isConfigured ? "Supabase conectado" : "Modo demo: configure o Supabase para salvar"}
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-white p-5 shadow-soft">
            <span className="text-sm font-semibold text-slate-500">Produtos</span>
            <strong className="mt-2 block text-3xl text-brand-ink">{total}</strong>
            <p className="mt-1 text-sm text-slate-600">{total === 1 ? "item cadastrado" : "itens cadastrados"}</p>
          </div>
          <div className="rounded-lg border bg-white p-5 shadow-soft">
            <span className="text-sm font-semibold text-slate-500">Categorias ativas</span>
            <strong className="mt-2 block text-3xl text-brand-ink">{activeCategories.length}</strong>
            <p className="mt-1 text-sm text-slate-600">visiveis no site</p>
          </div>
          <div className="rounded-lg border bg-white p-5 shadow-soft">
            <span className="text-sm font-semibold text-slate-500">Total de categorias</span>
            <strong className="mt-2 block text-3xl text-brand-ink">{categories.length}</strong>
            <p className="mt-1 text-sm text-slate-600">incluindo inativas</p>
          </div>
        </div>

        <form className="mb-6 grid gap-3 rounded-lg border bg-white p-4 shadow-soft md:grid-cols-[1fr_auto_auto]" action="/admin/produtos">
          <input type="hidden" name="aba" value="produtos" />
          <label className="grid gap-2 text-sm font-medium text-brand-ink">
            Buscar produto
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                name="busca"
                defaultValue={selectedSearch ?? ""}
                placeholder="Titulo, descricao, categoria ou loja"
                className="pl-10"
              />
            </div>
          </label>
          <Button type="submit" className="md:self-end">
            <Search className="h-4 w-4" /> Pesquisar
          </Button>
          {selectedSearch ? (
            <Button asChild variant="outline" className="md:self-end">
              <Link href="/admin/produtos">Limpar</Link>
            </Button>
          ) : null}
        </form>

        <nav className="mb-6 grid gap-2 rounded-lg border bg-white p-2 shadow-soft sm:inline-grid sm:grid-cols-2" aria-label="Abas do admin">
          <Button asChild variant={selectedTab === "produtos" ? "secondary" : "ghost"} className="justify-start sm:justify-center">
            <Link href={buildAdminProductsHref(1, selectedSearch, "produtos")}>
              <PackageCheck className="h-4 w-4" /> Produtos
            </Link>
          </Button>
          <Button asChild variant={selectedTab === "categorias" ? "secondary" : "ghost"} className="justify-start sm:justify-center">
            <Link href="/admin/produtos?aba=categorias">
              <Sparkles className="h-4 w-4" /> Categorias
            </Link>
          </Button>
        </nav>

        {selectedTab === "produtos" ? (
          <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Novo produto</CardTitle>
                <CardDescription>Os campos alimentam a tabela products no Supabase.</CardDescription>
              </CardHeader>
              <CardContent>
                <ProductForm
                  action={createProductAction}
                  categories={categories}
                  submitLabel="Criar produto"
                  submitIcon={<Plus className="h-4 w-4" />}
                />
              </CardContent>
            </Card>

            <div className="grid gap-5">
              {products.length === 0 ? (
                <Card className="shadow-soft">
                  <CardContent className="p-8 text-center">
                    <h2 className="text-xl font-bold text-brand-ink">Nenhum produto cadastrado</h2>
                    <p className="mt-3 text-slate-600">
                      {selectedSearch ? "Nao encontramos produtos cadastrados para esta busca." : "Use o formulario ao lado para criar o primeiro produto."}
                    </p>
                  </CardContent>
                </Card>
              ) : null}
              {products.map((product) => (
                <Card key={product.id} className="shadow-soft">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <CardTitle>{product.name}</CardTitle>
                        <CardDescription>
                          {product.company} · {product.category} · {product.size} · {product.active ? "Ativo" : "Inativo"}
                        </CardDescription>
                      </div>
                      <form action={deleteProductAction}>
                        <input type="hidden" name="id" value={product.id} />
                        <SubmitButton pendingLabel="Excluindo..." variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" /> Excluir
                        </SubmitButton>
                      </form>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ProductForm
                      product={product}
                      action={updateProductAction}
                      categories={categories}
                      submitLabel="Salvar alteracoes"
                      submitIcon={<Save className="h-4 w-4" />}
                    />
                  </CardContent>
                </Card>
              ))}
              {totalPages > 1 ? (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  previousHref={buildAdminProductsHref(page - 1, selectedSearch, "produtos")}
                  nextHref={buildAdminProductsHref(page + 1, selectedSearch, "produtos")}
                />
              ) : null}
            </div>
          </div>
        ) : (
          <section id="categorias">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-normal text-brand-ink">Categorias</h2>
                <p className="mt-2 text-slate-600">Edite nome, descricao, icone, ordem e visibilidade no site.</p>
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Nova categoria</CardTitle>
                  <CardDescription>As categorias ativas aparecem na vitrine e no cadastro de produtos.</CardDescription>
                </CardHeader>
                <CardContent>
                  <CategoryForm action={createCategoryAction} submitLabel="Criar categoria" submitIcon={<Plus className="h-4 w-4" />} />
                </CardContent>
              </Card>

              <div className="grid gap-5">
                {categories.map((category) => (
                  <Card key={category.id} className="shadow-soft">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-brand-blue">
                            <CategoryIcon icon={category.icon} />
                          </span>
                          <div>
                            <CardTitle>{category.name}</CardTitle>
                            <CardDescription>
                              Ordem {category.sort_order} · {category.active ? "Ativa" : "Inativa"}
                            </CardDescription>
                          </div>
                        </div>
                        <form action={deleteCategoryAction}>
                          <input type="hidden" name="id" value={category.id} />
                          <SubmitButton pendingLabel="Excluindo..." variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" /> Excluir
                          </SubmitButton>
                        </form>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CategoryForm
                        category={category}
                        action={updateCategoryAction}
                        submitLabel="Salvar categoria"
                        submitIcon={<Save className="h-4 w-4" />}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}
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
    <nav className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Paginacao do admin de produtos">
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



function CategoryIcon({ icon }: { icon: string }) {
  const option = categoryIconOptions.find((item) => item.value === icon) ?? categoryIconOptions[0];
  const Icon = option.icon;

  return <Icon className="h-5 w-5" />;
}

function CategoryForm({
  category,
  action,
  submitLabel,
  submitIcon
}: {
  category?: Category;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  submitIcon: React.ReactNode;
}) {
  return (
    <form action={action} className="grid gap-4">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <div className="grid gap-2">
        <Label htmlFor={`category-name-${category?.id ?? "new"}`}>Nome</Label>
        <Input id={`category-name-${category?.id ?? "new"}`} name="name" defaultValue={category?.name} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`category-description-${category?.id ?? "new"}`}>Descricao</Label>
        <Textarea
          id={`category-description-${category?.id ?? "new"}`}
          name="description"
          defaultValue={category?.description}
          required
        />
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_120px]">
        <div className="grid gap-2">
          <Label htmlFor={`category-icon-${category?.id ?? "new"}`}>Icone</Label>
          <select
            id={`category-icon-${category?.id ?? "new"}`}
            name="icon"
            defaultValue={category?.icon ?? categoryIconOptions[0].value}
            className="h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {categoryIconOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`category-order-${category?.id ?? "new"}`}>Ordem</Label>
          <Input
            id={`category-order-${category?.id ?? "new"}`}
            name="sort_order"
            type="number"
            defaultValue={category?.sort_order ?? 0}
          />
        </div>
      </div>
      <label className="flex items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          name="active"
          defaultChecked={category?.active ?? true}
          className="h-4 w-4 rounded border-input accent-brand-green"
        />
        Categoria ativa
      </label>
      <SubmitButton className="w-full" pendingLabel={category ? "Salvando..." : "Criando..."}>
        {submitIcon} {submitLabel}
      </SubmitButton>
    </form>
  );
}
