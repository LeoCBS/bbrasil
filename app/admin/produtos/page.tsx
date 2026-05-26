import Link from "next/link";
import { ArrowLeft, ArrowRight, Database, LogOut, Plus, Save, Trash2 } from "lucide-react";
import { logoutAction, requireAdminUser } from "@/auth";
import { createProductAction, deleteProductAction, updateProductAction } from "@/lib/actions";
import { getPaginatedProducts, type Product } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/site/logo";
import { ProductVisual } from "@/components/site/product-visual";

const categories = ["Limpeza Geral", "Higienizacao", "Desinfeccao", "Equipamentos", "Descartaveis"];
const pageSize = 5;

type AdminProductsPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

function parsePage(value: string | undefined) {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function buildAdminProductsHref(page: number) {
  return page > 1 ? `/admin/produtos?page=${page}` : "/admin/produtos";
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const user = await requireAdminUser();
  const params = await searchParams;
  const currentPage = parsePage(params?.page);
  const { products, total, page, totalPages } = await getPaginatedProducts({
    includeInactive: true,
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
            <h1 className="text-4xl font-bold tracking-normal text-brand-ink">Admin de produtos</h1>
            <p className="mt-3 text-slate-600">
              Cadastre, edite e remova produtos exibidos no catalogo. {total} {total === 1 ? "produto cadastrado" : "produtos cadastrados"}.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border bg-white px-4 py-3 text-sm text-slate-600">
            <Database className="h-4 w-4 text-brand-green" />
            {isConfigured ? "Supabase conectado" : "Modo demo: configure o Supabase para salvar"}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Novo produto</CardTitle>
              <CardDescription>Os campos alimentam a tabela `products` no Supabase.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductForm action={createProductAction} submitLabel="Criar produto" submitIcon={<Plus className="h-4 w-4" />} />
            </CardContent>
          </Card>

          <div className="grid gap-5">
            {products.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="p-8 text-center">
                  <h2 className="text-xl font-bold text-brand-ink">Nenhum produto cadastrado</h2>
                  <p className="mt-3 text-slate-600">Use o formulario ao lado para criar o primeiro produto.</p>
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
                        {product.category} · {product.size} · {product.active ? "Ativo" : "Inativo"}
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
                previousHref={buildAdminProductsHref(page - 1)}
                nextHref={buildAdminProductsHref(page + 1)}
              />
            ) : null}
          </div>
        </div>
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

function ProductForm({
  product,
  action,
  submitLabel,
  submitIcon
}: {
  product?: Product;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  submitIcon: React.ReactNode;
}) {
  return (
    <form action={action} encType="multipart/form-data" className="grid gap-4">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <div className="grid gap-2">
        <Label htmlFor={`name-${product?.id ?? "new"}`}>Nome</Label>
        <Input id={`name-${product?.id ?? "new"}`} name="name" defaultValue={product?.name} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`category-${product?.id ?? "new"}`}>Categoria</Label>
        <select
          id={`category-${product?.id ?? "new"}`}
          name="category"
          defaultValue={product?.category ?? categories[0]}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`description-${product?.id ?? "new"}`}>Descricao</Label>
        <Textarea id={`description-${product?.id ?? "new"}`} name="description" defaultValue={product?.description} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor={`size-${product?.id ?? "new"}`}>Volume</Label>
          <Input id={`size-${product?.id ?? "new"}`} name="size" defaultValue={product?.size} placeholder="5L" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`price-${product?.id ?? "new"}`}>Preco</Label>
          <Input
            id={`price-${product?.id ?? "new"}`}
            name="price"
            type="number"
            step="0.01"
            defaultValue={product?.price ?? ""}
            placeholder="0.00"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`image-${product?.id ?? "new"}`}>Imagem do produto</Label>
        {product?.image_src ? (
          <div className="flex justify-center rounded-md border border-dashed bg-white p-3">
            <ProductVisual name={product.name} imageSrc={product.image_src} compact />
          </div>
        ) : null}
        <Input id={`image-${product?.id ?? "new"}`} name="image_blob" type="file" accept="image/*" />
      </div>
      <label className="flex items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          name="active"
          defaultChecked={product?.active ?? true}
          className="h-4 w-4 rounded border-input accent-brand-green"
        />
        Produto ativo
      </label>
      <SubmitButton className="w-full" pendingLabel={product ? "Salvando..." : "Criando..."}>
        {submitIcon} {submitLabel}
      </SubmitButton>
    </form>
  );
}
