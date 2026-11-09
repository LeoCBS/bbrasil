"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, updateClient, deleteClient } from "./clients";
import { createProduct, updateProduct, deleteProduct } from "./products";
import { createCategory, updateCategory, deleteCategory } from "./categories";
import { createUnit, updateUnit, deleteUnit } from "./units";
import { createProfile, updateProfile, deleteProfile } from "./profiles";
import { createOrder, updateOrder, deleteOrder } from "./orders";
import { createReceivable, updateReceivable, deleteReceivable, markAsPaid as markReceivableAsPaid } from "./receivables";
import { createPayable, updatePayable, deletePayable, markAsPaid as markPayableAsPaid } from "./payables";
import { createNFeTechnicalResponsible, updateNFeTechnicalResponsible, deleteNFeTechnicalResponsible } from "./nfe-technical-responsible";
import { requireAdminUser } from "@/auth";
import { emitNFeForOrder, type EmitNFeResult } from "@/lib/nfe-emission";
import { getNFeEnvironment } from "@/lib/nfe-config";

// Helper function to remove Next.js action tracking fields
// (progressive-enhancement forms send hidden inputs like $ACTION_ID_<hash>)
function cleanFormData(data: any): any {
  const cleaned = { ...data };
  for (const key of Object.keys(cleaned)) {
    if (key.startsWith("$ACTION")) delete cleaned[key];
  }
  delete cleaned.id; // Remove id to avoid updating auto-increment columns
  return cleaned;
}

export async function createClientAction(formData: FormData) {
  await createClient(cleanFormData(Object.fromEntries(formData) as any));
  revalidatePath("/admin/clientes");
}

export async function updateClientAction(formData: FormData) {
  const id = formData.get("id") as string;
  await updateClient(id, cleanFormData(Object.fromEntries(formData) as any));
  revalidatePath("/admin/clientes");
}

export async function deleteClientAction(formData: FormData) {
  const id = formData.get("id") as string;
  await deleteClient(id);
  revalidatePath("/admin/clientes");
}

export async function createProductAction(formData: FormData) {
  await createProduct(cleanFormData(Object.fromEntries(formData) as any), formData.get("image") as FormDataEntryValue);
  revalidatePath("/admin/produtos");
}

export async function updateProductAction(formData: FormData) {
  const id = formData.get("id") as string;
  await updateProduct(id, cleanFormData(Object.fromEntries(formData) as any), formData.get("image") as FormDataEntryValue);
  revalidatePath("/admin/produtos");
}

export async function deleteProductAction(formData: FormData) {
  const id = formData.get("id") as string;
  await deleteProduct(id);
  revalidatePath("/admin/produtos");
}

export async function createCategoryAction(formData: FormData) {
  await createCategory(cleanFormData(Object.fromEntries(formData) as any));
  revalidatePath("/admin/categorias");
}

export async function updateCategoryAction(formData: FormData) {
  const id = formData.get("id") as string;
  await updateCategory(id, cleanFormData(Object.fromEntries(formData) as any));
  revalidatePath("/admin/categorias");
}

export async function deleteCategoryAction(formData: FormData) {
  const id = formData.get("id") as string;
  await deleteCategory(id);
  revalidatePath("/admin/categorias");
}

export async function createUnitAction(formData: FormData) {
  await createUnit(cleanFormData(Object.fromEntries(formData) as any));
  revalidatePath("/admin/unidades");
}

export async function updateUnitAction(formData: FormData) {
  const id = formData.get("id") as string;
  await updateUnit(id, cleanFormData(Object.fromEntries(formData) as any));
  revalidatePath("/admin/unidades");
}

export async function deleteUnitAction(formData: FormData) {
  const id = formData.get("id") as string;
  await deleteUnit(id);
  revalidatePath("/admin/unidades");
}

export async function createProfileAction(formData: FormData) {
  await createProfile(cleanFormData(Object.fromEntries(formData) as any));
  revalidatePath("/admin/usuarios");
}

export async function updateProfileAction(formData: FormData) {
  const id = formData.get("id") as string;
  await updateProfile(id, cleanFormData(Object.fromEntries(formData) as any));
  revalidatePath("/admin/usuarios");
}

export async function deleteProfileAction(formData: FormData) {
  const id = formData.get("id") as string;
  await deleteProfile(id);
  revalidatePath("/admin/usuarios");
}

