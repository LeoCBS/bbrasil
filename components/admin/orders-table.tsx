"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Eye, Pencil } from "lucide-react";
import type { Order } from "@/lib/orders";
import { formatCurrency } from "@/lib/format";
import { DeleteOrderButton } from "@/components/admin/delete-order-button";
import { EmitNFeButton } from "@/components/admin/emit-nfe-button";

const headers = ["ID", "Cliente", "CNPJ", "Vendedor", "Unidade", "Total", "Status", "Atualizado em", "Ações"];
const initialWidths = [6, 18, 13, 16, 14, 9, 10, 14, 13];

export function OrdersTable({ orders }: { orders: Order[] }) {
  const [widths, setWidths] = useState(initialWidths);

  function startResize(index: number, event: React.PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = widths[index];
    const nextWidth = widths[index + 1];
    const table = event.currentTarget.closest("table");
    const tableWidth = table?.getBoundingClientRect().width || 1;
    const onMove = (moveEvent: PointerEvent) => {
      const delta = ((moveEvent.clientX - startX) / tableWidth) * 100;
      const adjusted = Math.max(4, Math.min(startWidth + nextWidth - 4, startWidth + delta));
      setWidths((current) => current.map((width, i) => i === index ? adjusted : i === index + 1 ? startWidth + nextWidth - adjusted : width));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <table className="w-full min-w-[1120px] table-fixed border-collapse">
      <colgroup>{widths.map((width, i) => <col key={headers[i]} style={{ width: `${(width / widths.reduce((sum, value) => sum + value, 0)) * 100}%` }} />)}</colgroup>
      <thead>
        <tr className="bg-slate-50 text-left text-sm text-slate-600">
          {headers.map((header, i) => (
            <th key={header} className={`relative p-3 whitespace-nowrap ${i === 8 ? "text-right" : ""}`}>
              {header}
              {i < headers.length - 1 && <button type="button" aria-label={`Redimensionar coluna ${header}`} title="Arraste para ajustar a largura" onPointerDown={(event) => startResize(i, event)} className="absolute right-0 top-1/2 z-10 h-7 w-2 -translate-y-1/2 cursor-col-resize touch-none border-r-2 border-slate-300 hover:border-blue-500" />}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id} className="border-t">
            <td className="p-3 whitespace-nowrap">#{order.id}</td>
            <td className="overflow-hidden p-3"><div className="truncate whitespace-nowrap" title={order.client_name}>{order.client_name}</div></td>
            <td className="p-3 whitespace-nowrap">{order.client_cnpj}</td>
            <td className="overflow-hidden p-3"><div className="truncate whitespace-nowrap" title={order.client_salesperson_name || order.user_name || "-"}>{order.client_salesperson_name || order.user_name || "-"}</div></td>
            <td className="p-3 whitespace-nowrap">{order.unit_name}</td>
            <td className="p-3 whitespace-nowrap">{formatCurrency(order.total_amount)}</td>
            <td className="p-3 whitespace-nowrap"><span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${order.status === "finalized" ? "bg-green-100 text-green-800" : order.status === "nfeerror" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700"}`}>{order.status === "finalized" ? "Finalizado" : order.status === "nfeerror" ? "Erro na NF-e" : "Pendente"}</span></td>
            <td className="p-3 whitespace-nowrap text-sm text-slate-600">{order.updated_at ? new Date(order.updated_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—"}</td>
            <td className="p-3 whitespace-nowrap">
              <div className="flex flex-nowrap items-center justify-end gap-1">
                <Link href={`/admin/pedidos/${order.id}/edit`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-brand-ink" title={order.status === "finalized" ? "Visualizar pedido" : "Editar pedido"} aria-label={order.status === "finalized" ? "Visualizar pedido" : "Editar pedido"}>{order.status === "finalized" ? <Eye className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}</Link>
                <a href={`/api/orders/${order.id}/nfe-xml`} download className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-brand-ink" title="Baixar XML NFe" aria-label="Baixar XML da NF-e"><Download className="h-4 w-4" /></a>
                <EmitNFeButton orderId={order.id} disabled={order.status === "finalized"} />
                {order.status !== "finalized" && <DeleteOrderButton orderId={order.id} />}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
