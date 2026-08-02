import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from 'crypto';

export type Product = {
  id: string;
  name: string;
  company: string;
  category_id: string;
  category: string;
  description: string;
  size: string;
  price: number | null;
  image_blob: string | null;
  image_mime_type: string | null;
  image_url: string | null;
  active: boolean;
  created_at?: string;
};

export type ProductInput = Omit<Product, "id" | "created_at" | "category">;
export type ProductMutationInput = Omit<ProductInput, "image_blob" | "image_mime_type"> & {
  image_blob?: string | null;
  image_mime_type?: string | null;
};

export type ProductsPage = {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type GetProductsOptions = {
  includeInactive?: boolean;
  company?: string;
  search?: string;
};

type GetPaginatedProductsOptions = GetProductsOptions & {
  page?: number;
  pageSize?: number;
  category?: string;
};

type ProductRecord = Omit<ProductInput, "company"> & {
  id: string;
  company?: string | null;
  created_at?: string;
  categories?: { name?: string | null } | { name?: string | null }[] | null;
};

const fallbackProducts: Product[] = [
  {
    id: "demo-1",
    name: "Detergente Profissional",
    company: "FLORIANOPOLIS SC",
    category_id: "demo-limpeza-higiene",
    category: "LIMPEZA E HIGIENE",
    description: "Alto rendimento para cozinhas, pisos lavaveis e manutencao diaria.",
    size: "5L",
    price: 48.9,
    image_blob: null,
    image_mime_type: null,
    image_url: null,
    active: true
  },
  {
    id: "demo-2",
    name: "Limpador Multiuso",
    company: "JOINVILLE SC",
    category_id: "demo-limpeza-higiene",
    category: "LIMPEZA E HIGIENE",
    description: "Solucao pratica para superficies corporativas e ambientes de alto fluxo.",
    size: "750ml",
    price: 18.5,
    image_blob: null,
    image_mime_type: null,
    image_url: null,
    active: true
  },
  {
    id: "demo-3",
    name: "Desinfetante Concentrado",
    company: "ITAJAI SC",
    category_id: "demo-higiene-pessoal",
    category: "HIGIENE PESSOAL",
    description: "Formula concentrada para limpeza profunda e controle de odores.",
    size: "1L",
    price: 24.9,
    image_blob: null,
    image_mime_type: null,
    image_url: null,
    active: true
  }
];

function byteaToDataUrl(imageBlob: string | null, mimeType: string | null) {
  if (!imageBlob || !mimeType) {
    return null;
  }

  const hex = imageBlob.startsWith("\\x") ? imageBlob.slice(2) : imageBlob;
  const base64 = Buffer.from(hex, "hex").toString("base64");

  return `data:${mimeType};base64,${base64}`;
}

function normalizeProduct(product: ProductRecord): Product {
  const relatedCategory = Array.isArray(product.categories) ? product.categories[0] : product.categories;

  return {
    ...product,
    company: product.company ?? "FLORIANOPOLIS SC",
    category: relatedCategory?.name ?? "Sem categoria",
    image_blob: product.image_blob ?? null,
    image_mime_type: product.image_mime_type ?? null,
    image_url: product.image_url ?? byteaToDataUrl(product.image_blob ?? null, product.image_mime_type ?? null)
  };
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchesText(value: string, selected?: string) {
  return selected ? normalizeText(value) === normalizeText(selected) : true;
}

function matchesSearch(product: Product, search?: string) {
  if (!search) {
    return true;
  }

  const normalizedSearch = normalizeText(search);
  const searchableText = [product.name, product.description, product.category, product.company].map(normalizeText).join(" ");

  return searchableText.includes(normalizedSearch);
}

function escapeSearchPattern(value: string) {
  return value.replace(/[%_]/g, "\\$&").replace(/,/g, "\\,");
}

function paginateProducts(products: Product[], page: number, pageSize: number): ProductsPage {
  const safePageSize = Math.max(1, pageSize);
  const total = products.length;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = (safePage - 1) * safePageSize;

  return {
    products: products.slice(from, from + safePageSize),
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages
  };
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false
    },
  });
}

