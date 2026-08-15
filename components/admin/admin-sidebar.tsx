import Link from "next/link";
import { BarChart3, Boxes, Building2, FileText, LayoutDashboard, Package, Settings, ShoppingCart, Users, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Dashboard", href: "/admin/produtos", icon: LayoutDashboard, disabled: true },
  { label: "Produtos", href: "/admin/produtos", icon: Package },
  { label: "Orçamentos", href: "/admin/produtos", icon: FileText, disabled: true },
  { label: "Clientes", href: "/admin/clientes", icon: Users },
  { label: "Vendedores", href: "/admin/vendedores", icon: UserRound },
  { label: "Unidades", href: "/admin/unidades", icon: Building2 },
  { label: "Pedidos", href: "/admin/produtos", icon: ShoppingCart, disabled: true },
  { label: "Estoque", href: "/admin/produtos", icon: Boxes, disabled: true },
  { label: "Relatórios", href: "/admin/produtos", icon: BarChart3, disabled: true },
  { label: "Configurações", href: "/admin/produtos", icon: Settings, disabled: true }
];

export function AdminSidebar({ current }: { current: "produtos" | "clientes" | "vendedores" | "unidades" }) {
  return (
    <aside className="border-b bg-white lg:min-h-[calc(100vh-6rem)] lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
      <nav className="flex gap-1 overflow-x-auto p-3 lg:grid lg:gap-1 lg:p-4" aria-label="Menu administrativo">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.label.toLowerCase() === current;
          const className = cn(
            "flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors",
            active ? "bg-brand-blue text-white" : "text-slate-600 hover:bg-slate-100 hover:text-brand-ink",
            item.disabled && "cursor-default opacity-50"
          );

          return item.disabled ? (
            <span key={item.label} className={className} aria-disabled="true">
              <Icon className="h-4 w-4" /> {item.label}
            </span>
          ) : (
            <Link key={item.label} href={item.href} className={className}>
              <Icon className="h-4 w-4" /> {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
