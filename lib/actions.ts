"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/auth";
import { createCategory, deleteCategory, updateCategory, type CategoryMutationInput } from "@/lib/categories";
import { createProduct, deleteProduct, updateProduct, type ProductMutationInput } from "@/lib/products";
import { createClient, deleteClient, updateClient, type ClientMutationInput } from "@/lib/clients";
import { createSalesperson, deleteSalesperson, updateSalesperson, type SalespersonInput } from "@/lib/salespeople";
import { createUnit, deleteUnit, updateUnit, type UnitInput } from "@/lib/units";

function parseSortOrder(value: FormDataEntryValue | null) {
  const sortOrder = Number(value);

  return Number.isFinite(sortOrder) ? sortOrder : 0;
}

function parseCategory(formData: FormData): CategoryMutationInput {
  return {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    icon: String(formData.get("icon") ?? "package").trim(),
    sort_order: parseSortOrder(formData.get("sort_order")),
    active: formData.get("active") === "on"
  };
}

async function parseProduct(formData: FormData): Promise<ProductMutationInput> {
  function parseCurrencyField(name: string) {
    const raw = String(formData.get(name) ?? "").trim();
    if (!raw) return null;
    // remove any non digit, dot or comma (keeps - for negatives if any)
    const cleaned = raw.replace(/[^0-9,.-]/g, "");
    // normalize thousands separator and decimal comma
    // remove dots used as thousand separators, convert comma to dot for decimal
    const normalized = cleaned.replace(/\./g, "").replace(/,/g, ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }

  const product: ProductMutationInput = {
    code: String(formData.get("code") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    unit_id: String(formData.get("unit_id") ?? "").trim(),
    category_id: String(formData.get("category_id") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    size: String(formData.get("size") ?? "").trim(),
    price: parseCurrencyField("price"),
    cost_price: parseCurrencyField("cost_price"),
    active: formData.get("active") === "on",
    // ensure image_url is always present to satisfy ProductMutationInput
    image_url: String(formData.get("image_url") ?? "")
  };

  return product;
}

export async function createProductAction(formData: FormData) {
  await requireAdminUser();
  const imageFile = formData.get("image_blob") ?? "";
  await createProduct(await parseProduct(formData), imageFile);
  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath("/admin/produtos");
}

export async function updateProductAction(formData: FormData) {
  await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  const imageFile = formData.get("image_blob") ?? "";
  await updateProduct(id, await parseProduct(formData), imageFile);
  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath("/admin/produtos");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  await deleteProduct(id);
  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath("/admin/produtos");
}

export async function createCategoryAction(formData: FormData) {
  await requireAdminUser();
  await createCategory(parseCategory(formData));
  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath("/admin/produtos");
  revalidatePath("/admin/categorias");
  redirect("/admin/categorias");
}

export async function updateCategoryAction(formData: FormData) {
  await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  await updateCategory(id, parseCategory(formData));
  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath("/admin/produtos");
  revalidatePath("/admin/categorias");
  redirect("/admin/categorias");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  await deleteCategory(id);
  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath("/admin/produtos");
  revalidatePath("/admin/categorias");
  redirect("/admin/categorias");
}

function parseClient(formData: FormData): ClientMutationInput {
  const field = (name: string) => String(formData.get(name) ?? "").trim();
  return {
    corporate_name: field("corporate_name"), cnpj: field("cnpj"), state_registration: field("state_registration"),
    address: field("address"), neighborhood: field("neighborhood"), notes: field("notes"), city: field("city"),
    state: field("state").toUpperCase(), zip_code: field("zip_code"), email: field("email"), phone: field("phone"),
    salesperson: field("salesperson"), unit: "", unit_id: field("unit_id"), active: formData.get("active") === "on"
  };
}

function onlyDigits(value: string) { return value.replace(/\D/g, ""); }

function isValidCnpj(value: string) {
  const digits = onlyDigits(value);
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false;
  const digit = (length: number) => {
    let sum = 0;
    let weight = length - 7;
    for (let index = 0; index < length; index += 1) { sum += Number(digits[index]) * weight; weight = weight === 2 ? 9 : weight - 1; }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  return digit(12) === Number(digits[12]) && digit(13) === Number(digits[13]);
}

function parseSalesperson(formData: FormData): SalespersonInput {
  const field = (name: string) => String(formData.get(name) ?? "").trim();
  return { name: field("name"), email: field("email"), phone: field("phone"), unit_id: field("unit_id"), active: formData.get("active") === "on" };
}

function parseUnit(formData: FormData): UnitInput { const field = (name: string) => String(formData.get(name) ?? "").trim(); return { name: field("name"), address: field("address"), phone: field("phone"), whatsapp_number: field("whatsapp_number").replace(/\D/g, ""), email: field("email"), active: formData.get("active") === "on" }; }

export async function createClientAction(formData: FormData) {
  await requireAdminUser("/admin/clientes");
  const client = parseClient(formData);
  if (!isValidCnpj(client.cnpj)) throw new Error("Informe um CNPJ válido.");
  await createClient(client);
  revalidatePath("/admin/clientes");
}

export async function updateClientAction(formData: FormData) {
  await requireAdminUser("/admin/clientes");
  const client = parseClient(formData);
  if (!isValidCnpj(client.cnpj)) throw new Error("Informe um CNPJ válido.");
  await updateClient(String(formData.get("id") ?? ""), client);
  revalidatePath("/admin/clientes");
}

export async function createSalespersonAction(formData: FormData) {
  await requireAdminUser("/admin/vendedores");
  const salesperson = parseSalesperson(formData);
  if (!salesperson.name) throw new Error("Informe o nome do vendedor.");
  await createSalesperson(salesperson);
  revalidatePath("/admin/vendedores"); revalidatePath("/admin/clientes");
}

export async function updateSalespersonAction(formData: FormData) {
  await requireAdminUser("/admin/vendedores");
  const salesperson = parseSalesperson(formData);
  if (!salesperson.name) throw new Error("Informe o nome do vendedor.");
  await updateSalesperson(String(formData.get("id") ?? ""), salesperson);
  revalidatePath("/admin/vendedores"); revalidatePath("/admin/clientes");
}

export async function deleteSalespersonAction(formData: FormData) {
  await requireAdminUser("/admin/vendedores");
  await deleteSalesperson(String(formData.get("id") ?? ""));
  revalidatePath("/admin/vendedores"); revalidatePath("/admin/clientes");
  redirect("/admin/vendedores");
}

export async function createUnitAction(formData: FormData) { await requireAdminUser("/admin/unidades"); const unit = parseUnit(formData); if (!unit.name) throw new Error("Informe o nome da unidade."); await createUnit(unit); revalidatePath("/"); revalidatePath("/produtos"); revalidatePath("/admin/unidades"); }
export async function updateUnitAction(formData: FormData) { await requireAdminUser("/admin/unidades"); const unit = parseUnit(formData); if (!unit.name) throw new Error("Informe o nome da unidade."); await updateUnit(String(formData.get("id") ?? ""), unit); revalidatePath("/"); revalidatePath("/produtos"); revalidatePath("/admin/unidades"); }
export async function deleteUnitAction(formData: FormData) { await requireAdminUser("/admin/unidades"); await deleteUnit(String(formData.get("id") ?? "")); revalidatePath("/"); revalidatePath("/produtos"); revalidatePath("/admin/unidades"); redirect("/admin/unidades"); }

export async function deleteClientAction(formData: FormData) {
  await requireAdminUser("/admin/clientes");
  await deleteClient(String(formData.get("id") ?? ""));
  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}
