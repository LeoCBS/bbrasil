"use server";
import { revalidatePath } from 'next/cache';
import { requireAdminUser } from '@/auth';
import { deleteCommissionRule, getCommissionRules, saveCommissionRule } from '@/lib/commissions';
export async function saveCommissionRuleAction(formData: FormData) {
  await requireAdminUser('/admin/comissoes');
  const parsePercent = (value: FormDataEntryValue | null) => Number(String(value ?? '').replace('%', '').trim().replace(',', '.'));
  const percent = parsePercent(formData.get('commission_percent'));
  const categoryId = String(formData.get('category_id') ?? '').trim() || null;
  const minDifference = categoryId ? 0 : parsePercent(formData.get('min_difference_percent'));
  const maxRaw = String(formData.get('max_difference_percent') ?? '').replace('%', '').trim();
  const maxDifference = categoryId || !maxRaw ? null : parsePercent(formData.get('max_difference_percent'));
  if (!Number.isFinite(minDifference) || (maxDifference !== null && (!Number.isFinite(maxDifference) || maxDifference < minDifference)) || !Number.isFinite(percent) || percent < 0 || percent > 100) throw new Error('Informe uma faixa válida e percentuais entre 0 e 100.');
  const id = String(formData.get('id') ?? '').trim();
  if (formData.get('active') === 'on') {
    const existing = await getCommissionRules();
    const overlaps = existing.some(rule => rule.active && rule.id !== id && (categoryId
      ? rule.category_id === categoryId
      : !rule.category_id
        && (maxDifference === null
          ? rule.max_difference_percent === null
          : rule.max_difference_percent !== null
            && rule.min_difference_percent <= maxDifference
            && rule.max_difference_percent >= minDifference)));
    if (overlaps) throw new Error(categoryId ? 'Já existe uma regra ativa para essa categoria.' : 'Essa faixa percentual se sobrepõe a outra regra ativa. Ajuste os limites para não haver sobreposição.');
  }
  await saveCommissionRule({ ...(id ? { id } : {}), name: String(formData.get('name') ?? '').trim(), min_difference_percent: minDifference, max_difference_percent: maxDifference, commission_percent: percent, category_id: categoryId, active: formData.get('active') === 'on' });
  revalidatePath('/admin/comissoes');
}
export async function deleteCommissionRuleAction(formData: FormData) {
  await requireAdminUser('/admin/comissoes');
  const id = String(formData.get('id') ?? ''); if (!id) throw new Error('ID da regra ausente');
  await deleteCommissionRule(id); revalidatePath('/admin/comissoes');
}
