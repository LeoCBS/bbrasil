"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/auth";
import { createCategory, deleteCategory, updateCategory, type CategoryMutationInput } from "@/lib/categories";
import { createProduct, deleteProduct, updateProduct, type ProductMutationInput } from "@/lib/products";
import { createClient, deleteClient, updateClient, type ClientMutationInput } from "@/lib/clients";
import { createUnit, deleteUnit, updateUnit, type UnitInput } from "@/lib/units";
import { createOrder, deleteOrder, updateOrder, type OrderMutationInput } from "@/lib/orders";
import { createQuotation, deleteQuotation, updateQuotation, convertQuotationToOrder, type QuotationMutationInput } from "@/lib/quotations";
import { createReceivable, deleteReceivable, updateReceivable, markAsPaid as markReceivableAsPaid, type ReceivableMutationInput } from "@/lib/receivables";
import { createPayable, deletePayable, updatePayable, markAsPaid as markPayableAsPaid, type PayableMutationInput } from "@/lib/payables";
import { checkboxField, currencyField, digitsField, numberField, textField } from "@/lib/form-data";
import { isValidCnpj } from "@/lib/format";

const catalogPaths = ["/", "/produtos", "/admin/produtos"];
const categoryPaths = [...catalogPaths, "/admin/categorias"];
const unitPaths = ["/", "/produtos", "/admin/unidades"];
const orderPaths = ["/admin/pedidos"];
const quotationPaths = ["/admin/orcamentos"];
const receivablePaths = ["/admin/contas-receber"];
const payablePaths = ["/admin/contas-pagar"];

function revalidate(paths: string[]) {
  for (const path of paths) {
    revalidatePath(path);
  }
}

function idField(formData: FormData) {
  return String(formData.get("id") ?? "");
}

function numericIdField(formData: FormData) {
  const value = formData.get("id");
  return value ? Number(value) : 0;
}

