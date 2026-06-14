"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/auth";
import { createProduct, deleteProduct, updateProduct, type ProductMutationInput } from "@/lib/products";

async function parseProduct(formData: FormData): Promise<ProductMutationInput> {
  const priceValue = String(formData.get("price") ?? "").replace(",", ".");

  const product: ProductMutationInput = {
    name: String(formData.get("name") ?? "").trim(),
    company: String(formData.get("company") ?? "").trim(),
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
