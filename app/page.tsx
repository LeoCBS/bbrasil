import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  ShieldPlus,
  Sparkles,
  SprayCan,
  Trash2,
  Waves
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/site/logo";
import { ProductVisual } from "@/components/site/product-visual";
import { getProducts } from "@/lib/products";
import { productCompanies } from "@/lib/companies";

const categories = [
  {
    title: "Limpeza Geral",
    description: "Produtos para limpeza diaria e manutencao de ambientes.",
    icon: SprayCan
  },
  {
    title: "Higienizacao",
    description: "Solucoes para higienizacao profunda e eficaz de superficies.",
    icon: ShieldPlus
  },
  {
    title: "Desinfeccao",
    description: "Produtos desinfetantes para ambientes seguros e protegidos.",
    icon: Sparkles
  },
  {
    title: "Equipamentos",
    description: "Equipamentos e acessorios para limpeza profissional.",
    icon: PackageCheck
  },
  {
    title: "Descartaveis",
    description: "Descartaveis de alta qualidade para seu negocio.",
    icon: Trash2
  }
];

const units = [
  {
    name: "FLORIANOPOLIS SC",
    address: ["Rua Sao Ludgero, 1580 - CEP 88117-270", "Barreiros - Sao Jose - SC"],
    phones: [{ label: "(48) 3240 0074", href: "https://wa.me/554832400074" }],
    email: "comercial@bbrasilprodutosdelimpeza.com.br"
  },
  {
    name: "JOINVILLE SC",
    address: ["Rua Rocha Pombo, 252 - CEP 89222-060", "Iririu - Joinville - SC"],
    phones: [{ label: "(47) 3026 6607", href: "https://wa.me/554730266607" }],
    email: "joinville@bbrasilprodutosdelimpeza.com.br"
  },
  {
    name: "ITAJAI SC",
    address: ["Rua Blumenau, 1520 - Bl. 05 - CEP 88305-104", "Barra do Rio - Itajai - SC"],
    phones: [{ label: "(47) 3246 0868", href: "https://wa.me/554732460868" }],
    email: "itajai@bbrasilprodutosdelimpeza.com.br"
  },
  {
    name: "BLUMENAU SC",
    address: ["Rua Fritz Spernau, 912 - CEP 89052-015", "Fortaleza - Blumenau - SC"],
    phones: [{ label: "(47) 3338 5555", href: "https://wa.me/554733385555" }],
    email: "blumenau@bbrasilprodutosdelimpeza.com.br"
  },
  {
    name: "CRICIUMA SC",
    address: ["Rua Clarinda Milioli de Luca, 595 loja 01 - CEP 88810-400", "Mina do Mato - Criciuma - SC"],
    phones: [{ label: "(48) 3413 5005", href: "https://wa.me/554834135005" }],
    email: "criciuma@bbrasilprodutosdelimpeza.com.br"
  },
  {
    name: "CURITIBA PR",
    address: ["Rua Des. Westphalen, 1642 A - CEP 80230-100", "Reboucas - Curitiba - PR"],
    phones: [
      { label: "(41) 3278 7008", href: "https://wa.me/554132787008" },
      { label: "(41) 3278 3301", href: "https://wa.me/554132783301" }
    ],
    email: "curitiba@bbrasilprodutosdelimpeza.com.br"
  },
  {
    name: "SAO PAULO SP",
    address: ["Rua Cel. Mario de Azevedo, 153 - CEP 02710-020", "Jardim Pereira Leite - Sao Paulo - SP"],
    phones: [{ label: "(11) 2679 5559", href: "https://wa.me/551126795559" }],
    email: "sp@bbrasilprodutosdelimpeza.com.br"
  }
];

type HomeProps = {
  searchParams?: Promise<{
    empresa?: string;
  }>;
};

