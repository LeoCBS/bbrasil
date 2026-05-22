import Link from "next/link";
import { ArrowLeft, Database, Plus, Save, Trash2 } from "lucide-react";
import { createProductAction, deleteProductAction, updateProductAction } from "@/lib/actions";
import { getProducts, type Product } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/site/logo";
import { ProductVisual } from "@/components/site/product-visual";

const categories = ["Limpeza Geral", "Higienizacao", "Desinfeccao", "Equipamentos", "Descartaveis"];

export default async function AdminProductsPage() {
  const products = await getProducts({ includeInactive: true });
  const isConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container flex h-24 items-center justify-between">
          <Logo />
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" /> Voltar ao site
            </Link>
          </Button>
        </div>
      </header>

      <section className="container py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-normal text-brand-ink">Admin de produtos</h1>
            <p className="mt-3 text-slate-600">Cadastre, edite e remova produtos exibidos no catalogo.</p>
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
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" /> Excluir
                      </Button>
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
          </div>
        </div>
      </section>
    </main>
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
      <Button className="w-full" type="submit">
        {submitIcon} {submitLabel}
      </Button>
    </form>
  );
}
