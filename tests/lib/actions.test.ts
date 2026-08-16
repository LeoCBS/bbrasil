import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/auth";
import { createCategory, deleteCategory, updateCategory } from "@/lib/categories";
import { createClient, deleteClient, updateClient } from "@/lib/clients";
import { createProduct, deleteProduct, updateProduct } from "@/lib/products";
import { createSalesperson, deleteSalesperson, updateSalesperson } from "@/lib/salespeople";
import { createUnit, deleteUnit, updateUnit } from "@/lib/units";
import {
  createCategoryAction,
  createClientAction,
  createProductAction,
  createSalespersonAction,
  createUnitAction,
  deleteCategoryAction,
  deleteClientAction,
  deleteProductAction,
  deleteSalespersonAction,
  deleteUnitAction,
  updateCategoryAction,
  updateClientAction,
  updateProductAction,
  updateSalespersonAction,
  updateUnitAction
} from "@/lib/actions";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/auth", () => ({ requireAdminUser: vi.fn(async () => ({ id: "admin" })) }));
vi.mock("@/lib/categories", () => ({
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn()
}));
vi.mock("@/lib/clients", () => ({ createClient: vi.fn(), updateClient: vi.fn(), deleteClient: vi.fn() }));
vi.mock("@/lib/products", () => ({ createProduct: vi.fn(), updateProduct: vi.fn(), deleteProduct: vi.fn() }));
vi.mock("@/lib/salespeople", () => ({
  createSalesperson: vi.fn(),
  updateSalesperson: vi.fn(),
  deleteSalesperson: vi.fn()
}));
vi.mock("@/lib/units", () => ({ createUnit: vi.fn(), updateUnit: vi.fn(), deleteUnit: vi.fn() }));

const VALID_CNPJ = "12.345.678/0001-95";

