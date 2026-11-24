"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import type { Client } from "@/lib/clients";
import type { Profile } from "@/lib/profiles";
import type { Unit } from "@/lib/units";
import { formatCep, formatDocument, formatPhone, isValidDocument } from "@/lib/format";
import { lookupCepAction } from "@/lib/actions";
import { onlyDigits } from "@/lib/text";

const fields = [["corporate_name", "Razão social", "text", true], ["state_registration", "Insc. estadual", "text", false], ["address", "Endereço", "text", false], ["address_number", "Número", "text", false], ["city_code", "Cód. Município (IBGE)", "text", false], ["neighborhood", "Bairro", "text", false], ["city", "Cidade", "text", false], ["state", "Estado", "text", false], ["email", "E-mail", "email", false], ["contact_person", "Contato", "text", false]] as const;

export function ClientForm({ client, action, submitLabel, successHref, units, profiles }: { client?: Client; action: (formData: FormData) => Promise<void>; submitLabel: string; successHref?: string; units: Unit[]; profiles: Profile[] }) {
  const router = useRouter(); const formRef = useRef<HTMLFormElement>(null); const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [pending, startTransition] = useTransition();
  const [doc, setDoc] = useState(formatDocument(client?.cnpj ?? "")); const [phone, setPhone] = useState(formatPhone(client?.contact_phone ?? client?.phone ?? "")); const [zip, setZip] = useState(formatCep(client?.zip_code ?? "")); const [cepLoading, setCepLoading] = useState(false); const id = client?.id ?? "new";
  async function lookupAddress() {
    const digits = onlyDigits(zip);
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const address = await lookupCepAction(digits);
      if (!address) { setError("CEP não encontrado."); return; }
      const setField = (name: string, value: string) => { const element = formRef.current?.elements.namedItem(name) as HTMLInputElement | null; if (element) element.value = value; };
      setField("address", address.address);
      setField("neighborhood", address.neighborhood);
      setField("city", address.city);
      setField("city_code", address.city_code);
      setField("state", address.state);
    } catch (reason) { console.error("Falha ao consultar o CEP:", reason); setError("Não foi possível consultar o CEP."); } finally { setCepLoading(false); }
  }
  function handleZipChange(value: string) {
    const masked = formatCep(value);
    setZip(masked);
    if (onlyDigits(masked).length === 8) void lookupAddress();
  }
  async function submit(formData: FormData) { setMessage(""); setError(""); if (!isValidDocument(doc)) { setError("Informe um CPF ou CNPJ válido."); return; } startTransition(async () => { try { await action(formData); setMessage(client ? "Cliente atualizado com sucesso." : "Cliente cadastrado com sucesso."); if (!client) { formRef.current?.reset(); setDoc(""); setPhone(""); setZip(""); } if (successHref) router.push(successHref); router.refresh(); } catch (reason) { console.error("Falha ao salvar o cliente:", reason); setError(reason instanceof Error ? reason.message : "Não foi possível salvar o cliente."); } }); }
  const selectClass = "h-11 rounded-md border border-input bg-background px-3 text-sm";
  return <form ref={formRef} action={submit} className="grid gap-4">
    {client ? <input type="hidden" name="id" value={client.id} /> : null}
    {message ? <Alert variant="success" message={message} onClose={() => setMessage("")} /> : null}{error ? <Alert variant="error" message={error} onClose={() => setError("")} /> : null}
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2"><Label htmlFor={`cnpj-${id}`}>CNPJ/CPF</Label><Input id={`cnpj-${id}`} name="cnpj" required value={doc} onChange={(event) => setDoc(formatDocument(event.target.value))} inputMode="numeric" placeholder="CPF ou CNPJ" maxLength={18} /></div>
      <div className="grid gap-2"><Label htmlFor={`zip_code-${id}`}>CEP</Label><Input id={`zip_code-${id}`} name="zip_code" value={zip} onChange={(event) => handleZipChange(event.target.value)} onBlur={() => void lookupAddress()} inputMode="numeric" placeholder="00000-000" maxLength={9} />{cepLoading ? <p className="text-xs text-slate-500">Buscando endereço...</p> : null}</div>
      {fields.map(([name, label, type, required]) => <div key={name} className={name === "corporate_name" || name === "address" ? "grid gap-2 sm:col-span-2" : "grid gap-2"}><Label htmlFor={`${name}-${id}`}>{label}</Label><Input id={`${name}-${id}`} name={name} type={type} required={required} maxLength={name === "state" ? 2 : undefined} defaultValue={client?.[name] ?? ""} /></div>)}
      <div className="grid gap-2"><Label htmlFor={`contact_phone-${id}`}>Fone Contato</Label><Input id={`contact_phone-${id}`} name="contact_phone" value={phone} onChange={(event) => setPhone(formatPhone(event.target.value))} inputMode="numeric" placeholder="(00) 00000-0000" maxLength={15} /></div>

      <div className="grid gap-2"><Label htmlFor={`profile_id-${id}`}>Vendedor</Label><select id={`profile_id-${id}`} name="profile_id" defaultValue={client?.profile_id ?? ""} className={selectClass}><option value="">Selecione um vendedor</option>{profiles.filter((profile) => profile.role === "vendedor" && profile.active).map((profile) => <option key={profile.id} value={profile.id}>{profile.name || profile.email}</option>)}</select></div>
      <div className="grid gap-2"><Label htmlFor={`unit-${id}`}>Unidade</Label><select id={`unit-${id}`} name="unit_id" defaultValue={client?.unit_id ?? ""} className={selectClass}><option value="">Selecione uma unidade</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></div>
    </div>
    <div className="grid gap-2"><Label htmlFor={`notes-${id}`}>Observações</Label><Textarea id={`notes-${id}`} name="notes" defaultValue={client?.notes ?? ""} /></div>
    <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" name="active" defaultChecked={client?.active ?? true} className="h-4 w-4 rounded border-input accent-brand-green" /> Cliente ativo</label>
    <SubmitButton className="w-full" pendingLabel="Salvando..." disabled={pending}>{submitLabel}</SubmitButton>
  </form>;
}
