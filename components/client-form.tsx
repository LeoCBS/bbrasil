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
import { formatCnpj, formatPhone, isValidCnpj } from "@/lib/format";

const fields = [["corporate_name", "Razão social", "text", true], ["state_registration", "Insc. estadual", "text", false], ["address", "Endereço", "text", false], ["neighborhood", "Bairro", "text", false], ["city", "Cidade", "text", false], ["state", "Estado", "text", false], ["zip_code", "CEP", "text", false], ["email", "E-mail", "email", false]] as const;

export function ClientForm({ client, action, submitLabel, successHref, units, profiles }: { client?: Client; action: (formData: FormData) => Promise<void>; submitLabel: string; successHref?: string; units: Unit[]; profiles: Profile[] }) {
  const router = useRouter(); const formRef = useRef<HTMLFormElement>(null); const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [pending, startTransition] = useTransition();
  const [cnpj, setCnpj] = useState(formatCnpj(client?.cnpj ?? "")); const [phone, setPhone] = useState(formatPhone(client?.phone ?? "")); const id = client?.id ?? "new";
  async function submit(formData: FormData) { setMessage(""); setError(""); if (!isValidCnpj(cnpj)) { setError("Informe um CNPJ válido."); return; } startTransition(async () => { try { await action(formData); setMessage(client ? "Cliente atualizado com sucesso." : "Cliente cadastrado com sucesso."); if (!client) { formRef.current?.reset(); setCnpj(""); setPhone(""); } if (successHref) router.push(successHref); router.refresh(); } catch (reason) { console.error("Falha ao salvar o cliente:", reason); setError(reason instanceof Error ? reason.message : "Não foi possível salvar o cliente."); } }); }
  const selectClass = "h-11 rounded-md border border-input bg-background px-3 text-sm";
  return <form ref={formRef} action={submit} className="grid gap-4">
    {client ? <input type="hidden" name="id" value={client.id} /> : null}
    {message ? <Alert variant="success" message={message} onClose={() => setMessage("")} /> : null}{error ? <Alert variant="error" message={error} onClose={() => setError("")} /> : null}
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2"><Label htmlFor={`cnpj-${id}`}>CNPJ</Label><Input id={`cnpj-${id}`} name="cnpj" required value={cnpj} onChange={(event) => setCnpj(formatCnpj(event.target.value))} inputMode="numeric" placeholder="00.000.000/0000-00" maxLength={18} /></div>
      {fields.map(([name, label, type, required]) => <div key={name} className={name === "corporate_name" || name === "address" ? "grid gap-2 sm:col-span-2" : "grid gap-2"}><Label htmlFor={`${name}-${id}`}>{label}</Label><Input id={`${name}-${id}`} name={name} type={type} required={required} maxLength={name === "state" ? 2 : undefined} defaultValue={client?.[name] ?? ""} /></div>)}
      <div className="grid gap-2"><Label htmlFor={`phone-${id}`}>Fone</Label><Input id={`phone-${id}`} name="phone" type="tel" value={phone} onChange={(event) => setPhone(formatPhone(event.target.value))} inputMode="numeric" placeholder="(00) 00000-0000" maxLength={15} /></div>
      <div className="grid gap-2"><Label htmlFor={`profile_id-${id}`}>Vendedor</Label><select id={`profile_id-${id}`} name="profile_id" defaultValue={client?.profile_id ?? ""} className={selectClass}><option value="">Selecione um vendedor</option>{profiles.filter((profile) => profile.role === "vendedor" && profile.active).map((profile) => <option key={profile.id} value={profile.id}>{profile.name || profile.email}</option>)}</select></div>
      <div className="grid gap-2"><Label htmlFor={`unit-${id}`}>Unidade</Label><select id={`unit-${id}`} name="unit_id" defaultValue={client?.unit_id ?? ""} className={selectClass}><option value="">Selecione uma unidade</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></div>
    </div>
    <div className="grid gap-2"><Label htmlFor={`notes-${id}`}>Observações</Label><Textarea id={`notes-${id}`} name="notes" defaultValue={client?.notes ?? ""} /></div>
    <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" name="active" defaultChecked={client?.active ?? true} className="h-4 w-4 rounded border-input accent-brand-green" /> Cliente ativo</label>
    <SubmitButton className="w-full" pendingLabel="Salvando..." disabled={pending}>{submitLabel}</SubmitButton>
  </form>;
}
