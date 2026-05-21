"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createProduct, deleteProduct, updateProduct, type ProductInput } from "@/lib/products";

function parseProduct(formData: FormData): ProductInput {
  const priceValue = String(formData.get("price") ?? "").replace(",", ".");

  return {
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    size: String(formData.get("size") ?? "").trim(),
    price: priceValue ? Number(priceValue) : null,
    image_url: String(formData.get("image_url") ?? "").trim() || null,
    active: formData.get("active") === "on"
  };
}

export async function createProductAction(formData: FormData) {
  await createProduct(parseProduct(formData));
  revalidatePath("/");
  revalidatePath("/admin/produtos");
  redirect("/admin/produtos");
}

export async function updateProductAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await updateProduct(id, parseProduct(formData));
  revalidatePath("/");
  revalidatePath("/admin/produtos");
  redirect("/admin/produtos");
}

export async function deleteProductAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await deleteProduct(id);
  revalidatePath("/");
  revalidatePath("/admin/produtos");
}
