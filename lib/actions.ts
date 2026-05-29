"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/auth";
import { createProduct, deleteProduct, updateProduct, type ProductMutationInput } from "@/lib/products";

async function parseProduct(formData: FormData): Promise<ProductMutationInput> {
  const priceValue = String(formData.get("price") ?? "").replace(",", ".");
  const imageFile = formData.get("image_blob");
  const hasImageFile =
    typeof imageFile === "object" &&
    imageFile !== null &&
    "arrayBuffer" in imageFile &&
    "size" in imageFile &&
    Number(imageFile.size) > 0;

  const product: ProductMutationInput = {
    name: String(formData.get("name") ?? "").trim(),
    company: String(formData.get("company") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    size: String(formData.get("size") ?? "").trim(),
    price: priceValue ? Number(priceValue) : null,
    active: formData.get("active") === "on",
    // ensure image_url is always present to satisfy ProductMutationInput
    image_url: String(formData.get("image_url") ?? "")
  };

  if (hasImageFile) {
    const file = imageFile as Blob;
    const buffer = Buffer.from(await file.arrayBuffer());
    product.image_blob = `\\x${buffer.toString("hex")}`;
    product.image_mime_type = file.type || "application/octet-stream";
  }

  return product;
}

export async function createProductAction(formData: FormData) {
  await requireAdminUser();
  await createProduct(await parseProduct(formData));
  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath("/admin/produtos");
  redirect("/admin/produtos");
}

export async function updateProductAction(formData: FormData) {
  await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  await updateProduct(id, await parseProduct(formData));
  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath("/admin/produtos");
  redirect("/admin/produtos");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  await deleteProduct(id);
  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath("/admin/produtos");
}