function parseCategory(formData: FormData): CategoryMutationInput {
  return {
    name: textField(formData, "name"),
    description: textField(formData, "description"),
    icon: textField(formData, "icon", "package"),
    sort_order: numberField(formData, "sort_order", 0)?? 0,
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
    unit: textField(formData, "unit"),
    stock: numberField(formData, "stock", null),
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
    profile_id: textField(formData, "profile_id"),
    unit: "",
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

function parseOrder(formData: FormData): OrderMutationInput {
  const itemsJson = String(formData.get("items") ?? "[]");
  let items;
  try {
    items = JSON.parse(itemsJson);
  } catch {
    items = [];
  }

  const totalAmountStr = String(formData.get("total_amount") ?? "0");
  let totalAmount = 0;
  try {
    totalAmount = parseFloat(totalAmountStr) || 0;
  } catch {
    totalAmount = 0;
  }

  return {
    user_id: textField(formData, "user_id"),
    user_name: textField(formData, "user_name"),
    user_email: textField(formData, "user_email"),
    client_id: textField(formData, "client_id"),
    client_name: textField(formData, "client_name"),
    client_cnpj: textField(formData, "client_cnpj"),
    client_salesperson_id: textField(formData, "client_salesperson_id"),
    client_salesperson_name: textField(formData, "client_salesperson_name"),
    unit_id: textField(formData, "unit_id"),
    unit_name: textField(formData, "unit_name"),
    observation: textField(formData, "observation"),
    total_amount: totalAmount,
    items
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

export async function createOrderAction(formData: FormData) {
  await requireAdminUser("/admin/pedidos");
  const order = parseOrder(formData);
  if (!order.client_id) throw new Error("Selecione um cliente para o pedido.");
  if (!order.unit_id) throw new Error("Informe a unidade do pedido.");
  if (!order.items || order.items.length === 0) throw new Error("Adicione pelo menos um produto ao pedido.");
  await createOrder(order);
  revalidate(orderPaths);
}

export async function updateOrderAction(formData: FormData) {
  await requireAdminUser("/admin/pedidos");
  const order = parseOrder(formData);
  if (!order.client_id) throw new Error("Selecione um cliente para o pedido.");
  if (!order.unit_id) throw new Error("Informe a unidade do pedido.");
  if (!order.items || order.items.length === 0) throw new Error("Adicione pelo menos um produto ao pedido.");
  await updateOrder(numericIdField(formData), order);
  revalidate(orderPaths);
}

export async function deleteOrderAction(formData: FormData) {
  await requireAdminUser("/admin/pedidos");
  await deleteOrder(numericIdField(formData));
  revalidate(orderPaths);
}

function parseQuotation(formData: FormData): QuotationMutationInput {
  const itemsJson = String(formData.get("items") ?? "[]");
  let items;
  try {
    items = JSON.parse(itemsJson);
  } catch {
    items = [];
  }

  const totalAmountStr = String(formData.get("total_amount") ?? "0");
  let totalAmount = 0;
  try {
    totalAmount = parseFloat(totalAmountStr) || 0;
  } catch {
    totalAmount = 0;
  }

  return {
    user_id: textField(formData, "user_id"),
    user_name: textField(formData, "user_name"),
    user_email: textField(formData, "user_email"),
    client_id: textField(formData, "client_id"),
    client_name: textField(formData, "client_name"),
    client_cnpj: textField(formData, "client_cnpj"),
    client_salesperson_id: textField(formData, "client_salesperson_id"),
    client_salesperson_name: textField(formData, "client_salesperson_name"),
    unit_id: textField(formData, "unit_id"),
    unit_name: textField(formData, "unit_name"),
    status: String(formData.get("status") ?? "pending") as 'pending' | 'approved' | 'rejected' | 'converted',
    observation: textField(formData, "observation"),
    total_amount: totalAmount,
    valid_until: textField(formData, "valid_until"),
    items
  };
}

export async function createQuotationAction(formData: FormData) {
  await requireAdminUser("/admin/orcamentos");
  const quotation = parseQuotation(formData);
  if (!quotation.client_id) throw new Error("Selecione um cliente para o orçamento.");
  if (!quotation.unit_id) throw new Error("Informe a unidade do orçamento.");
  if (!quotation.items || quotation.items.length === 0) throw new Error("Adicione pelo menos um produto ao orçamento.");
  await createQuotation(quotation);
  revalidate(quotationPaths);
}

export async function updateQuotationAction(formData: FormData) {
  await requireAdminUser("/admin/orcamentos");
  const quotation = parseQuotation(formData);
  if (!quotation.client_id) throw new Error("Selecione um cliente para o orçamento.");
  if (!quotation.unit_id) throw new Error("Informe a unidade do orçamento.");
  if (!quotation.items || quotation.items.length === 0) throw new Error("Adicione pelo menos um produto ao orçamento.");
  await updateQuotation(numericIdField(formData), quotation);
  revalidate(quotationPaths);
}

export async function deleteQuotationAction(formData: FormData) {
  await requireAdminUser("/admin/orcamentos");
  await deleteQuotation(numericIdField(formData));
  revalidate(quotationPaths);
}

export async function convertQuotationToOrderAction(formData: FormData) {
  await requireAdminUser("/admin/pedidos");
  const quotationId = numericIdField(formData);
  if (!quotationId) throw new Error("ID do orçamento ausente");
  
  const orderId = await convertQuotationToOrder(quotationId);
  revalidate(quotationPaths);
  revalidate(orderPaths);
  
  return orderId;
}

function parseReceivable(formData: FormData): ReceivableMutationInput {
  const amountStr = String(formData.get("amount") ?? "0");
  let amount = 0;
  try {
    amount = parseFloat(amountStr) || 0;
  } catch {
    amount = 0;
  }

  const statusValue = String(formData.get("status") ?? "pending");
  let status: 'pending' | 'paid' | 'overdue' | 'cancelled' = 'pending';
  if (statusValue === 'paid') status = 'paid';
  if (statusValue === 'overdue') status = 'overdue';
  if (statusValue === 'cancelled') status = 'cancelled';

  return {
    order_id: numericIdField(formData),
    order_reference: textField(formData, "order_reference"),
    client_id: textField(formData, "client_id"),
    client_name: textField(formData, "client_name"),
    client_cnpj: textField(formData, "client_cnpj"),
    amount: amount,
    due_date: textField(formData, "due_date"),
    payment_date: textField(formData, "payment_date"),
    status: status,
    unit_id: textField(formData, "unit_id"),
    unit_name: textField(formData, "unit_name"),
    observation: textField(formData, "observation"),
    user_id: textField(formData, "user_id"),
    user_name: textField(formData, "user_name"),
    user_email: textField(formData, "user_email")
  };
}

export async function createReceivableAction(formData: FormData) {
  await requireAdminUser("/admin/contas-receber");
  const receivable = parseReceivable(formData);
  if (!receivable.client_name) throw new Error("Informe o nome do cliente.");
  if (!receivable.unit_id) throw new Error("Informe a unidade.");
  await createReceivable(receivable);
  revalidate(receivablePaths);
}

export async function updateReceivableAction(formData: FormData) {
  await requireAdminUser("/admin/contas-receber");
  const receivable = parseReceivable(formData);
  if (!receivable.client_name) throw new Error("Informe o nome do cliente.");
  if (!receivable.unit_id) throw new Error("Informe a unidade.");
  await updateReceivable(numericIdField(formData), receivable);
  revalidate(receivablePaths);
}

export async function deleteReceivableAction(formData: FormData) {
  await requireAdminUser("/admin/contas-receber");
  await deleteReceivable(numericIdField(formData));
  revalidate(receivablePaths);
}

export async function markAsPaidReceivableAction(formData: FormData) {
  await requireAdminUser("/admin/contas-receber");
  const id = numericIdField(formData);
  const paymentDate = String(formData.get("payment_date") ?? new Date().toISOString().split('T')[0]);
  await markReceivableAsPaid(id, paymentDate);
  revalidate(receivablePaths);
}

function parsePayable(formData: FormData): PayableMutationInput {
  const amountStr = String(formData.get("amount") ?? "0");
  let amount = 0;
  try {
    amount = parseFloat(amountStr) || 0;
  } catch {
    amount = 0;
  }

  const statusValue = String(formData.get("status") ?? "pending");
  let status: 'pending' | 'paid' | 'overdue' | 'cancelled' = 'pending';
  if (statusValue === 'paid') status = 'paid';
  if (statusValue === 'overdue') status = 'overdue';
  if (statusValue === 'cancelled') status = 'cancelled';

  return {
    supplier_name: textField(formData, "supplier_name"),
    supplier_cnpj: textField(formData, "supplier_cnpj"),
    supplier_address: textField(formData, "supplier_address"),
    description: textField(formData, "description"),
    amount: amount,
    due_date: textField(formData, "due_date"),
    payment_date: textField(formData, "payment_date"),
    status: status,
    category: textField(formData, "category"),
    payment_method: textField(formData, "payment_method"),
    unit_id: textField(formData, "unit_id"),
    unit_name: textField(formData, "unit_name"),
    observation: textField(formData, "observation"),
    user_id: textField(formData, "user_id"),
    user_name: textField(formData, "user_name"),
    user_email: textField(formData, "user_email")
  };
}

export async function createPayableAction(formData: FormData) {
  await requireAdminUser("/admin/contas-pagar");
  const payable = parsePayable(formData);
  if (!payable.supplier_name) throw new Error("Informe o nome do fornecedor.");
  if (!payable.description) throw new Error("Informe a descrição.");
  if (!payable.unit_id) throw new Error("Informe a unidade.");
  await createPayable(payable);
  revalidate(payablePaths);
}

export async function updatePayableAction(formData: FormData) {
  await requireAdminUser("/admin/contas-pagar");
  const payable = parsePayable(formData);
  if (!payable.supplier_name) throw new Error("Informe o nome do fornecedor.");
  if (!payable.description) throw new Error("Informe a descrição.");
  if (!payable.unit_id) throw new Error("Informe a unidade.");
  await updatePayable(numericIdField(formData), payable);
  revalidate(payablePaths);
}

export async function deletePayableAction(formData: FormData) {
  await requireAdminUser("/admin/contas-pagar");
  await deletePayable(numericIdField(formData));
  revalidate(payablePaths);
}

export async function markAsPaidPayableAction(formData: FormData) {
  await requireAdminUser("/admin/contas-pagar");
  const id = numericIdField(formData);
  const paymentDate = String(formData.get("payment_date") ?? new Date().toISOString().split('T')[0]);
  await markPayableAsPaid(id, paymentDate);
  revalidate(payablePaths);
}
