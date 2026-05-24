import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProductVisual } from "@/components/site/product-visual";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/site/logo";
import { getProducts } from "@/lib/products";

type ProductsPageProps = {
  searchParams?: Promise<{
    categoria?: string;
    category?: string;
  }>;
};

function normalizeCategory(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const selectedCategory = params?.categoria ?? params?.category ?? "";
  const products = await getProducts();
  const filteredProducts = selectedCategory
    ? products.filter((product) => normalizeCategory(product.category) === normalizeCategory(selectedCategory))
    : products;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container flex h-24 items-center justify-between">
          <Logo />
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </Button>
        </div>
      </header>
      <section className="container py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-normal text-brand-ink">
              {selectedCategory ? `Produtos de ${selectedCategory}` : "Produtos"}
            </h1>
            <p className="mt-3 text-slate-600">Confira as solucoes profissionais da B.Brasil.</p>
          </div>
          {selectedCategory ? (
            <Button asChild variant="outline">
              <Link href="/produtos">Ver todos</Link>
            </Button>
          ) : null}
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {filteredProducts.map((product) => (
            <Link key={product.id} href={`/produtos/${product.id}`} className="block h-full">
              <Card id={product.id} className="h-full scroll-mt-28 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg">
                <CardContent className="flex h-full flex-col p-6">
                  <div className="flex justify-center">
                    <ProductVisual name={product.name} imageSrc={product.image_src} compact />
                  </div>
                  <span className="mt-5 block text-sm font-semibold text-brand-green">{product.category}</span>
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
        {filteredProducts.length === 0 ? (
          <div className="mt-8 rounded-lg border bg-white p-8 text-center shadow-soft">
            <h2 className="text-xl font-bold text-brand-ink">Nenhum produto encontrado</h2>
            <p className="mt-3 text-slate-600">Nao encontramos produtos cadastrados para esta categoria.</p>
            <Button asChild className="mt-6">
              <Link href="/produtos">Ver todos os produtos</Link>
            </Button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
