"use client";

import { Building2, LoaderCircle, Repeat2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { Unit } from "@/lib/units";
import { Button } from "@/components/ui/button";
import { notifyCartUpdated, writeSelectedUnitId } from "@/lib/quote-cart-storage";

export function UnitSelector({ selectedUnit, units }: { selectedUnit?: Unit; units: Unit[] }) {
  const router = useRouter(); const [isOpen, setIsOpen] = useState(!selectedUnit); const [isSelecting, setIsSelecting] = useState(false); const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []); useEffect(() => { if (selectedUnit) { setIsOpen(false); setIsSelecting(false); } }, [selectedUnit]);
  function selectUnit(unit: Unit) {
    setIsSelecting(true);

    try {
      writeSelectedUnitId(unit.id);
    } catch (reason) {
      // The cookie below keeps the selection working even without localStorage.
      console.error("Não foi possível salvar a unidade selecionada no localStorage:", reason);
    }

    document.cookie = `bbrasil_selected_unit_id=${encodeURIComponent(unit.id)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    notifyCartUpdated({ open: false });
    router.replace(`/?unidade=${encodeURIComponent(unit.id)}`);
  }
  return <>{selectedUnit ? <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(true)}><Repeat2 className="h-4 w-4" /> <span className="max-w-32 truncate">{selectedUnit.name}</span> · Trocar</Button> : null}{isOpen && isMounted ? createPortal(<div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl md:p-8"><div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue"><Building2 className="h-6 w-6" /></span><div><h1 className="text-2xl font-bold text-brand-ink">Escolha sua unidade de atendimento</h1><p className="mt-2 text-slate-600">Mostraremos o catálogo e direcionaremos seu orçamento para a unidade selecionada.</p></div></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{units.map((unit) => <Button key={unit.id} type="button" variant="outline" disabled={isSelecting} className="h-auto justify-start whitespace-normal px-5 py-4 text-left text-brand-ink" onClick={() => selectUnit(unit)}>{unit.name}</Button>)}</div>{isSelecting ? <p className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-brand-blue"><LoaderCircle className="h-4 w-4 animate-spin" /> Carregando catálogo...</p> : null}</div></div>, document.body) : null}</>;
}