function formData(entries: Record<string, string>) {
  const data = new FormData();
  Object.entries(entries).forEach(([key, value]) => data.set(key, value));
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("product actions", () => {
  it("parses and trims the product fields", async () => {
    await createProductAction(
      formData({
        code: " ABC-1 ",
        name: " Detergente ",
        unit_id: " unit-1 ",
        category_id: " cat-1 ",
        description: " Limpa tudo ",
        size: " 5L ",
        price: "R$ 1.234,56",
        cost_price: "999,90",
        active: "on",
        image_url: "https://cdn/img.png"
      })
    );

    expect(requireAdminUser).toHaveBeenCalled();
    expect(createProduct).toHaveBeenCalledWith(
      {
        code: "ABC-1",
        name: "Detergente",
        unit_id: "unit-1",
        category_id: "cat-1",
        description: "Limpa tudo",
        size: "5L",
        price: 1234.56,
        cost_price: 999.9,
        active: true,
        image_url: "https://cdn/img.png"
      },
      ""
    );
    expect(revalidatePath).toHaveBeenCalledWith("/produtos");
  });

  it("defaults missing fields and treats an unchecked active box as inactive", async () => {
    await createProductAction(formData({}));

    expect(createProduct).toHaveBeenCalledWith(
      {
        code: "",
        name: "",
        unit_id: "",
        category_id: "",
        description: "",
        size: "",
        price: null,
        cost_price: null,
        active: false,
        image_url: ""
      },
      ""
    );
  });

  it("returns null for a blank price and for values without digits", async () => {
    await createProductAction(formData({ price: "   ", cost_price: "abc" }));

    expect(createProduct).toHaveBeenCalledWith(expect.objectContaining({ price: null, cost_price: null }), "");
  });

  it("forwards the uploaded image and the product id on update", async () => {
    const data = formData({ id: "p-1", name: "Detergente" });
    const file = new File(["conteudo"], "foto.png", { type: "image/png" });
    data.set("image_blob", file);

    await updateProductAction(data);

    expect(updateProduct).toHaveBeenCalledWith("p-1", expect.objectContaining({ name: "Detergente" }), file);
  });

  it("deletes a product by id", async () => {
    await deleteProductAction(formData({ id: "p-1" }));

    expect(deleteProduct).toHaveBeenCalledWith("p-1");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/produtos");
  });
});

describe("category actions", () => {
  it("parses the category fields with defaults", async () => {
    await createCategoryAction(formData({ name: " EPI ", sort_order: "30", active: "on" }));

    expect(createCategory).toHaveBeenCalledWith({
      name: "EPI",
      description: "",
      icon: "package",
      sort_order: 30,
      active: true
    });
    expect(redirect).toHaveBeenCalledWith("/admin/categorias");
  });

  it("falls back to zero when sort_order is not a number", async () => {
    await createCategoryAction(formData({ name: "EPI", sort_order: "abc" }));

    expect(createCategory).toHaveBeenCalledWith(expect.objectContaining({ sort_order: 0, active: false }));
  });

  it("updates and deletes categories by id", async () => {
    await updateCategoryAction(formData({ id: "c-1", name: "EPI", icon: " shield " }));
    expect(updateCategory).toHaveBeenCalledWith("c-1", expect.objectContaining({ icon: "shield" }));

    await deleteCategoryAction(formData({ id: "c-1" }));
    expect(deleteCategory).toHaveBeenCalledWith("c-1");
  });
});

describe("client actions", () => {
  it("uppercases the state and keeps the unit empty", async () => {
    await createClientAction(formData({ corporate_name: " Padaria ", cnpj: VALID_CNPJ, state: "sc", active: "on" }));

    expect(requireAdminUser).toHaveBeenCalledWith("/admin/clientes");
    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({ corporate_name: "Padaria", state: "SC", unit: "", active: true })
    );
  });

  it.each([
    ["empty", ""],
    ["too short", "123"],
    ["repeated digits", "11.111.111/1111-11"],
    ["wrong first check digit", "12.345.678/0001-05"],
    ["wrong second check digit", "12.345.678/0001-91"]
  ])("rejects an invalid cnpj (%s)", async (_name, cnpj) => {
    await expect(createClientAction(formData({ cnpj }))).rejects.toThrow("Informe um CNPJ válido.");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("accepts a cnpj without punctuation", async () => {
    await createClientAction(formData({ cnpj: "12345678000195" }));

    expect(createClient).toHaveBeenCalled();
  });

  it("validates the cnpj before updating", async () => {
    await expect(updateClientAction(formData({ id: "c-1", cnpj: "123" }))).rejects.toThrow("Informe um CNPJ válido.");

    await updateClientAction(formData({ id: "c-1", cnpj: VALID_CNPJ }));
    expect(updateClient).toHaveBeenCalledWith("c-1", expect.objectContaining({ cnpj: VALID_CNPJ }));
  });

  it("deletes a client and redirects back to the list", async () => {
    await deleteClientAction(formData({ id: "c-1" }));

    expect(deleteClient).toHaveBeenCalledWith("c-1");
    expect(redirect).toHaveBeenCalledWith("/admin/clientes");
  });
});

describe("salesperson actions", () => {
  it("requires the name", async () => {
    await expect(createSalespersonAction(formData({ name: "   " }))).rejects.toThrow("Informe o nome do vendedor.");
    await expect(updateSalespersonAction(formData({ id: "s-1" }))).rejects.toThrow("Informe o nome do vendedor.");
    expect(createSalesperson).not.toHaveBeenCalled();
    expect(updateSalesperson).not.toHaveBeenCalled();
  });

  it("creates, updates and deletes salespeople", async () => {
    await createSalespersonAction(formData({ name: " Ana ", email: " ana@test.com ", unit_id: "unit-1", active: "on" }));
    expect(createSalesperson).toHaveBeenCalledWith({
      name: "Ana",
      email: "ana@test.com",
      phone: "",
      unit_id: "unit-1",
      active: true
    });

    await updateSalespersonAction(formData({ id: "s-1", name: "Ana" }));
    expect(updateSalesperson).toHaveBeenCalledWith("s-1", expect.objectContaining({ name: "Ana", active: false }));

    await deleteSalespersonAction(formData({ id: "s-1" }));
    expect(deleteSalesperson).toHaveBeenCalledWith("s-1");
    expect(redirect).toHaveBeenCalledWith("/admin/vendedores");
  });
});

describe("unit actions", () => {
  it("requires the name", async () => {
    await expect(createUnitAction(formData({}))).rejects.toThrow("Informe o nome da unidade.");
    await expect(updateUnitAction(formData({ id: "unit-1" }))).rejects.toThrow("Informe o nome da unidade.");
  });

  it("keeps only the digits of the whatsapp number", async () => {
    await createUnitAction(formData({ name: " JOINVILLE SC ", whatsapp_number: "+55 (47) 3026-6607", active: "on" }));

    expect(createUnit).toHaveBeenCalledWith({
      name: "JOINVILLE SC",
      address: "",
      phone: "",
      whatsapp_number: "554730266607",
      email: "",
      active: true
    });
  });

  it("updates and deletes units by id", async () => {
    await updateUnitAction(formData({ id: "unit-1", name: "JOINVILLE SC" }));
    expect(updateUnit).toHaveBeenCalledWith("unit-1", expect.objectContaining({ name: "JOINVILLE SC" }));

    await deleteUnitAction(formData({ id: "unit-1" }));
    expect(deleteUnit).toHaveBeenCalledWith("unit-1");
    expect(redirect).toHaveBeenCalledWith("/admin/unidades");
  });
});
