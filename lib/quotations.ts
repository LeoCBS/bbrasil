import { unstable_noStore as noStore } from "next/cache";
import { buildIlikePattern } from "@/lib/supabase-filters";
import { getSupabase } from "@/lib/supabase";
import { paginate, pageRange, totalPagesFor } from "@/lib/pagination";
import { normalizeText } from "@/lib/text";

export type QuotationItem = {
  id: number;
  quotation_id: number;
  product_id: string;
  product_name: string;
  product_code?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at?: string;
};

export type Quotation = {
  id: number;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  client_id: string;
  client_name: string;
  client_cnpj: string;
  client_salesperson_id?: string;
  client_salesperson_name?: string;
  unit_id: string;
  unit_name: string;
  status: 'pending' | 'approved' | 'rejected' | 'converted';
  observation?: string;
  total_amount: number;
  valid_until?: string;
  order_id?: number;
  items?: QuotationItem[];
  created_at?: string;
  updated_at?: string;
};

export type QuotationMutationInput = Omit<Quotation, "id" | "created_at" | "updated_at" | "items"> & {
  items?: QuotationItem[];
};

export type QuotationsPage = { quotations: Quotation[]; total: number; page: number; pageSize: number; totalPages: number };

const fallbackQuotations: Quotation[] = [
  {
    id: 1,
    user_id: "demo-user-1",
    user_name: "João da Silva",
    user_email: "joao@example.com",
    client_id: "demo-client-1",
    client_name: "Mercado 3 Irmãos Ltda",
    client_cnpj: "12.345.678/0001-90",
    client_salesperson_id: "demo-profile-1",
    client_salesperson_name: "João da Silva",
    unit_id: "unit-joinville",
    unit_name: "JOINVILLE SC",
    status: "pending",
    observation: "Orçamento para teste",
    total_amount: 1500.00,
    items: [
      {
        id: 1,
        quotation_id: 1,
        product_id: "prod-1",
        product_name: "Produto Demo 1",
        product_code: "ALT001",
        quantity: 10,
        unit_price: 150.00,
        total_price: 1500.00
      }
    ]
  }
];

function matches(quotation: Quotation, search?: string, status?: string, unitId?: string) {
  const text = normalizeText(search ?? "");
  const hasText = !text || [quotation.client_name, quotation.client_cnpj, quotation.unit_name].some((value) => normalizeText(value).includes(text));
  const hasStatus = !status || quotation.status === status;
  const hasUnit = !unitId || quotation.unit_id === unitId;
  return hasText && hasStatus && hasUnit;
}

function paginateFallbackQuotations(page: number, pageSize: number, search?: string, status?: string, unitId?: string): QuotationsPage {
  const { items, ...rest } = paginate(fallbackQuotations.filter((quotation) => matches(quotation, search, status, unitId)), page, pageSize);
  return { quotations: items, ...rest };
}

export async function getPaginatedQuotations({ search, status, unitId, page = 1, pageSize = 10 }: { search?: string; status?: string; unitId?: string; page?: number; pageSize?: number } = {}): Promise<QuotationsPage> {
  noStore();
  const supabase = getSupabase();
  const { page: safePage, pageSize: safePageSize, from, to } = pageRange(page, pageSize);
  if (!supabase) return paginateFallbackQuotations(safePage, safePageSize, search, status, unitId);
  
  let query = supabase.from("quotations").select("*", { count: "exact" }).order("created_at", { ascending: false });
  
  if (status) query = query.eq("status", status);
  if (unitId) query = query.eq("unit_id", unitId);
  if (search?.trim()) {
    const pattern = buildIlikePattern(search.trim());
    query = query.or(`client_name.ilike.${pattern},client_cnpj.ilike.${pattern},unit_name.ilike.${pattern}`);
  }
  
  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(`Não foi possível carregar os orçamentos: ${error.message}`);
  const total = count ?? 0;
  return { quotations: (data ?? []) as Quotation[], total, page: safePage, pageSize: safePageSize, totalPages: totalPagesFor(total, safePageSize) };
}

