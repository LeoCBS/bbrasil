import { unstable_noStore as noStore } from "next/cache";
import { buildIlikePattern } from "@/lib/supabase-filters";
import { getSupabase } from "@/lib/supabase";
import { paginate, pageRange, totalPagesFor } from "@/lib/pagination";
import { normalizeText } from "@/lib/text";

export type OrderItem = {
  id: number;
  order_id: number;
  product_id: string;
  product_name: string;
  product_code?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at?: string;
};

export type Order = {
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
  status: 'pending' | 'confirmed' | 'cancelled' | 'delivered';
  observation?: string;
  total_amount: number;
  items?: OrderItem[];
  created_at?: string;
  updated_at?: string;
};

export type OrderMutationInput = Omit<Order, "id" | "created_at" | "updated_at" | "items"> & {
  items?: OrderItem[];
};
export type OrdersPage = { orders: Order[]; total: number; page: number; pageSize: number; totalPages: number };

const fallbackOrders: Order[] = [
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
    observation: "Entregar pela manhã",
    total_amount: 1500.00,
    items: [
      {
        id: 1,
        order_id: 1,
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



function matches(order: Order, search?: string, status?: string, unitId?: string) {
  const text = normalizeText(search ?? "");
  const hasText = !text || [order.client_name, order.client_cnpj, order.unit_name].some((value) => normalizeText(value).includes(text));
  const hasStatus = !status || order.status === status;
  const hasUnit = !unitId || order.unit_id === unitId;
  return hasText && hasStatus && hasUnit;
}

function paginateFallbackOrders(page: number, pageSize: number, search?: string, status?: string, unitId?: string): OrdersPage {
  const { items, ...rest } = paginate(fallbackOrders.filter((order) => matches(order, search, status, unitId)), page, pageSize);
  return { orders: items, ...rest };
}

export async function getPaginatedOrders({ search, status, unitId, page = 1, pageSize = 10 }: { search?: string; status?: string; unitId?: string; page?: number; pageSize?: number } = {}): Promise<OrdersPage> {
  noStore();
  const supabase = getSupabase();
  const { page: safePage, pageSize: safePageSize, from, to } = pageRange(page, pageSize);
  if (!supabase) return paginateFallbackOrders(safePage, safePageSize, search, status, unitId);
  
  let query = supabase.from("orders").select("*", { count: "exact" }).order("created_at", { ascending: false });
  
  if (status) query = query.eq("status", status);
  if (unitId) query = query.eq("unit_id", unitId);
  if (search?.trim()) {
    const pattern = buildIlikePattern(search.trim());
    query = query.or(`client_name.ilike.${pattern},client_cnpj.ilike.${pattern},unit_name.ilike.${pattern}`);
  }
  
  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(`Não foi possível carregar os pedidos: ${error.message}`);
  const total = count ?? 0;
  return { orders: (data ?? []) as Order[], total, page: safePage, pageSize: safePageSize, totalPages: totalPagesFor(total, safePageSize) };
}

export async function getOrder(id: number): Promise<Order | null> {
  noStore();
  const supabase = getSupabase();
  if (!supabase) return fallbackOrders.find((order) => order.id === id) ?? null;
  
  // Buscar o pedido principal
  const { data: orderData, error: orderError } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (orderError) throw new Error(`Não foi possível carregar o pedido: ${orderError.message}`);
  if (!orderData) return null;

  // Buscar os itens do pedido
  const { data: itemsData, error: itemsError } = await supabase.from("order_items").select("*").eq("order_id", id);
  if (itemsError) throw new Error(`Não foi possível carregar os itens do pedido: ${itemsError.message}`);

  return {
    ...orderData,
    items: itemsData as OrderItem[]
  } as Order;
}

export async function createOrder(input: OrderMutationInput) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { items, ...orderData } = input;

  // Criar o pedido principal (o ID será gerado automaticamente pelo banco)
  const { data: orderResult, error: orderError } = await supabase.from("orders").insert([orderData]).select('id').single();
  if (orderError) throw new Error(`Não foi possível criar o pedido: ${orderError.message}`);

  const orderId = orderResult.id;

  // Criar os itens do pedido
  if (items && items.length > 0) {
    const itemsWithOrderId = items.map(({ id: _id, ...itemData }: OrderItem) => ({
      ...itemData,
      order_id: orderId
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(itemsWithOrderId);
    if (itemsError) throw new Error(`Não foi possível criar os itens do pedido: ${itemsError.message}`);
  }
}

export async function updateOrder(id: number, input: OrderMutationInput) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { items, ...orderData } = input;

  // Atualizar o pedido principal
  const { error: orderError } = await supabase.from("orders").update(orderData).eq("id", id);
  if (orderError) throw new Error(`Não foi possível atualizar o pedido: ${orderError.message}`);

  // Excluir os itens antigos
  const { error: deleteError } = await supabase.from("order_items").delete().eq("order_id", id);
  if (deleteError) throw new Error(`Não foi possível excluir os itens antigos: ${deleteError.message}`);

  // Inserir os novos itens
  if (items && items.length > 0) {
    const itemsWithOrderId = items.map(({ id: _id, ...itemData }: OrderItem) => ({
      ...itemData,
      order_id: id
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(itemsWithOrderId);
    if (itemsError) throw new Error(`Não foi possível atualizar os itens do pedido: ${itemsError.message}`);
  }
}

export async function deleteOrder(id: number) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  // Deletar o pedido (os itens serão deletados em cascade pelo trigger)
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw new Error(`Não foi possível deletar o pedido: ${error.message}`);
}
