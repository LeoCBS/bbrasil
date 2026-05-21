import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductVisual } from "@/components/site/product-visual";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/site/logo";
import { getProducts } from "@/lib/products";

export default async function ProductsPage() {
  const products = await getProducts();

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
        <h1 className="text-4xl font-bold tracking-normal text-brand-ink">Produtos</h1>
        <p className="mt-3 text-slate-600">Confira as solucoes profissionais da B.Brasil.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex justify-center">
                  <ProductVisual name={product.name} size={product.size} compact />
                </div>
                <span className="mt-5 block text-sm font-semibold text-brand-green">{product.category}</span>
                <h2 className="mt-2 text-xl font-bold text-brand-ink">{product.name}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{product.description}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="font-semibold text-brand-blue">{product.size}</span>
                  {product.price ? <span className="font-bold text-brand-ink">R$ {product.price.toFixed(2)}</span> : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
