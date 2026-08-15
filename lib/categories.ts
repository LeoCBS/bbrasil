import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@supabase/supabase-js";

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

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false
    }
  });
}

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
    console.error("Supabase categories fetch failed:", error.message);
    return fallbackCategories.filter((category) => includeInactive || category.active);
  }

  return (data ?? []).map((category) => normalizeCategory(category as Category));
}

export async function getPaginatedCategories({ includeInactive = false, page = 1, pageSize = 10, search }: { includeInactive?: boolean; page?: number; pageSize?: number; search?: string } = {}): Promise<CategoriesPage> {
  noStore();
  const supabase = getSupabase();
  const safePageSize = Math.max(1, pageSize);
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  if (!supabase) {
    const filtered = fallbackCategories.filter((category) => {
      const visible = includeInactive || category.active;
      const matches = search ? category.name.toLowerCase().includes(search.toLowerCase()) : true;
      return visible && matches;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const safe = Math.min(safePage, totalPages);

    return {
      categories: filtered.slice((safe - 1) * safePageSize, (safe - 1) * safePageSize + safePageSize),
      total,
      page: safe,
      pageSize: safePageSize,
      totalPages
    };
  }

  let query = supabase.from("categories").select("*", { count: "exact" }).order("sort_order", { ascending: true }).order("name", { ascending: true });

  if (!includeInactive) query = query.eq("active", true);
  if (search) {
    const pattern = `%${String(search).replace(/[%_]/g, "\\$&")}%`;
    query = query.ilike("name", pattern);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("Supabase categories fetch failed:", error.message);
    const filtered = fallbackCategories.filter((category) => {
      const visible = includeInactive || category.active;
      const matches = search ? category.name.toLowerCase().includes(search.toLowerCase()) : true;
      return visible && matches;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const safe = Math.min(safePage, totalPages);

    return {
      categories: filtered.slice((safe - 1) * safePageSize, (safe - 1) * safePageSize + safePageSize),
      total,
      page: safe,
      pageSize: safePageSize,
      totalPages
    };
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const safe = Math.min(safePage, totalPages);

  return {
    categories: (data ?? []).map((c) => normalizeCategory(c as Category)),
    total,
    page: safe,
    pageSize: safePageSize,
    totalPages
  };
}

export async function createCategory(input: CategoryMutationInput) {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para usar o admin.");
  }

  const { error } = await supabase.from("categories").insert(input);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateCategory(id: string, input: CategoryMutationInput) {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para usar o admin.");
  }

  const { error } = await supabase.from("categories").update(input).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

}

export async function deleteCategory(id: string) {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para usar o admin.");
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
