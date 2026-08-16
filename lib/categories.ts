import { unstable_noStore as noStore } from "next/cache";
import { deleteRecord, getSupabase, insertRecord, updateRecord } from "@/lib/supabase";
import { paginate, pageRange, totalPagesFor } from "@/lib/pagination";
import { likePattern } from "@/lib/text";

export type Category = {
  id: string;
  name: string;
  description: string;
  icon: string;
  active: boolean;
  sort_order: number;
  created_at?: string;
};

export type CategoryMutationInput = Omit<Category, "id" | "created_at">;

const fallbackCategories: Category[] = [
  ["copa-cozinha", "COPA/COZINHA", "sparkles"],
  ["descartaveis", "DESCARTÁVEIS", "trash"],
  ["diversos", "DIVERSOS", "package"],
  ["epi", "EPI", "shield"],
  ["equipamentos", "EQUIPAMENTOS, ACESSÓRIOS E DISPENSERS", "package"],
  ["residuos", "GERENCIMENTO DE RESÍDUOS", "trash"],
  ["higiene-pessoal", "HIGIENE PESSOAL", "shield"],
  ["limpeza-higiene", "LIMPEZA E HIGIENE", "spray"],
  ["panos", "PANOS", "waves"],
  ["perfumaria", "PERFUMARIA", "sparkles"]
].map(([id, name, icon], index) => ({
  id: `demo-${id}`,
  name,
  description: `Categoria ${name}.`,
  icon,
  active: true,
  sort_order: (index + 1) * 10
}));

function normalizeCategory(category: Partial<Category> & { id: string; name: string }): Category {
  return {
    id: category.id,
    name: category.name,
    description: category.description ?? "",
    icon: category.icon ?? "package",
    active: category.active ?? true,
    sort_order: category.sort_order ?? 0,
    created_at: category.created_at
  };
}

export type CategoriesPage = {
  categories: Category[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getCategories({ includeInactive = false } = {}) {
  noStore();
  const supabase = getSupabase();

  if (!supabase) {
    return fallbackCategories.filter((category) => includeInactive || category.active);
  }

  let query = supabase.from("categories").select("*").order("sort_order", { ascending: true }).order("name", { ascending: true });

  if (!includeInactive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Não foi possível carregar as categorias: ${error.message}`);
  }

  return (data ?? []).map((category) => normalizeCategory(category as Category));
}

function paginateFallbackCategories(includeInactive: boolean, page: number, pageSize: number, search?: string): CategoriesPage {
  const filtered = fallbackCategories.filter((category) => {
    const visible = includeInactive || category.active;
    const matches = search ? category.name.toLowerCase().includes(search.toLowerCase()) : true;

    return visible && matches;
  });

  const { items, ...rest } = paginate(filtered, page, pageSize);

  return { categories: items, ...rest };
}

export async function getPaginatedCategories({ includeInactive = false, page = 1, pageSize = 10, search }: { includeInactive?: boolean; page?: number; pageSize?: number; search?: string } = {}): Promise<CategoriesPage> {
  noStore();
  const supabase = getSupabase();
  const { page: safePage, pageSize: safePageSize, from, to } = pageRange(page, pageSize);

  if (!supabase) {
    return paginateFallbackCategories(includeInactive, safePage, safePageSize, search);
  }

  let query = supabase.from("categories").select("*", { count: "exact" }).order("sort_order", { ascending: true }).order("name", { ascending: true });

  if (!includeInactive) query = query.eq("active", true);
  if (search) query = query.ilike("name", likePattern(search));

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(`Não foi possível carregar as categorias: ${error.message}`);
  }

  const total = count ?? 0;
  const totalPages = totalPagesFor(total, safePageSize);

  return {
    categories: (data ?? []).map((category) => normalizeCategory(category as Category)),
    total,
    page: Math.min(safePage, totalPages),
    pageSize: safePageSize,
    totalPages
  };
}

export async function createCategory(input: CategoryMutationInput) {
  await insertRecord("categories", input);
}

export async function updateCategory(id: string, input: CategoryMutationInput) {
  await updateRecord("categories", id, input);
}

export async function deleteCategory(id: string) {
  await deleteRecord("categories", id);
}
