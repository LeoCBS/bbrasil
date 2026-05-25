import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, PackageCheck, Tag } from "lucide-react";
import { ProductVisual } from "@/components/site/product-visual";
import { AddToQuoteButton } from "@/components/site/add-to-quote-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/site/logo";
import { getProduct } from "@/lib/products";

type ProductDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Produto nao encontrado"
    };
  }

  return {
    title: `${product.name} | B.Brasil`,
    description: product.description
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container flex h-24 items-center justify-between">
          <Logo />
          <Button asChild variant="outline">
            <Link href="/produtos">
              <ArrowLeft className="h-4 w-4" /> Produtos
            </Link>
          </Button>
        </div>
      </header>

      <section className="container py-10">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="flex min-h-[430px] items-center justify-center rounded-lg bg-white p-8 shadow-soft">
            <ProductVisual name={product.name} imageSrc={product.image_src} className="h-[360px] w-full max-w-sm" />
          </div>

          <div>
            <Link href="/produtos" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-green">
              <ArrowLeft className="h-4 w-4" /> Voltar para produtos
            </Link>
            <span className="mt-6 block text-sm font-semibold text-brand-green">{product.category}</span>
            <h1 className="mt-3 text-4xl font-bold tracking-normal text-brand-ink md:text-5xl">{product.name}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">{product.description}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="shadow-soft">
                <CardContent className="p-5">
                  <Building2 className="h-6 w-6 text-brand-blue" />
                  <span className="mt-4 block text-sm text-slate-500">Empresa</span>
                  <strong className="mt-1 block text-lg text-brand-ink">{product.company}</strong>
                </CardContent>
              </Card>
              <Card className="shadow-soft">
                <CardContent className="p-5">
                  <PackageCheck className="h-6 w-6 text-brand-blue" />
                  <span className="mt-4 block text-sm text-slate-500">Volume</span>
                  <strong className="mt-1 block text-lg text-brand-ink">{product.size}</strong>
                </CardContent>
              </Card>
              <Card className="shadow-soft">
                <CardContent className="p-5">
                  <Tag className="h-6 w-6 text-brand-blue" />
                  <span className="mt-4 block text-sm text-slate-500">Categoria</span>
                  <strong className="mt-1 block text-lg text-brand-ink">{product.category}</strong>
                </CardContent>
              </Card>
              <Card className="shadow-soft">
                <CardContent className="p-5">
                  <Tag className="h-6 w-6 text-brand-blue" />
                  <span className="mt-4 block text-sm text-slate-500">Preco</span>
                  <strong className="mt-1 block text-lg text-brand-ink">
                    {product.price ? `R$ ${product.price.toFixed(2)}` : "Sob consulta"}
                  </strong>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <AddToQuoteButton
                item={{
                  id: product.id,
                  name: product.name,
                  company: product.company,
                  category: product.category,
                  size: product.size
                }}
              />
              <Button asChild variant="outline" size="lg">
                <Link href="/produtos">Ver outros produtos</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
