import { unstable_noStore as noStore } from "next/cache";
import { randomUUID } from 'crypto';
import { buildIlikePattern } from "@/lib/supabase-filters";
import { deleteRecord, getSupabase, requireSupabase } from "@/lib/supabase";
import { paginate, pageRange, totalPagesFor } from "@/lib/pagination";
import { matchesText, normalizeText } from "@/lib/text";

export type Product = {
  id: string;
  code?: string | null;
  unit?: string | null;
  name: string;
  unit_name: string;
  unit_id: string;
  category_id: string;
  category: string;
  description: string;
  size: string;
  stock?: number | null;
  cost_price?: number | null;
  price: number | null;
  image_blob: string | null;
  image_mime_type: string | null;
  image_url: string | null;
  active: boolean;
  created_at?: string;
};

export type ProductInput = Omit<Product, "id" | "created_at" | "category" | "unit_name">;
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
  unitId?: string;
  search?: string;
};

type GetPaginatedProductsOptions = GetProductsOptions & {
  page?: number;
  pageSize?: number;
  category?: string;
};

type ProductRecord = Omit<ProductInput, "unit_name"> & {
  id: string;
  unit_id?: string | null;
  units?: { name?: string | null } | { name?: string | null }[] | null;
  created_at?: string;
  categories?: { name?: string | null } | { name?: string | null }[] | null;
  code?: string | null;
  unit?: string | null;
  stock?: number | null;
  cost_price?: number | null;
};

