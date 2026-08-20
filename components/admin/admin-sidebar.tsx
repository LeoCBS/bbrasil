import Link from "next/link";
import { BarChart3, Boxes, Building2, FileText, Package, Settings, ShoppingCart, Users, UserRound, Sparkles, DollarSign, MapPin, Calendar, History, ClipboardCheck, FileBarChart } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  {
    title: "Navegação",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: BarChart3, disabled: false },
      { label: "Produtos", href: "/admin/produtos", icon: Package ,disabled: false},
  { label: "Categorias", href: "/admin/categorias", icon: Sparkles ,disabled: false},
  { label: "Clientes", href: "/admin/clientes", icon: Users ,disabled: false},
  { label: "Unidades", href: "/admin/unidades", icon: Building2 ,disabled: false},
  { label: "Usuários", href: "/admin/usuarios", icon: UserRound ,disabled: false}
    ]
  },
  {
    title: "Logística",
    items: [
      { label: "Roteiro do Dia", href: "/admin/logistica", icon: MapPin, disabled: false },
      { label: "Visitas", href: "/admin/logistica/visitas", icon: Calendar, disabled: true },
      { label: "Check-ins", href: "/admin/logistica/checkins", icon: ClipboardCheck, disabled: true },
      { label: "Histórico", href: "/admin/logistica/historico", icon: History, disabled: true },
      { label: "Relatórios", href: "/admin/logistica/relatorios", icon: FileBarChart, disabled: true }
    ]
  },
  {
    title: "Operações",
    items: [
      { label: "Orçamentos", href: "/admin/orcamentos", icon: FileText, disabled: false },
      { label: "Pedidos", href: "/admin/pedidos", icon: ShoppingCart, disabled: false },
      { label: "Estoque", href: "/admin/produtos", icon: Boxes, disabled: true }
    ]
  },
  {
    title: "Financeiro",
    items: [
      { label: "Contas a Receber", href: "/admin/contas-receber", icon: DollarSign, disabled: false },
      { label: "Contas a Pagar", href: "/admin/contas-pagar", icon: DollarSign, disabled: false }
    ]
  },
  {
    title: "Relatórios",
    items: [
      { label: "Relatórios", href: "/admin/produtos", icon: BarChart3, disabled: true }
    ]
  }
];

const footerItems = [
  { label: "Configurações", href: "/admin/produtos", icon: Settings, disabled: true }
];

export function AdminSidebar({ current }: { current: "dashboard" | "produtos" | "clientes" | "unidades" | "categorias" | "usuarios" | "pedidos" | "orcamentos" | "contas-receber" | "contas-pagar" | "logistica" }) {
  return (
    <aside className="p-4 lg:w-64 lg:shrink-0">
      <div className="rounded-lg border bg-white p-3">
        <nav aria-label="Menu administrativo" className="flex flex-col gap-4">
          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="mb-2 px-2 text-xs font-bold uppercase text-slate-400">{section.title}</h4>
              <div className="grid gap-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const itemPath = item.href.replace("/admin/", "");
                  const active = current === itemPath || (current === "logistica" && item.href === "/admin/logistica");
                  const className = cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                    active ? "bg-brand-blue text-white" : "text-slate-600 hover:bg-slate-50 hover:text-brand-ink",
                    item.disabled && "cursor-default opacity-50"
                  );

                  return item.disabled ? (
                    <div key={item.label} className={className} aria-disabled="true">
                      <Icon className="h-4 w-4" /> <span>{item.label}</span>
                    </div>
                  ) : (
                    <Link key={item.label} href={item.href} className={className}>
                      <Icon className="h-4 w-4" /> <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="border-t pt-3">
            {footerItems.map((item) => {
              const Icon = item.icon;
              const className = cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-brand-ink",
                item.disabled && "cursor-default opacity-50"
              );

              return item.disabled ? (
                <div key={item.label} className={className} aria-disabled="true">
                  <Icon className="h-4 w-4" /> <span>{item.label}</span>
                </div>
              ) : (
                <Link key={item.label} href={item.href} className={className}>
                  <Icon className="h-4 w-4" /> <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </aside>
  );
}
