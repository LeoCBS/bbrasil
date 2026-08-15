import Link from "next/link";
import { BookOpen, MessageCircle, PackageSearch, Search } from "lucide-react";
import { Logo } from "@/components/site/logo";
import type { Unit } from "@/lib/units";
import { UnitSelector } from "@/components/site/unit-selector";

type SiteHeaderProps = {
  selectedUnit?: Unit;
  selectedSearch?: string;
  units: Unit[];
};

export function SiteHeader({ selectedUnit, selectedSearch, units }: SiteHeaderProps) {
  const catalogHref = selectedUnit ? `/produtos?unidade=${encodeURIComponent(selectedUnit.id)}` : "/produtos";

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container flex h-24 items-center justify-between gap-4 md:gap-6">
        <Logo />
        <form className="hidden max-w-xl flex-1 md:block" action="/produtos">
          {selectedUnit ? <input type="hidden" name="unidade" value={selectedUnit.id} /> : null}
          <label className="sr-only" htmlFor="site-search">Buscar produtos</label>
          <div className="relative">
            <input
              id="site-search"
              name="busca"
              defaultValue={selectedSearch ?? ""}
              placeholder="O que você está procurando?"
              className="h-11 w-full rounded-md border-0 bg-slate-100 px-4 pr-12 text-sm italic text-brand-ink placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
            />
            <button type="submit" aria-label="Pesquisar" className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-brand-blue transition hover:text-brand-green">
              <Search className="h-5 w-5" />
            </button>
          </div>
        </form>
        <div className="flex items-center gap-3">
          <UnitSelector selectedUnit={selectedUnit} units={units} />
          {selectedUnit?.whatsapp_number ? (
            <a
              href={`https://wa.me/${selectedUnit.whatsapp_number}`}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-2 rounded-md bg-brand-green px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-brand-greenDark lg:inline-flex"
            >
              <MessageCircle className="h-4 w-4" /> Fale conosco
            </a>
          ) : null}
        </div>
      </div>
      <nav aria-label="Navegação principal" className="bg-brand-blue text-white">
        <div className="container flex h-14 items-stretch overflow-x-auto text-sm font-semibold">
          <Link className="flex shrink-0 items-center gap-2 border-r border-white/20 px-5 transition hover:bg-brand-blueDark" href="/#sobre">
            <BookOpen className="h-4 w-4" /> Sobre nós
          </Link>
          <Link className="flex shrink-0 items-center gap-2 border-r border-white/20 px-5 transition hover:bg-brand-blueDark" href={catalogHref}>
            <PackageSearch className="h-4 w-4" /> Catálogo
          </Link>
          <Link className="flex shrink-0 items-center gap-2 px-5 transition hover:bg-brand-blueDark" href="/#contato">
            <MessageCircle className="h-4 w-4" /> Contato
          </Link>
        </div>
      </nav>
    </header>
  );
}
