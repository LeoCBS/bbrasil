"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/auth";
import { createCategory, deleteCategory, updateCategory, type CategoryMutationInput } from "@/lib/categories";
import { createProduct, deleteProduct, updateProduct, type ProductMutationInput } from "@/lib/products";
import { createClient, deleteClient, updateClient, type ClientMutationInput } from "@/lib/clients";
import { createSalesperson, deleteSalesperson, updateSalesperson, type SalespersonInput } from "@/lib/salespeople";
import { createUnit, deleteUnit, updateUnit, type UnitInput } from "@/lib/units";
import { checkboxField, currencyField, digitsField, numberField, textField } from "@/lib/form-data";
import { isValidCnpj } from "@/lib/format";

const catalogPaths = ["/", "/produtos", "/admin/produtos"];
const categoryPaths = [...catalogPaths, "/admin/categorias"];
const unitPaths = ["/", "/produtos", "/admin/unidades"];
const salespersonPaths = ["/admin/vendedores", "/admin/clientes"];

function revalidate(paths: string[]) {
  for (const path of paths) {
    revalidatePath(path);
  }
}

function idField(formData: FormData) {
  return String(formData.get("id") ?? "");
}

function parseCategory(formData: FormData): CategoryMutationInput {
  return {
    name: textField(formData, "name"),
    description: textField(formData, "description"),
    icon: textField(formData, "icon", "package"),
    sort_order: numberField(formData, "sort_order"),
    active: checkboxField(formData, "active")
  };
}

function parseProduct(formData: FormData): ProductMutationInput {
  return {
    code: textField(formData, "code"),
    name: textField(formData, "name"),
    unit_id: textField(formData, "unit_id"),
    category_id: textField(formData, "category_id"),
    description: textField(formData, "description"),
    size: textField(formData, "size"),
    price: currencyField(formData, "price"),
    cost_price: currencyField(formData, "cost_price"),
    active: checkboxField(formData, "active"),
    image_url: textField(formData, "image_url")
  };
}

function parseClient(formData: FormData): ClientMutationInput {
  return {
    corporate_name: textField(formData, "corporate_name"),
    cnpj: textField(formData, "cnpj"),
    state_registration: textField(formData, "state_registration"),
    address: textField(formData, "address"),
    neighborhood: textField(formData, "neighborhood"),
    notes: textField(formData, "notes"),
    city: textField(formData, "city"),
    state: textField(formData, "state").toUpperCase(),
    zip_code: textField(formData, "zip_code"),
    email: textField(formData, "email"),
    phone: textField(formData, "phone"),
    salesperson: textField(formData, "salesperson"),
    unit: "",
    unit_id: textField(formData, "unit_id"),
    active: checkboxField(formData, "active")
  };
}

function parseSalesperson(formData: FormData): SalespersonInput {
  return {
    name: textField(formData, "name"),
    email: textField(formData, "email"),
    phone: textField(formData, "phone"),
    unit_id: textField(formData, "unit_id"),
    active: checkboxField(formData, "active")
  };
}

function parseUnit(formData: FormData): UnitInput {
  return {
    name: textField(formData, "name"),
    address: textField(formData, "address"),
    phone: textField(formData, "phone"),
    whatsapp_number: digitsField(formData, "whatsapp_number"),
    email: textField(formData, "email"),
    active: checkboxField(formData, "active")
  };
}

export async function createProductAction(formData: FormData) {
  await requireAdminUser();
  await createProduct(parseProduct(formData), formData.get("image_blob") ?? "");
  revalidate(catalogPaths);
}

export async function updateProductAction(formData: FormData) {
  await requireAdminUser();
  await updateProduct(idField(formData), parseProduct(formData), formData.get("image_blob") ?? "");
  revalidate(catalogPaths);
}

export async function deleteProductAction(formData: FormData) {
  await requireAdminUser();
  await deleteProduct(idField(formData));
  revalidate(catalogPaths);
}

export async function createCategoryAction(formData: FormData) {
  await requireAdminUser();
  await createCategory(parseCategory(formData));
  revalidate(categoryPaths);
  redirect("/admin/categorias");
}

export async function updateCategoryAction(formData: FormData) {
  await requireAdminUser();
  await updateCategory(idField(formData), parseCategory(formData));
  revalidate(categoryPaths);
  redirect("/admin/categorias");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdminUser();
  await deleteCategory(idField(formData));
  revalidate(categoryPaths);
  redirect("/admin/categorias");
}

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
  await updateClient(idField(formData), client);
  revalidatePath("/admin/clientes");
}

export async function deleteClientAction(formData: FormData) {
  await requireAdminUser("/admin/clientes");
  await deleteClient(idField(formData));
  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}

export async function createSalespersonAction(formData: FormData) {
  await requireAdminUser("/admin/vendedores");
  const salesperson = parseSalesperson(formData);
  if (!salesperson.name) throw new Error("Informe o nome do vendedor.");
  await createSalesperson(salesperson);
  revalidate(salespersonPaths);
}

export async function updateSalespersonAction(formData: FormData) {
  await requireAdminUser("/admin/vendedores");
  const salesperson = parseSalesperson(formData);
  if (!salesperson.name) throw new Error("Informe o nome do vendedor.");
  await updateSalesperson(idField(formData), salesperson);
  revalidate(salespersonPaths);
}

export async function deleteSalespersonAction(formData: FormData) {
  await requireAdminUser("/admin/vendedores");
  await deleteSalesperson(idField(formData));
  revalidate(salespersonPaths);
  redirect("/admin/vendedores");
}

export async function createUnitAction(formData: FormData) {
  await requireAdminUser("/admin/unidades");
  const unit = parseUnit(formData);
  if (!unit.name) throw new Error("Informe o nome da unidade.");
  await createUnit(unit);
  revalidate(unitPaths);
}

export async function updateUnitAction(formData: FormData) {
  await requireAdminUser("/admin/unidades");
  const unit = parseUnit(formData);
  if (!unit.name) throw new Error("Informe o nome da unidade.");
  await updateUnit(idField(formData), unit);
  revalidate(unitPaths);
}

export async function deleteUnitAction(formData: FormData) {
  await requireAdminUser("/admin/unidades");
  await deleteUnit(idField(formData));
  revalidate(unitPaths);
  redirect("/admin/unidades");
}