export async function getProducts({ includeInactive = false, company, search }: GetProductsOptions = {}) {
  noStore();
  const supabase = getSupabase();

  if (!supabase) {
    return fallbackProducts.filter(
      (product) => (includeInactive || product.active) && matchesText(product.company, company) && matchesSearch(product, search)
    );
  }

  let query = supabase.from("products").select("*, categories!products_category_id_fkey(name)").order("created_at", { ascending: false });

  if (!includeInactive) {
    query = query.eq("active", true);
  }

  if (company) {
    query = query.eq("company", company);
  }

  if (search) {
    const pattern = `%${escapeSearchPattern(search.trim())}%`;
    query = query.or(`name.ilike.${pattern},description.ilike.${pattern},company.ilike.${pattern}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Supabase products fetch failed:", error.message);
    return fallbackProducts.filter(
      (product) => (includeInactive || product.active) && matchesText(product.company, company) && matchesSearch(product, search)
    );
  }

  return (data as ProductRecord[]).map(normalizeProduct);
}

export async function getPaginatedProducts({
  includeInactive = false,
  page = 1,
  pageSize = 9,
  category,
  company,
  search
}: GetPaginatedProductsOptions = {}) {
  noStore();
  const supabase = getSupabase();
  const safePageSize = Math.max(1, pageSize);
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  if (!supabase) {
    const products = fallbackProducts.filter((product) => {
      const isVisible = includeInactive || product.active;
      const isInCategory = matchesText(product.category, category);
      const isFromCompany = matchesText(product.company, company);
      const isSearchMatch = matchesSearch(product, search);

      return isVisible && isInCategory && isFromCompany && isSearchMatch;
    });

    return paginateProducts(products, safePage, safePageSize);
  }

  let query = supabase.from("products").select("*, categories!products_category_id_fkey!inner(name)", { count: "exact" }).order("created_at", { ascending: false });

  if (!includeInactive) {
    query = query.eq("active", true);
  }

  if (category) {
    query = query.eq("categories.name", category);
  }

  if (company) {
    query = query.eq("company", company);
  }

  if (search) {
    const pattern = `%${escapeSearchPattern(search.trim())}%`;
    query = query.or(`name.ilike.${pattern},description.ilike.${pattern},company.ilike.${pattern}`);
  }
  
  
  const { data, error, count } = await query.range(from, to);
  
  if (error) {
    console.error("Supabase products fetch failed:", error.message);
    const products = fallbackProducts.filter((product) => {
      return (
        (includeInactive || product.active) &&
        matchesText(product.category, category) &&
        matchesText(product.company, company) &&
        matchesSearch(product, search)
      );
    });

    return paginateProducts(products, safePage, safePageSize);
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));

  if (total > 0 && safePage > totalPages) {
    return getPaginatedProducts({
      includeInactive,
      page: totalPages,
      pageSize: safePageSize,
      category,
      company,
      search
    });
  }

  return {
    products: (data as ProductRecord[]).map(normalizeProduct),
    total,
    page: Math.min(safePage, totalPages),
    pageSize: safePageSize,
    totalPages
  };
}

export async function getProduct(id: string, { includeInactive = false } = {}) {
  noStore();
  const supabase = getSupabase();

  if (!supabase) {
    return fallbackProducts.find((product) => product.id === id && (includeInactive || product.active)) ?? null;
  }

  let query = supabase.from("products").select("*, categories!products_category_id_fkey(name)").eq("id", id).limit(1);

  if (!includeInactive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Supabase product fetch failed:", error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  return normalizeProduct(data as ProductRecord);
}

export async function createProduct(input: ProductMutationInput, imageFile: FormDataEntryValue) {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para usar o admin.");
  }
  const id = randomUUID();
  
  const imageURL = await uploadImageToBucket(imageFile, id, input.company);

  if (imageURL) {
    input.image_url = imageURL;
  }

  const { error } = await supabase.from("products").insert({...input, id});

  if (error) {
    throw new Error(error.message);
  }
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .toLowerCase() // Converter para minúsculas
    .normalize('NFD') // Remover acentos
    .replace(/[\u0300-\u036f]/g, '') // Completar remoção de acentos
    .replace(/[^\w.-]/g, '-') // Substituir caracteres inválidos por hífen
    .replace(/\s+/g, '-') // Espaços em branco por hífen
    .replace(/-+/g, '-') // Múltiplos hífens por um só
    .replace(/^-|-$/g, ''); // Remover hífens das extremidades
}

async function uploadImageToBucket(imageFile:FormDataEntryValue, id: string, company: string = "default") {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para usar o admin.");
  }

  const imageURL = "";
  const hasImageFile =
    typeof imageFile === "object" &&
    imageFile !== null &&
    "arrayBuffer" in imageFile &&
    "size" in imageFile &&
    Number(imageFile.size) > 0;

  if (hasImageFile) {
    const file = imageFile as File;
    const buffer = Buffer.from(await file.arrayBuffer());
    const imagePath = `${sanitizeFileName(company)}/${id}-${sanitizeFileName(file.name)}`;
    const { data, error } = await supabase
    .storage
    .from('images')
    .upload(imagePath, buffer, {
      contentType: file.type,
      upsert: true
    })

    if (error) throw new Error(error.message)
    const  dataURL = supabase
    .storage
    .from('images')
    .getPublicUrl(imagePath)

    return dataURL.data.publicUrl;
  }
  return imageURL
}

export async function updateProduct(id: string, input: ProductMutationInput, imageFile: FormDataEntryValue) {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para usar o admin.");
  }

  const imageURL = await uploadImageToBucket(imageFile, id, input.company);

  if (imageURL) {
    input.image_url = imageURL;
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
