import Link from "next/link";
import Image from "next/image";
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
    title: "ALTOLIM",
    description: "Linha Altolim para rotinas profissionais de limpeza.",
    icon: SprayCan
  },
  {
    title: "EQUIPAMENTOS E ACESSÓRIOS",
    description: "Equipamentos e acessorios para limpeza profissional.",
    icon: PackageCheck
  },
  {
    title: "DESCARTÁVEIS",
    description: "Descartaveis para empresas, cozinhas e ambientes de alto fluxo.",
    icon: Trash2
  },
  {
    title: "HIGIENE PESSOAL",
    description: "Itens para cuidado, assepsia e higiene pessoal.",
    icon: ShieldPlus
  },
  {
    title: "COPA/COZINHA",
    description: "Produtos para copa, cozinha e areas de preparo.",
    icon: Sparkles
  },
  {
    title: "EPI",
    description: "Equipamentos de protecao individual para operacoes seguras.",
    icon: ShieldPlus
  },
  {
    title: "LIMPEZA E HIGIENE",
    description: "Solucoes para limpeza, higienizacao e manutencao diaria.",
    icon: SprayCan
  },
  {
    title: "DISPENSER",
    description: "Dispensers e suportes para ambientes profissionais.",
    icon: PackageCheck
  },
  {
    title: "GERENCIAMENTO DE RESÍDUOS",
    description: "Produtos para descarte, coleta e gestao de residuos.",
    icon: Trash2
  },
  {
    title: "PANOS",
    description: "Panos e acessorios texteis para limpeza profissional.",
    icon: Waves
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
    address: ["Rua Gonçalves Ledo, 92 sala 02 - Centro - Criciúma SC. Cep: 88802-120"],
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

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <section className="border-b bg-slate-50 py-6">
        <div className="container">
          <details className="group relative">
            <summary className="block cursor-pointer list-none overflow-hidden rounded-lg shadow-soft outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="relative min-h-[280px] overflow-hidden md:min-h-[350px]">
                <Image
                  src="/hero-specialist.png"
                  alt="Especialista em higiene profissional pronta para atendimento"
                  fill
                  priority
                  className="object-cover"
                  sizes="(min-width: 1280px) 1180px, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/90 via-brand-green/70 to-brand-green/20" />
                <div className="relative z-10 flex min-h-[280px] max-w-2xl flex-col justify-center p-7 text-white md:min-h-[350px] md:p-12">
                  <span className="text-2xl font-semibold md:text-4xl">Fale com um</span>
                  <h1 className="mt-1 text-4xl font-bold leading-none tracking-normal md:text-6xl">
                    Especialista
                  </h1>
                  <p className="mt-4 max-w-md text-sm leading-6 text-white/90 md:text-base">
                    Conheça nosso portfólio completo de higiene profissional e escolha a loja ideal para falar agora.
                  </p>
                  <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-bold text-brand-green shadow">
                    Escolher loja <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                  </span>
                </div>
              </div>
            </summary>
            <div className="absolute left-4 right-4 top-full z-40 mt-3 grid gap-2 rounded-lg border bg-white p-3 shadow-lg md:left-auto md:w-96">
              {units.map((unit) => (
                <div key={unit.name} className="rounded-md border p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-ink">Unidade {unit.name}</p>
                  <div className="mt-2 grid gap-2">
                    {unit.phones.map((phone) => (
                      <Link
                        key={phone.label}
                        href={phone.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-brand-green hover:bg-accent hover:text-brand-blue"
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
          <Link href="#categorias">Produtos</Link>
          <Link href="#sobre">Quem somos</Link>
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
        © 2026 B.Brasil Higiene Profissional. Todos os direitos reservados.
      </div>
    </footer>
  );
}