function buildHomeCompanyHref(company?: string) {
  if (!company) {
    return "/#produtos";
  }

  const params = new URLSearchParams({ empresa: company });

  return `/?${params.toString()}#produtos`;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const selectedCompany = params?.empresa?.trim();
  const products = await getProducts({ company: selectedCompany });
  const heroProducts = products.filter((product) => product.image_src).slice(0, 3);
  const heroImageSizes = ["h-80 w-56", "h-60 w-36", "h-56 w-32"];

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <section className="overflow-hidden border-b bg-gradient-to-r from-slate-50 via-white to-slate-50">
        <div className="container grid min-h-[510px] items-center gap-10 py-12 md:grid-cols-[0.9fr_1.1fr] md:py-8">
          <div className="max-w-xl">
            <h1 className="text-5xl font-bold leading-tight tracking-normal text-brand-ink md:text-6xl">
              Higiene que <span className="block text-brand-blue">transforma</span>
              <span className="block text-brand-green">ambientes.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-slate-700">
              Solucoes profissionais em higiene e limpeza para empresas, instituicoes e profissionais exigentes.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button asChild size="lg">
                <Link href="#categorias">
                  Ver categorias <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="link" size="lg" className="px-0 text-brand-green">
                <Link href="#sobre">
                  Sobre nos <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative flex min-h-[430px] items-end justify-center">
            <div className="absolute bottom-0 right-0 h-20 w-full max-w-2xl rounded-tl-[42px] bg-[#e9dfd1]" />
            <div className="absolute right-0 top-12 h-72 w-36 rounded-full border-l-4 border-brand-green/20">
              <div className="absolute right-2 top-0 h-32 w-16 rounded-[100%_0] bg-brand-green/85 rotate-12" />
              <div className="absolute right-12 top-28 h-32 w-16 rounded-[100%_0] bg-brand-green/75 -rotate-12" />
            </div>
            <div className="relative z-10 flex items-end gap-5">
              {heroProducts.map((product, index) => (
                <ProductVisual
                  key={product.id}
                  name={product.name}
                  imageSrc={product.image_src}
                  className={heroImageSizes[index]}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="categorias" className="container py-11">
        <div className="mb-5">
          <h2 className="text-3xl font-bold tracking-normal text-brand-ink">Categorias</h2>
          <p className="mt-2 text-slate-600">Encontre a solucao ideal para sua necessidade</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category) => (
            <Card key={category.title} className="shadow-soft">
              <CardContent className="flex h-full flex-col items-center p-7 text-center">
                <category.icon className="h-14 w-14 text-brand-blue" strokeWidth={1.5} />
                <h3 className="mt-5 text-lg font-semibold text-brand-ink">{category.title}</h3>
                <p className="mt-4 min-h-20 text-sm leading-6 text-slate-600">{category.description}</p>
                <Link
                  href={{ pathname: "/produtos", query: { categoria: category.title } }}
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
              {selectedCompany
                ? `Conheca produtos em destaque da unidade ${selectedCompany}.`
                : "Conheca nossos produtos mais populares e recomendados"}
            </p>
          </div>
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              <Button asChild variant={selectedCompany ? "outline" : "secondary"} size="sm">
                <Link href={buildHomeCompanyHref()}>Todas</Link>
              </Button>
              {productCompanies.map((company) => (
                <Button key={company} asChild variant={selectedCompany === company ? "secondary" : "outline"} size="sm">
                  <Link href={buildHomeCompanyHref(company)}>{company}</Link>
                </Button>
              ))}
            </div>
            <div className="flex justify-start lg:justify-end">
              <Button asChild variant="outline">
                <Link href="/admin/produtos">Admin</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {products.slice(0, 3).map((product) => (
            <Link key={product.id} href={`/produtos/${product.id}`} className="block h-full">
              <Card className="h-full overflow-hidden shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg">
                <CardContent className="grid h-full grid-cols-[120px_1fr] gap-5 p-5">
                  <ProductVisual name={product.name} imageSrc={product.image_src} compact />
                  <div className="flex flex-col py-2">
                    <span className="text-sm font-semibold text-brand-green">{product.category}</span>
                    <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{product.company}</span>
                    <h3 className="mt-2 text-xl font-bold text-brand-ink">{product.name}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{product.description}</p>
                    <span className="mt-auto pt-4 text-sm font-semibold text-brand-blue">{product.size}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <Button asChild variant="outline">
            <Link
              href={
                selectedCompany
                  ? { pathname: "/produtos", query: { empresa: selectedCompany } }
                  : "/produtos"
              }
            >
              Ver catalogo completo <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section id="sobre" className="container py-8">
        <div className="grid gap-10 rounded-lg bg-slate-50 p-8 shadow-soft md:grid-cols-2 md:p-12">
          <div>
            <h2 className="text-3xl font-bold tracking-normal text-brand-ink">
              Sobre a <span className="text-brand-blue">B.Brasil</span>
            </h2>
            <div className="mt-4 h-0.5 w-14 bg-brand-green" />
            <p className="mt-7 leading-7 text-slate-700">
              Somos especialistas em solucoes de higiene profissional, oferecendo produtos de alta qualidade para empresas,
              instituicoes e profissionais que nao abrem mao da excelencia.
            </p>
            <p className="mt-4 leading-7 text-slate-700">
              Nosso compromisso e com a qualidade, eficiencia e sustentabilidade em tudo o que fazemos.
            </p>
            <Button className="mt-6">Saiba mais sobre nos</Button>
          </div>
          <div className="relative min-h-72 overflow-hidden rounded-lg bg-gradient-to-br from-slate-200 via-white to-slate-100">
            <div className="absolute inset-x-8 bottom-16 h-8 rounded-full bg-sky-200 blur-sm" />
            <div className="absolute left-14 top-20 h-36 w-56 rotate-[-8deg] rounded-[40%] bg-sky-300 shadow-lg" />
            <div className="absolute left-36 top-8 h-44 w-28 rotate-12 rounded-[50%_50%_35%_35%] bg-brand-green" />
            <div className="absolute bottom-0 right-0 w-60 rounded-tl-lg bg-brand-green p-6 text-white">
              <Waves className="mb-5 h-7 w-7" />
              <h3 className="font-bold">Sustentabilidade</h3>
              <p className="mt-2 text-sm leading-6">Compromisso com o meio ambiente e praticas sustentaveis.</p>
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
          <Button asChild size="lg">
            <Link href={units[0].phones[0].href}>
              <MessageCircle className="h-5 w-5" /> Fale com Florianopolis
            </Link>
          </Button>
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
                      {unit.address.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <MessageCircle className="mt-1 h-4 w-4 shrink-0 text-brand-green" />
                    <span className="flex flex-wrap gap-x-2 gap-y-1">
                      {unit.phones.map((phone, index) => (
                        <span key={phone.label} className="inline-flex items-center gap-2">
                          {index > 0 ? <span className="text-slate-400">/</span> : null}
                          <Link
                            href={phone.href}
                            className="font-semibold text-brand-green hover:text-brand-blue"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {phone.label}
                          </Link>
                        </span>
                      ))}
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
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
      <div className="container flex h-24 items-center justify-between gap-6">
        <Logo />
        <nav className="hidden items-center gap-10 text-sm font-medium md:flex">
          <Link className="border-b-2 border-brand-green pb-1 text-brand-blue" href="/">
            Inicio
          </Link>
          <Link href="#categorias">Categorias</Link>
          <Link href="#sobre">Sobre nos</Link>
          <Link href="#contato">Contato</Link>
        </nav>
        <details className="group relative hidden md:block">
          <summary className={buttonVariants({ variant: "secondary", className: "cursor-pointer list-none" })}>
            <MessageCircle className="h-5 w-5" /> Fale conosco
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
          </summary>
          <div className="absolute right-0 top-full z-40 mt-3 w-80 overflow-hidden rounded-lg border bg-white py-2 shadow-lg">
            {units.map((unit) => (
              <div key={unit.name} className="border-b px-3 py-2 last:border-b-0">
                <p className="px-2 text-xs font-bold uppercase tracking-wide text-brand-ink">Unidade {unit.name}</p>
                <div className="mt-1 grid gap-1">
                  {unit.phones.map((phone) => (
                    <Link
                      key={phone.label}
                      href={phone.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm text-slate-600 hover:bg-accent hover:text-brand-green"
                    >
                      <span>{phone.label}</span>
                      <MessageCircle className="h-4 w-4 shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}

function Footer() {
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
          <h3 className="mb-4 font-semibold">Categorias</h3>
          <div className="grid gap-2 text-sm text-slate-600">
            {categories.map((category) => (
              <span key={category.title}>{category.title}</span>
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
        </div>
      </div>
      <div className="bg-brand-blue py-5 text-center text-sm text-white">
        © 2024 B.Brasil Higiene Profissional. Todos os direitos reservados.
      </div>
    </footer>
  );
}
