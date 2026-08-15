import Link from "next/link";
import { cookies } from "next/headers";
import {
  ArrowRight,
  Mail,
  MapPin,
  MessageCircle,
  Instagram,
  PackageCheck,
  ShieldPlus,
  Sparkles,
  SprayCan,
  Search,
  Trash2,
  Waves
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/site/logo";
import { ProductVisual } from "@/components/site/product-visual";
import { getCategories, type Category } from "@/lib/categories";
import { getProducts } from "@/lib/products";
import { HeroCarousel } from "@/components/site/hero-carousel";
import { SiteHeader } from "@/components/site/site-header";
import { getUnits } from "@/lib/units";

const categoryIcons = {
  package: PackageCheck,
  spray: SprayCan,
  shield: ShieldPlus,
  sparkles: Sparkles,
  trash: Trash2,
  waves: Waves
};

type HomeProps = {
  searchParams?: Promise<{
    unidade?: string;
    busca?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const units = await getUnits();
  const requestedUnitId = params?.unidade?.trim();
  const storedUnitId = cookieStore.get("bbrasil_selected_unit_id")?.value;
  const selectedUnit = units.find((unit) => unit.id === requestedUnitId) ?? units.find((unit) => unit.id === storedUnitId);
  const selectedSearch = params?.busca?.trim();
  const categories = await getCategories();
  const products = await getProducts({ unitId: selectedUnit?.id, search: selectedSearch });

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader selectedUnit={selectedUnit} selectedSearch={selectedSearch} units={units} />
      <HeroCarousel selectedUnit={selectedUnit} units={units} />

      <section id="categorias" className="container py-11">
        <div className="mb-5">
          <h2 className="text-3xl font-bold tracking-normal text-brand-ink">Categorias</h2>
          <p className="mt-2 text-slate-600">Encontre a solucao ideal para sua necessidade</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category) => (
            <Card key={category.id} className="shadow-soft">
              <CardContent className="flex h-full flex-col items-center p-7 text-center">
                <CategoryIcon icon={category.icon} className="h-14 w-14 text-brand-blue" />
                <h3 className="mt-5 text-lg font-semibold text-brand-ink">{category.name}</h3>
                <p className="mt-4 min-h-20 text-sm leading-6 text-slate-600">{category.description}</p>
                <Link
                  href={{ pathname: "/produtos", query: { categoria: category.name, ...(selectedUnit ? { unidade: selectedUnit.id } : {}) } }}
                  className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-semibold text-brand-green"
                >
                  Ver produtos <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="produtos" className="container pb-8">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-normal text-brand-ink">Produtos em destaque</h2>
            <p className="mt-2 text-slate-600">
              {selectedSearch
                ? `Resultados para "${selectedSearch}".`
                : selectedUnit
                ? `Conheca produtos em destaque da unidade ${selectedUnit.name}.`
                : "Conheca nossos produtos mais populares e recomendados"}
            </p>
          </div>
          <div className="flex justify-start lg:justify-end">
            <Button asChild variant="outline">
              <Link href="/admin">Admin</Link>
            </Button>
          </div>
        </div>
        <form className="mb-6 grid gap-3 rounded-lg border bg-white p-4 shadow-soft md:grid-cols-[1fr_auto]" action="/#produtos">
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
          <Button type="submit" className="md:self-end">
            <Search className="h-4 w-4" /> Pesquisar
          </Button>
        </form>
        <div className="grid gap-5 md:grid-cols-3">
          {products.slice(0, 3).map((product) => (
            <Link key={product.id} href={`/produtos/${product.id}`} className="block h-full">
              <Card className="h-full overflow-hidden shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg">
                <CardContent className="grid h-full grid-cols-[120px_1fr] gap-5 p-5">
                  <ProductVisual name={product.name} imageSrc={product.image_url} compact />
                  <div className="flex flex-col py-2">
                    <span className="text-sm font-semibold text-brand-green">{product.category}</span>
                    <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{product.unit_name}</span>
                    <h3 className="mt-2 text-xl font-bold text-brand-ink">{product.name}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {product.description && product.description.length > 150 ? (
                        <>
                          {product.description.substring(0, 150)}...{' '}
                          <span className="font-semibold text-brand-blue">leia mais</span>
                        </>
                      ) : (
                        product.description
                      )}
                    </p>
                    <span className="mt-auto pt-4 text-sm font-semibold text-brand-blue">{product.size}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        {products.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center shadow-soft">
            <h3 className="text-xl font-bold text-brand-ink">Nenhum produto encontrado</h3>
            <p className="mt-3 text-slate-600">Tente buscar por outro titulo, descricao, categoria ou loja.</p>
          </div>
        ) : null}
        <div className="mt-5 flex justify-end">
          <Button asChild variant="outline">
            <Link
              href={
                selectedUnit || selectedSearch
                  ? { pathname: "/produtos", query: { ...(selectedUnit ? { unidade: selectedUnit.id } : {}), ...(selectedSearch ? { busca: selectedSearch } : {}) } }
                  : "/produtos"
              }
            >
              Ver catalogo completo <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section id="sobre" className="container py-8">
        <div className="grid gap-10 rounded-lg bg-slate-50 p-8 shadow-soft lg:grid-cols-[1.08fr_0.92fr] lg:items-start lg:p-12">
          <div>
            <h2 className="text-3xl font-bold tracking-normal text-brand-ink">
              Sobre a <span className="text-brand-blue">B.Brasil</span>
            </h2>
            <div className="mt-4 h-0.5 w-14 bg-brand-green" />
            <p className="mt-7 leading-7 text-slate-700">
              Há quase quatro décadas, nossa empresa atua com excelência no segmento de higiene profissional, oferecendo soluções completas para empresas que valorizam qualidade, segurança e bem-estar. Presente nos estados de Santa Catarina, São Paulo e Paraná, consolidamos nossa trajetória como uma das líderes do mercado brasileiro, reconhecida pela confiança, inovação e compromisso com cada cliente.
            </p>
            <p className="mt-7 leading-7 text-slate-700">
              Mais do que fornecer produtos, entregamos cuidado. Nosso portfólio reúne soluções de alta qualidade para higiene, limpeza e conservação de ambientes, atendendo diferentes segmentos com eficiência e responsabilidade. Cada produto é selecionado para garantir desempenho, segurança e resultados que fazem a diferença no dia a dia.
            </p>
            <p className="mt-7 leading-7 text-slate-700">
              Nosso reconhecimento é resultado de um trabalho construído com dedicação, atendimento próximo e foco constante na satisfação dos clientes. Acreditamos que ambientes saudáveis promovem mais qualidade de vida, produtividade e bem-estar para as pessoas.
            </p>
            <p className="mt-7 leading-7 text-slate-700">
              Com tradição, experiência e olhar voltado para o futuro, seguimos expandindo nossa atuação e fortalecendo nossa missão: cuidar de pessoas e contribuir para ambientes mais limpos, seguros e saudáveis em todo o Brasil.
            </p>
          </div>
          <div className="relative min-h-[440px] overflow-hidden rounded-lg bg-gradient-to-br from-white via-sky-50 to-slate-100 p-7 shadow-soft lg:sticky lg:top-32 lg:self-start">
            <div className="absolute left-8 top-8 h-36 w-48 rotate-[-8deg] rounded-[40%] bg-sky-300 shadow-lg" />
            <div className="absolute left-36 top-0 h-44 w-28 rotate-12 rounded-[50%_50%_35%_35%] bg-brand-green" />
            <div className="absolute inset-x-10 bottom-28 h-8 rounded-full bg-sky-200 blur-sm" />
            <div className="relative z-10 flex h-full min-h-[386px] flex-col justify-between">
              <div className="ml-auto max-w-52 rounded-lg bg-white/90 p-5 shadow-soft">
                <span className="block text-4xl font-bold text-brand-blue">40</span>
                <span className="mt-1 block text-sm font-semibold text-brand-ink">anos de trajetória</span>
                <p className="mt-3 text-sm leading-6 text-slate-600">Atuação consolidada em higiene profissional no Sul e Sudeste.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="rounded-lg bg-brand-blue p-5 text-white shadow-soft">
                  <PackageCheck className="mb-4 h-6 w-6" />
                  <h3 className="font-bold">Portfólio completo</h3>
                  <p className="mt-2 text-sm leading-6 text-white/90">Soluções para diferentes segmentos e rotinas profissionais.</p>
                </div>
                <div className="rounded-lg bg-brand-green p-5 text-white shadow-soft">
                  <Waves className="mb-4 h-6 w-6" />
                  <h3 className="font-bold">Sustentabilidade</h3>
                  <p className="mt-2 text-sm leading-6 text-white/90">Compromisso com o meio ambiente e praticas sustentaveis.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contato" className="container py-8">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-normal text-brand-ink">Unidades B.Brasil</h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Encontre a unidade mais proxima para atendimento comercial, pedidos e suporte.
            </p>
          </div>
          
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {units.map((unit) => (
            <Card key={unit.name} className="h-full shadow-soft">
              <CardContent className="flex h-full flex-col p-6">
                <h3 className="text-lg font-bold text-brand-ink">Unidade {unit.name}</h3>
                <div className="mt-5 grid gap-4 text-sm leading-6 text-slate-600">
                  <div className="flex gap-3">
                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-brand-blue" />
                    <span>
                      {unit.address.split("\n").map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <MessageCircle className="mt-1 h-4 w-4 shrink-0 text-brand-green" />
                    <span className="flex flex-wrap gap-x-2 gap-y-1">
                      {unit.phone ? <a target="_blank" rel="noreferrer" href={`https://wa.me/${unit.whatsapp_number}`} className="font-semibold text-brand-green hover:text-brand-blue">{unit.phone}</a> : "—"}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <Mail className="mt-1 h-4 w-4 shrink-0 text-brand-blue" />
                    <Link href={`mailto:${unit.email}`} className="break-all font-medium text-slate-700 hover:text-brand-blue">
                      {unit.email}
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <Footer categories={categories} />
    </main>
  );
}

function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = categoryIcons[icon as keyof typeof categoryIcons] ?? PackageCheck;

  return <Icon className={className} strokeWidth={1.5} />;
}

function Footer({ categories }: { categories: Category[] }) {
  return (
    <footer className="mt-6 border-t">
      <div className="container grid gap-9 py-10 md:grid-cols-4">
        <Logo />
        <div>
          <h3 className="mb-4 font-semibold">Navegacao</h3>
          <div className="grid gap-2 text-sm text-slate-600">
            <Link href="/">Inicio</Link>
            <Link href="#categorias">Categorias</Link>
            <Link href="#sobre">Sobre nos</Link>
            <Link href="#contato">Contato</Link>
          </div>
        </div>
        <div>
          <h3 className="mb-4 font-semibold">Siga a B.Brasil</h3>
          <Link
            href="https://www.instagram.com/b.brasilhigieneprofissional/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 text-sm text-slate-600 transition hover:text-brand-green"
          >
            <Instagram className="h-5 w-5" /> Instagram
          </Link>
        </div>
        {/*
        <div>
          <h3 className="mb-4 font-semibold">Categorias</h3>
          <div className="grid gap-2 text-sm text-slate-600">
            {categories.map((category) => (
              <span key={category.id}>{category.name}</span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-4 font-semibold">Contato</h3>
          <div className="grid gap-3 text-sm text-slate-600">
            <Link href={units[0].phones[0].href} className="flex items-center gap-3 hover:text-brand-blue">
              <MessageCircle className="h-4 w-4" /> {units[0].phones[0].label}
            </Link>
            <Link href={`mailto:${units[0].email}`} className="flex items-center gap-3 break-all hover:text-brand-blue">
              <Mail className="h-4 w-4 shrink-0" /> {units[0].email}
            </Link>
            <Link href="#contato" className="flex items-center gap-3 hover:text-brand-blue">
              <MapPin className="h-4 w-4" /> Ver todas as unidades
            </Link>
          </div>
        </div>*/}
      </div>
      <div className="bg-brand-blue py-5 text-center text-sm text-white">
        © 2026 B.Brasil Higiene Profissional. Todos os direitos reservados.
      </div>
    </footer>
  );
}