export async function getQuotation(id: number): Promise<Quotation | null> {
  noStore();
  const supabase = getSupabase();
  if (!supabase) return fallbackQuotations.find((quotation) => quotation.id === id) ?? null;
  
  // Buscar o orçamento principal
  const { data: quotationData, error: quotationError } = await supabase.from("quotations").select("*").eq("id", id).maybeSingle();
  if (quotationError) throw new Error(`Não foi possível carregar o orçamento: ${quotationError.message}`);
  if (!quotationData) return null;

  // Buscar os itens do orçamento
  const { data: itemsData, error: itemsError } = await supabase.from("quotation_items").select("*").eq("quotation_id", id);
  if (itemsError) throw new Error(`Não foi possível carregar os itens do orçamento: ${itemsError.message}`);

  return {
    ...quotationData,
    items: itemsData as QuotationItem[]
  } as Quotation;
}

export async function createQuotation(input: QuotationMutationInput) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { items, ...quotationData } = input;

  // Criar o orçamento principal (o ID será gerado automaticamente pelo banco)
  const { data: quotationResult, error: quotationError } = await supabase.from("quotations").insert([quotationData]).select('id').single();
  if (quotationError) throw new Error(`Não foi possível criar o orçamento: ${quotationError.message}`);

  const quotationId = quotationResult.id;

  // Criar os itens do orçamento
  if (items && items.length > 0) {
    const itemsWithQuotationId = items.map(({ id, ...itemData }: QuotationItem) => ({
      ...itemData,
      quotation_id: quotationId
    }));

    const { error: itemsError } = await supabase.from("quotation_items").insert(itemsWithQuotationId);
    if (itemsError) throw new Error(`Não foi possível criar os itens do orçamento: ${itemsError.message}`);
  }
}

export async function updateQuotation(id: number, input: QuotationMutationInput) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { items, ...quotationData } = input;

  // Atualizar o orçamento principal
  const { error: quotationError } = await supabase.from("quotations").update(quotationData).eq("id", id);
  if (quotationError) throw new Error(`Não foi possível atualizar o orçamento: ${quotationError.message}`);

  // Excluir os itens antigos
  const { error: deleteError } = await supabase.from("quotation_items").delete().eq("quotation_id", id);
  if (deleteError) throw new Error(`Não foi possível excluir os itens antigos: ${deleteError.message}`);

  // Inserir os novos itens
  if (items && items.length > 0) {
    const itemsWithQuotationId = items.map(({ id, ...itemData }: QuotationItem) => ({
      ...itemData,
      quotation_id: id
    }));

    const { error: itemsError } = await supabase.from("quotation_items").insert(itemsWithQuotationId);
    if (itemsError) throw new Error(`Não foi possível atualizar os itens do orçamento: ${itemsError.message}`);
  }
}

export async function deleteQuotation(id: number) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  // Deletar o orçamento (os itens serão deletados em cascade pelo trigger)
  const { error } = await supabase.from("quotations").delete().eq("id", id);
  if (error) throw new Error(`Não foi possível deletar o orçamento: ${error.message}`);
}

export async function convertQuotationToOrder(quotationId: number) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  // Buscar o orçamento
  const quotation = await getQuotation(quotationId);
  if (!quotation) throw new Error('Orçamento não encontrado');

  // Criar o pedido com base no orçamento
  const { data: orderResult, error: orderError } = await supabase.from("orders").insert([{
    user_id: quotation.user_id,
    user_name: quotation.user_name,
    user_email: quotation.user_email,
    client_id: quotation.client_id,
    client_name: quotation.client_name,
    client_cnpj: quotation.client_cnpj,
    client_salesperson_id: quotation.client_salesperson_id,
    client_salesperson_name: quotation.client_salesperson_name,
    unit_id: quotation.unit_id,
    unit_name: quotation.unit_name,
    status: 'pending',
    observation: quotation.observation,
    total_amount: quotation.total_amount
  }]).select('id').single();
  
  if (orderError) throw new Error(`Não foi possível criar o pedido: ${orderError.message}`);

  const orderId = orderResult.id;

  // Inserir os itens do pedido
  if (quotation.items && quotation.items.length > 0) {
    const itemsWithOrderId = quotation.items.map(({ id, quotation_id, ...itemData }: QuotationItem) => ({
      ...itemData,
      order_id: orderId
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(itemsWithOrderId);
    if (itemsError) throw new Error(`Não foi possível criar os itens do pedido: ${itemsError.message}`);
  }

  // Atualizar o orçamento para associar o pedido e mudar status
  const { error: updateError } = await supabase.from("quotations").update({
    status: 'converted',
    order_id: orderId
  }).eq("id", quotationId);
  
  if (updateError) throw new Error(`Não foi possível atualizar o orçamento: ${updateError.message}`);

  return orderId;
}
