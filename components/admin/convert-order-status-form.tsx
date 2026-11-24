"use client";

import { convertOrderToOrderAction } from "@/lib/actions";
import { ArrowRight } from "lucide-react";

export function ConvertOrderStatusForm({ id }: { id: number }) {
  return <form action={convertOrderToOrderAction} className="shrink-0"><input type="hidden" name="id" value={id} /><button className="inline-flex h-9 w-9 items-center justify-center rounded-md text-blue-700 hover:bg-blue-50" title="Converter em pedido" aria-label="Converter em pedido" type="submit"><ArrowRight className="h-4 w-4" /></button></form>;
}
