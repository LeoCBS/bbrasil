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
  {
    id: "demo-altolim",
    name: "ALTOLIM",
    description: "Linha Altolim para rotinas profissionais de limpeza.",
    icon: "spray",
    active: true,
    sort_order: 10
  },
  {
    id: "demo-equipamentos",
    name: "EQUIPAMENTOS E ACESSÓRIOS",
    description: "Equipamentos e acessorios para limpeza profissional.",
    icon: "package",
    active: true,
    sort_order: 20
  },
  {
    id: "demo-descartaveis",
    name: "DESCARTÁVEIS",
    description: "Descartaveis para empresas, cozinhas e ambientes de alto fluxo.",
    icon: "trash",
    active: true,
    sort_order: 30
  },
  {
    id: "demo-higiene-pessoal",
    name: "HIGIENE PESSOAL",
    description: "Itens para cuidado, assepsia e higiene pessoal.",
    icon: "shield",
    active: true,
    sort_order: 40
  },
  {
    id: "demo-copa-cozinha",
    name: "COPA/COZINHA",
    description: "Produtos para copa, cozinha e areas de preparo.",
    icon: "sparkles",
    active: true,
    sort_order: 50
  },
  {
    id: "demo-epi",
    name: "EPI",
    description: "Equipamentos de protecao individual para operacoes seguras.",
    icon: "shield",
    active: true,
    sort_order: 60
  },
  {
    id: "demo-limpeza-higiene",
    name: "LIMPEZA E HIGIENE",
    description: "Solucoes para limpeza, higienizacao e manutencao diaria.",
    icon: "spray",
    active: true,
    sort_order: 70
  },
  {
    id: "demo-dispenser",
    name: "DISPENSER",
    description: "Dispensers e suportes para ambientes profissionais.",
    icon: "package",
    active: true,
    sort_order: 80
  },
  {
    id: "demo-residuos",
    name: "GERENCIAMENTO DE RESÍDUOS",
    description: "Produtos para descarte, coleta e gestao de residuos.",
    icon: "trash",
    active: true,
    sort_order: 90
  },
  {
    id: "demo-panos",
    name: "PANOS",
    description: "Panos e acessorios texteis para limpeza profissional.",
    icon: "waves",
    active: true,
    sort_order: 100
  }
];

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

  const { data: currentCategory, error: currentCategoryError } = await supabase.from("categories").select("name").eq("id", id).maybeSingle();

  if (currentCategoryError) {
    throw new Error(currentCategoryError.message);
  }

  const { error } = await supabase.from("categories").update(input).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  const previousName = typeof currentCategory?.name === "string" ? currentCategory.name : null;

  if (previousName && previousName !== input.name) {
    const { error: productsError } = await supabase.from("products").update({ category: input.name }).eq("category", previousName);

    if (productsError) {
      throw new Error(productsError.message);
    }
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
