"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/auth";
import { createCategory, deleteCategory, updateCategory, type CategoryMutationInput } from "@/lib/categories";
import { createProduct, deleteProduct, updateProduct, type ProductMutationInput } from "@/lib/products";

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
  const priceValue = String(formData.get("price") ?? "").replace(",", ".");

  const product: ProductMutationInput = {
    name: String(formData.get("name") ?? "").trim(),
    company: String(formData.get("company") ?? "").trim(),
    category_id: String(formData.get("category_id") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    size: String(formData.get("size") ?? "").trim(),
    price: priceValue ? Number(priceValue) : null,
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
  redirect("/admin/produtos?aba=categorias");
}

export async function updateCategoryAction(formData: FormData) {
  await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  await updateCategory(id, parseCategory(formData));
  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath("/admin/produtos");
  redirect("/admin/produtos?aba=categorias");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  await deleteCategory(id);
  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath("/admin/produtos");
  redirect("/admin/produtos?aba=categorias");
}
