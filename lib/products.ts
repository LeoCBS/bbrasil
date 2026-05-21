import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@supabase/supabase-js";

export type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  size: string;
  price: number | null;
  image_url: string | null;
  active: boolean;
  created_at?: string;
};

export type ProductInput = Omit<Product, "id" | "created_at">;

const fallbackProducts: Product[] = [
  {
    id: "demo-1",
    name: "Detergente Profissional",
    category: "Limpeza Geral",
    description: "Alto rendimento para cozinhas, pisos lavaveis e manutencao diaria.",
    size: "5L",
    price: 48.9,
    image_url: null,
    active: true
  },
  {
    id: "demo-2",
    name: "Limpador Multiuso",
    category: "Higienizacao",
    description: "Solucao pratica para superficies corporativas e ambientes de alto fluxo.",
    size: "750ml",
    price: 18.5,
    image_url: null,
    active: true
  },
  {
    id: "demo-3",
    name: "Desinfetante Concentrado",
    category: "Desinfeccao",
    description: "Formula concentrada para limpeza profunda e controle de odores.",
    size: "1L",
    price: 24.9,
    image_url: null,
    active: true
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

export async function getProducts({ includeInactive = false } = {}) {
  noStore();
  const supabase = getSupabase();

  if (!supabase) {
    return fallbackProducts.filter((product) => includeInactive || product.active);
  }

  let query = supabase.from("products").select("*").order("created_at", { ascending: false });

  if (!includeInactive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Supabase products fetch failed:", error.message);
    return fallbackProducts.filter((product) => includeInactive || product.active);
  }

  return data as Product[];
}

export async function createProduct(input: ProductInput) {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para usar o admin.");
  }

  const { error } = await supabase.from("products").insert(input);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateProduct(id: string, input: ProductInput) {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para usar o admin.");
  }

  const { error } = await supabase.from("products").update(input).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteProduct(id: string) {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para usar o admin.");
  }

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