const fallbackProducts: Product[] = [
  {
    id: "demo-1",
    name: "Detergente Profissional",
    unit_name: "FLORIANOPOLIS SC",
    unit_id: "unit-florianopolis",
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
    unit_name: "JOINVILLE SC",
    unit_id: "unit-joinville",
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
    unit_name: "ITAJAI SC",
    unit_id: "unit-itajai",
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
  const relatedUnit = Array.isArray(product.units) ? product.units[0] : product.units;

  return {
    ...product,
    code: product.code ?? null,
    unit: product.unit ?? null,
    stock: product.stock ?? null,
    cost_price: product.cost_price ?? null,
    unit_name: relatedUnit?.name ?? "Unidade não definida",
    unit_id: product.unit_id ?? "",
    category: relatedCategory?.name ?? "Sem categoria",
    image_blob: product.image_blob ?? null,
    image_mime_type: product.image_mime_type ?? null,
    image_url: product.image_url ?? byteaToDataUrl(product.image_blob ?? null, product.image_mime_type ?? null)
  };
}

function matchesSearch(product: Product, search?: string) {
  if (!search) {
    return true;
  }

  const normalizedSearch = normalizeText(search);
  const searchableText = [product.name, product.description, product.category, product.unit_name].map(normalizeText).join(" ");

  return searchableText.includes(normalizedSearch);
}

function paginateProducts(products: Product[], page: number, pageSize: number): ProductsPage {
  const { items, ...rest } = paginate(products, page, pageSize);

  return { products: items, ...rest };
}

export async function getProducts({ includeInactive = false, unitId, search }: GetProductsOptions = {}) {
  noStore();
  const supabase = getSupabase();

  if (!supabase) {
    return fallbackProducts.filter(
      (product) => (includeInactive || product.active) && (!unitId || product.unit_id === unitId) && matchesSearch(product, search)
    );
  }

  let query = supabase.from("products").select("*, categories!products_category_id_fkey(name), units!products_unit_id_fkey(name)").order("created_at", { ascending: false });

  if (!includeInactive) {
    query = query.eq("active", true);
  }

  if (unitId) {
    query = query.eq("unit_id", unitId);
  }

  if (search) {
    const pattern = buildIlikePattern(search.trim());
    query = query.or(`name.ilike.${pattern},description.ilike.${pattern}`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Não foi possível carregar os produtos: ${error.message}`);
  }

  return ((data ?? []) as ProductRecord[]).map(normalizeProduct);
}

export async function getPaginatedProducts({
  includeInactive = false,
  page = 1,
  pageSize = 9,
  category,
  unitId,
  search
}: GetPaginatedProductsOptions = {}) {
  noStore();
  const supabase = getSupabase();
  const { page: safePage, pageSize: safePageSize, from, to } = pageRange(page, pageSize);

  if (!supabase) {
    const products = fallbackProducts.filter((product) => {
      const isVisible = includeInactive || product.active;
      const isInCategory = matchesText(product.category, category);
      const isFromCompany = !unitId || product.unit_id === unitId;
      const isSearchMatch = matchesSearch(product, search);

      return isVisible && isInCategory && isFromCompany && isSearchMatch;
    });

    return paginateProducts(products, safePage, safePageSize);
  }

  let query = supabase.from("products").select("*, categories!products_category_id_fkey!inner(name), units!products_unit_id_fkey(name)", { count: "exact" }).order("created_at", { ascending: false });

  if (!includeInactive) {
    query = query.eq("active", true);
  }

  if (category) {
    query = query.eq("categories.name", category);
  }

  if (unitId) {
    query = query.eq("unit_id", unitId);
  }

  if (search) {
    const pattern = buildIlikePattern(search.trim());
    query = query.or(`name.ilike.${pattern},description.ilike.${pattern}`);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(`Não foi possível carregar os produtos: ${error.message}`);
  }

  const total = count ?? 0;
  const totalPages = totalPagesFor(total, safePageSize);

  if (total > 0 && safePage > totalPages) {
    return getPaginatedProducts({
      includeInactive,
      page: totalPages,
      pageSize: safePageSize,
      category,
      unitId,
      search
    });
  }

  return {
    products: ((data ?? []) as ProductRecord[]).map(normalizeProduct),
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

  let query = supabase.from("products").select("*, categories!products_category_id_fkey(name), units!products_unit_id_fkey(name)").eq("id", id).limit(1);

  if (!includeInactive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Não foi possível carregar o produto: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return normalizeProduct(data as ProductRecord);
}

export async function createProduct(input: ProductMutationInput, imageFile: FormDataEntryValue) {
  const supabase = requireSupabase();
  const id = randomUUID();
  
  const imageURL = await uploadImageToBucket(imageFile, id, input.unit_id);

  if (imageURL) {
    input.image_url = imageURL;
  }

  const { error } = await supabase.from("products").insert({...input, id});

  if (error) {
    throw new Error(error.message);
  }
}

const allowedImageTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

const maxImageSizeInBytes = 1024 * 1024;

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

async function uploadImageToBucket(imageFile:FormDataEntryValue, id: string, unitId: string = "default") {
  const supabase = requireSupabase();

  const imageURL = "";
  const hasImageFile =
    typeof imageFile === "object" &&
    imageFile !== null &&
    "arrayBuffer" in imageFile &&
    "size" in imageFile &&
    Number(imageFile.size) > 0;

  if (hasImageFile) {
    const file = imageFile as File;
    const contentType = file.type;
    const extension = allowedImageTypes[contentType];

    if (!extension) {
      throw new Error("Formato de imagem invalido. Envie um arquivo JPG, PNG ou WEBP.");
    }

    if (file.size > maxImageSizeInBytes) {
      throw new Error("Imagem muito grande. O tamanho maximo permitido e 1MB.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const baseName = sanitizeFileName(file.name.replace(/\.[^.]+$/, "")) || "imagem";
    const imagePath = `${sanitizeFileName(unitId)}/${id}-${baseName}.${extension}`;
    const { error } = await supabase
    .storage
    .from('images')
    .upload(imagePath, buffer, {
      contentType,
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
  const supabase = requireSupabase();

  const imageURL = await uploadImageToBucket(imageFile, id, input.unit_id);

  if (imageURL) {
    input.image_url = imageURL;
  }

  const { error } = await supabase.from("products").update(input).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteProduct(id: string) {
  await deleteRecord("products", id);
}