export async function createOrderAction(formData: FormData) {
  const data = cleanFormData(Object.fromEntries(formData) as any);
  // Parse items from JSON string
  if (data.items) {
    data.items = JSON.parse(data.items);
  }
  await createOrder(data);
  revalidatePath("/admin/pedidos");
  redirect("/admin/pedidos");
}

export async function updateOrderAction(formData: FormData) {
  const id = formData.get("id") as string;
  const data = cleanFormData(Object.fromEntries(formData) as any);
  // Parse items from JSON string
  if (data.items) {
    data.items = JSON.parse(data.items);
  }
  await updateOrder(parseInt(id, 10), data);
  revalidatePath("/admin/pedidos");
  redirect("/admin/pedidos");
}

export async function deleteOrderAction(formData: FormData) {
  const id = formData.get("id") as string;
  await deleteOrder(parseInt(id, 10));
  revalidatePath("/admin/pedidos");
}

export async function createReceivableAction(formData: FormData) {
  await createReceivable(cleanFormData(Object.fromEntries(formData) as any));
  revalidatePath("/admin/contas-receber");
}

export async function updateReceivableAction(formData: FormData) {
  const id = formData.get("id") as string;
  await updateReceivable(id, cleanFormData(Object.fromEntries(formData) as any));
  revalidatePath("/admin/contas-receber");
}

export async function deleteReceivableAction(formData: FormData) {
  const id = formData.get("id") as string;
  await deleteReceivable(id);
  revalidatePath("/admin/contas-receber");
}

export async function createPayableAction(formData: FormData) {
  await createPayable(cleanFormData(Object.fromEntries(formData) as any));
  revalidatePath("/admin/contas-pagar");
}

export async function updatePayableAction(formData: FormData) {
  const id = formData.get("id") as string;
  await updatePayable(id, cleanFormData(Object.fromEntries(formData) as any));
  revalidatePath("/admin/contas-pagar");
}

export async function deletePayableAction(formData: FormData) {
  const id = formData.get("id") as string;
  await deletePayable(id);
  revalidatePath("/admin/contas-pagar");
}

export async function markAsPaidReceivableAction(formData: FormData) {
  const id = parseInt(formData.get("id") as string, 10);
  const paymentDate = formData.get("payment_date") as string;
  await markReceivableAsPaid(id, paymentDate);
  revalidatePath("/admin/contas-receber");
}

export async function markAsPaidPayableAction(formData: FormData) {
  const id = parseInt(formData.get("id") as string, 10);
  const paymentDate = formData.get("payment_date") as string;
  await markPayableAsPaid(id, paymentDate);
  revalidatePath("/admin/contas-pagar");
}

export async function createNFeTechnicalResponsibleAction(formData: FormData) {
  await createNFeTechnicalResponsible(cleanFormData(Object.fromEntries(formData) as any));
  revalidatePath("/admin/responsavel-tecnico-nfe");
}

export async function updateNFeTechnicalResponsibleAction(formData: FormData) {
  const id = formData.get("id") as string;
  await updateNFeTechnicalResponsible(id, cleanFormData(Object.fromEntries(formData) as any));
  revalidatePath("/admin/responsavel-tecnico-nfe");
}

export async function deleteNFeTechnicalResponsibleAction(formData: FormData) {
  const id = formData.get("id") as string;
  await deleteNFeTechnicalResponsible(id);
  revalidatePath("/admin/responsavel-tecnico-nfe");
}

function isNextControlFlowError(error: unknown): boolean {
  const digest = (error as { digest?: unknown })?.digest;
  return typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND"));
}

export async function emitNFeOrderAction(orderId: number): Promise<EmitNFeResult> {
  let environment: EmitNFeResult["environment"] = "homologation";
  try {
    environment = getNFeEnvironment();
  } catch { /* Invalid backend config is returned below. */ }

  try {
    await requireAdminUser("/admin/pedidos");
    return await emitNFeForOrder(orderId);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    const message = error instanceof Error ? error.message : "Erro desconhecido ao emitir NF-e.";
    console.error("Falha inesperada ao emitir NF-e:", error);
    const status = /URL|NFE_ENVIRONMENT|responsável|responsavel|cadastre|certificado|assinatura|xml|configure/i.test(message)
      ? "configuration_error"
      : "communication_error";
    return { status, message, environment };
  }
}
