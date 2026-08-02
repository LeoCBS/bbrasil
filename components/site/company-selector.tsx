"use client";

import { Building2, LoaderCircle, Repeat2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { currentCompanyStorageKey } from "@/components/site/add-to-quote-button";

export function CompanySelector({ selectedCompany, companies }: { selectedCompany?: string; companies: string[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(!selectedCompany);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      setIsOpen(false);
      setIsSelecting(false);
    }
  }, [selectedCompany]);

  function selectCompany(company: string) {
    setIsSelecting(true);
    window.localStorage.setItem(currentCompanyStorageKey, company);
    document.cookie = `bbrasil_selected_company=${encodeURIComponent(company)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent("bbrasil:quote-cart-updated", { detail: { open: false } }));
    router.replace(`/?empresa=${encodeURIComponent(company)}`);
  }

  return (
    <>
      {selectedCompany ? (
        <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(true)}>
          <Repeat2 className="h-4 w-4" /> <span className="max-w-32 truncate">{selectedCompany}</span> · Trocar
        </Button>
      ) : null}
      {isOpen && isMounted ? createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="company-selector-title">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl md:p-8">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
                <Building2 className="h-6 w-6" />
              </span>
              <div>
                <h1 id="company-selector-title" className="text-2xl font-bold text-brand-ink">Escolha sua empresa de atendimento</h1>
                <p className="mt-2 text-slate-600">Mostraremos o catálogo e direcionaremos seu orçamento para a unidade selecionada.</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {companies.map((company) => (
                <Button key={company} type="button" variant="outline" disabled={isSelecting} className="h-auto justify-start whitespace-normal px-5 py-4 text-left text-brand-ink hover:border-brand-green hover:bg-brand-green/5" onClick={() => selectCompany(company)}>
                  {company}
                </Button>
              ))}
            </div>
            {isSelecting ? (
              <p className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-brand-blue" role="status">
                <LoaderCircle className="h-4 w-4 animate-spin" /> Carregando catálogo da empresa...
              </p>
            ) : null}
          </div>
        </div>
      , document.body) : null}
    </>
  );
}
