'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { deleteCommissionRuleAction, saveCommissionRuleAction } from '@/lib/commission-actions';
import type { CommissionRule } from '@/lib/commissions';
import type { Category } from '@/lib/categories';

function PercentInput({ name, defaultValue, placeholder, className, required = false, form }: { name: string; defaultValue?: number | null; placeholder: string; className: string; required?: boolean; form?: string }) {
  const display = (value?: number | null) => value == null ? '' : `${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  const [value, setValue] = useState(display(defaultValue));
  function update(raw: string) {
    const negative = raw.trimStart().startsWith('-');
    const digits = raw.replace(/\D/g, '');
    if (!digits) { setValue(negative ? '-' : ''); return; }
    const amount = Number(digits) / 100;
    setValue(`${negative ? '-' : ''}${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`);
  }
  return <input form={form} name={name} type="text" inputMode="decimal" value={value} onChange={event => update(event.target.value)} placeholder={placeholder} required={required} className={className}/>;
}

export function CommissionRulesPanel({ rules, categories }: { rules: CommissionRule[]; categories: Category[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [createVersion, setCreateVersion] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  function run(action: (formData: FormData) => Promise<void>, form: HTMLFormElement, successMessage: string, reset = false) {
    setFeedback(null);
    const formData = new FormData(form);
    startTransition(async () => {
      try {
        await action(formData);
        if (reset) { form.reset(); setCreateVersion(version => version + 1); }
        setFeedback({ type: 'success', message: successMessage });
        router.refresh();
      } catch (error) {
        setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Não foi possível salvar a regra.' });
      }
    });
  }

  function save(event: FormEvent<HTMLFormElement>, message: string, reset = false) {
    event.preventDefault();
    run(saveCommissionRuleAction, event.currentTarget, message, reset);
  }

  return <Card><CardContent className="p-5">
    <h2 className="mb-2 text-xl font-semibold">Regras por faixa de diferença</h2>
    <p className="mb-4 text-sm text-slate-600">A comissão é aplicada sobre a diferença entre o preço de venda e o preço de custo. Para regras gerais, informe a faixa percentual dessa diferença em relação ao custo. Regras por categoria têm prioridade.</p>
    {feedback ? <div className="mb-4"><Alert variant={feedback.type} message={feedback.message} onClose={() => setFeedback(null)} /></div> : null}
    <form key={createVersion} onSubmit={(event) => save(event, 'Regra cadastrada com sucesso.', true)} className="grid gap-3 md:grid-cols-6">
      <input name="name" required placeholder="Nome da regra" className="h-11 rounded-md border bg-white px-3"/><select name="category_id" defaultValue="" className="h-11 rounded-md border bg-white px-3"><option value="">Regra geral por faixa</option>{categories.map(category=><option key={category.id} value={category.id}>{category.name}</option>)}</select><PercentInput name="min_difference_percent" placeholder="Diferença mínima %" className="h-11 rounded-md border bg-white px-3"/><PercentInput name="max_difference_percent" placeholder="Diferença máxima %" className="h-11 rounded-md border bg-white px-3"/><PercentInput name="commission_percent" placeholder="Comissão %" className="h-11 rounded-md border bg-white px-3" required/><label className="flex items-center gap-2"><input name="active" type="checkbox" defaultChecked/>Ativa</label><button disabled={pending} className="rounded bg-brand-blue px-4 py-2 text-white disabled:opacity-60 md:col-span-6">{pending ? 'Salvando…' : 'Cadastrar'}</button>
    </form>
    <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[1050px] table-fixed text-sm"><colgroup><col className="w-[13%]"/><col className="w-[21%]"/><col className="w-[13%]"/><col className="w-[13%]"/><col className="w-[13%]"/><col className="w-[12%]"/><col className="w-[15%]"/></colgroup><thead><tr className="border-b text-left"><th className="p-2">Nome</th><th className="p-2">Categoria</th><th className="p-2">Diferença mín. %</th><th className="p-2">Diferença máx. %</th><th className="p-2">Comissão %</th><th className="p-2">Ativa</th><th className="p-2 text-right">Ações</th></tr></thead><tbody>{rules.map(rule=><tr key={rule.id} className="border-b last:border-0"><td className="p-2"><input form={`edit-rule-${rule.id}`} name="name" defaultValue={rule.name} required className="h-9 w-full min-w-0 rounded border px-2"/></td><td className="p-2"><select form={`edit-rule-${rule.id}`} name="category_id" defaultValue={rule.category_id ?? ''} className="h-9 w-full min-w-0 rounded border px-2"><option value="">Regra geral por faixa</option>{categories.map(category=><option key={category.id} value={category.id}>{category.name}</option>)}</select></td><td className="p-2"><PercentInput form={`edit-rule-${rule.id}`} name="min_difference_percent" defaultValue={rule.category_id ? null : rule.min_difference_percent} placeholder="Mín. %" className="h-9 w-full min-w-0 rounded border px-2"/></td><td className="p-2"><PercentInput form={`edit-rule-${rule.id}`} name="max_difference_percent" defaultValue={rule.category_id ? null : rule.max_difference_percent} placeholder="Máx. %" className="h-9 w-full min-w-0 rounded border px-2"/></td><td className="p-2"><PercentInput form={`edit-rule-${rule.id}`} name="commission_percent" defaultValue={rule.commission_percent} placeholder="Comissão %" className="h-9 w-full min-w-0 rounded border px-2" required/></td><td className="p-2"><label className="flex items-center gap-1"><input form={`edit-rule-${rule.id}`} name="active" type="checkbox" defaultChecked={rule.active}/>Ativa</label></td><td className="p-2"><div className="flex items-center justify-end gap-3"><form id={`edit-rule-${rule.id}`} onSubmit={(event) => save(event, 'Regra atualizada com sucesso.')}><input type="hidden" name="id" value={rule.id}/><button disabled={pending} className="rounded border px-3 py-1.5 disabled:opacity-60">Atualizar</button></form><form onSubmit={(event) => { event.preventDefault(); run(deleteCommissionRuleAction, event.currentTarget, 'Regra excluída com sucesso.'); }}><input type="hidden" name="id" value={rule.id}/><button disabled={pending} className="text-red-700 disabled:opacity-60">Excluir</button></form></div></td></tr>)}</tbody></table>{rules.length===0&&<p className="p-3 text-slate-500">Cadastre a primeira regra para habilitar o cálculo de comissões.</p>}</div>
  </CardContent></Card>;
}
