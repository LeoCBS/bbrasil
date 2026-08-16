import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { clearSupabaseEnv, createSupabaseStub, setSupabaseEnv } from "../helpers/supabase";
import {
  createProduct,
  deleteProduct,
  getPaginatedProducts,
  getProduct,
  getProducts,
  updateProduct,
  type ProductMutationInput
} from "@/lib/products";

vi.mock("next/cache", () => ({ unstable_noStore: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));

const createClientMock = createClient as unknown as Mock;

const productInput: ProductMutationInput = {
  code: "ABC-1",
  unit: null,
  name: "Detergente",
  unit_id: "unit-joinville",
  category_id: "cat-1",
  description: "Descricao",
  size: "5L",
  stock: 10,
  cost_price: 20,
  price: 48.9,
  image_url: "",
  active: true
};

const missingConfigMessage = "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para usar o admin.";

function fakeImageFile({ name = "Foto Produto Ação.PNG", size = 4, type = "image/png" } = {}) {
  return {
    name,
    size,
    type,
    arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer
  } as unknown as FormDataEntryValue;
}

beforeEach(() => {
  vi.clearAllMocks();
  setSupabaseEnv();
});

afterEach(() => {
  clearSupabaseEnv();
});

describe("getProducts without supabase", () => {
  beforeEach(() => {
    clearSupabaseEnv();
  });

  it("returns the active demo products", async () => {
    const products = await getProducts();

    expect(products).toHaveLength(3);
    expect(products.every((product) => product.active)).toBe(true);
  });

  it("filters by unit", async () => {
    const products = await getProducts({ unitId: "unit-joinville" });

    expect(products.map((product) => product.name)).toEqual(["Limpador Multiuso"]);
  });

  it("matches the search across name, description, category and unit ignoring accents", async () => {
    await expect(getProducts({ search: "MULTIUSO" })).resolves.toHaveLength(1);
    await expect(getProducts({ search: "concentrada" })).resolves.toHaveLength(1);
    await expect(getProducts({ search: "higiene pessoal" })).resolves.toHaveLength(1);
    await expect(getProducts({ search: "itajai sc" })).resolves.toHaveLength(1);
    await expect(getProducts({ search: "nao existe" })).resolves.toHaveLength(0);
  });
});

describe("getProducts with supabase", () => {
  it("normalizes joined category and unit names", async () => {
    const stub = createSupabaseStub({
      data: [
        {
          id: "p-1",
          name: "Detergente",
          categories: [{ name: "LIMPEZA E HIGIENE" }],
          units: { name: "JOINVILLE SC" },
          unit_id: "unit-joinville"
        }
      ],
      error: null
    });
    createClientMock.mockReturnValue(stub.client);

    const [product] = await getProducts();

    expect(product).toMatchObject({
      id: "p-1",
      category: "LIMPEZA E HIGIENE",
      unit_name: "JOINVILLE SC",
      code: null,
      unit: null,
      stock: null,
      cost_price: null,
      image_blob: null,
      image_mime_type: null,
      image_url: null
    });
  });

  it("uses placeholders when the joined relations are missing", async () => {
    const stub = createSupabaseStub({ data: [{ id: "p-2", name: "Sem relacoes" }], error: null });
    createClientMock.mockReturnValue(stub.client);

    const [product] = await getProducts();

    expect(product).toMatchObject({ category: "Sem categoria", unit_name: "Unidade não definida", unit_id: "" });
  });

  it("converts a bytea image into a data url", async () => {
    const stub = createSupabaseStub({
      data: [{ id: "p-3", name: "Com imagem", image_blob: "\\x616263", image_mime_type: "image/png" }],
      error: null
    });
    createClientMock.mockReturnValue(stub.client);

    const [product] = await getProducts();

    expect(product.image_url).toBe(`data:image/png;base64,${Buffer.from("abc").toString("base64")}`);
  });

  it("keeps an existing image_url instead of decoding the blob", async () => {
    const stub = createSupabaseStub({
      data: [{ id: "p-4", name: "Com url", image_blob: "616263", image_mime_type: "image/png", image_url: "https://cdn/img.png" }],
      error: null
    });
    createClientMock.mockReturnValue(stub.client);

    const [product] = await getProducts();

    expect(product.image_url).toBe("https://cdn/img.png");
  });

  it("filters by active, unit and an escaped search pattern", async () => {
    const stub = createSupabaseStub({ data: [], error: null });
    createClientMock.mockReturnValue(stub.client);

    await getProducts({ unitId: "unit-1", search: " 50%_a,b " });

    expect(stub.builder.callsFor("eq")).toEqual([
      ["active", true],
      ["unit_id", "unit-1"]
    ]);
    expect(stub.builder.callsFor("or")).toEqual([
      ['name.ilike."%50\\%\\_a,b%",description.ilike."%50\\%\\_a,b%"']
    ]);
  });

  it("skips the active filter when inactive products are included", async () => {
    const stub = createSupabaseStub({ data: [], error: null });
    createClientMock.mockReturnValue(stub.client);

    await getProducts({ includeInactive: true });

    expect(stub.builder.callsFor("eq")).toEqual([]);
  });

  it("propagates the supabase error when the query fails", async () => {
    const stub = createSupabaseStub({ data: null, error: { message: "down" } });
    createClientMock.mockReturnValue(stub.client);

    await expect(getProducts({ search: "multiuso" })).rejects.toThrow("down");
  });
});

describe("getPaginatedProducts without supabase", () => {
  beforeEach(() => {
    clearSupabaseEnv();
  });

  it("paginates the demo products", async () => {
    const page = await getPaginatedProducts({ page: 2, pageSize: 2 });

    expect(page).toMatchObject({ total: 3, page: 2, pageSize: 2, totalPages: 2 });
    expect(page.products).toHaveLength(1);
  });

  it("filters by category ignoring accents and casing", async () => {
    const page = await getPaginatedProducts({ category: "higiene pessoal" });

    expect(page.products.map((product) => product.name)).toEqual(["Desinfetante Concentrado"]);
  });

  it("clamps invalid pagination values and out of range pages", async () => {
    await expect(getPaginatedProducts({ page: 0, pageSize: 0 })).resolves.toMatchObject({
      page: 1,
      pageSize: 1,
      totalPages: 3
    });
    await expect(getPaginatedProducts({ page: 99, pageSize: 2 })).resolves.toMatchObject({ page: 2, totalPages: 2 });
  });

  it("returns a single empty page when nothing matches", async () => {
    const page = await getPaginatedProducts({ category: "inexistente" });

    expect(page).toMatchObject({ products: [], total: 0, page: 1, totalPages: 1 });
  });
});

describe("getPaginatedProducts with supabase", () => {
  it("requests the page range and filters by category name", async () => {
    const stub = createSupabaseStub({ data: [{ id: "p-1", name: "Detergente" }], error: null, count: 25 });
    createClientMock.mockReturnValue(stub.client);

    const page = await getPaginatedProducts({ page: 2, pageSize: 9, category: "EPI" });

    expect(page).toMatchObject({ total: 25, page: 2, pageSize: 9, totalPages: 3 });
    expect(stub.builder.callsFor("range")).toEqual([[9, 17]]);
    expect(stub.builder.callsFor("eq")).toEqual([
      ["active", true],
      ["categories.name", "EPI"]
    ]);
  });

  it("retries with the last page when the requested page is out of range", async () => {
    const firstStub = createSupabaseStub({ data: [], error: null, count: 4 });
    const secondStub = createSupabaseStub({ data: [{ id: "p-9", name: "Ultimo" }], error: null, count: 4 });
    createClientMock.mockReturnValueOnce(firstStub.client).mockReturnValueOnce(secondStub.client);

    const page = await getPaginatedProducts({ page: 7, pageSize: 2 });

    expect(page).toMatchObject({ page: 2, totalPages: 2, total: 4 });
    expect(page.products.map((product) => product.id)).toEqual(["p-9"]);
    expect(secondStub.builder.callsFor("range")).toEqual([[2, 3]]);
  });

  it("propagates the supabase error when the paginated query fails", async () => {
    const stub = createSupabaseStub({ data: null, error: { message: "boom" }, count: null });
    createClientMock.mockReturnValue(stub.client);

    await expect(
      getPaginatedProducts({ category: "LIMPEZA E HIGIENE", search: "detergente" })
    ).rejects.toThrow("boom");
  });

  it("treats a missing count as an empty result", async () => {
    const stub = createSupabaseStub({ data: [], error: null, count: null });
    createClientMock.mockReturnValue(stub.client);

    await expect(getPaginatedProducts()).resolves.toMatchObject({ total: 0, totalPages: 1, page: 1 });
  });
});

describe("getProduct", () => {
  it("reads from the demo products when supabase is not configured", async () => {
    clearSupabaseEnv();

    await expect(getProduct("demo-1")).resolves.toMatchObject({ name: "Detergente Profissional" });
    await expect(getProduct("missing")).resolves.toBeNull();
  });

  it("fetches an active product by id", async () => {
    const stub = createSupabaseStub({ data: { id: "p-1", name: "Detergente" }, error: null });
    createClientMock.mockReturnValue(stub.client);

    await expect(getProduct("p-1")).resolves.toMatchObject({ id: "p-1", category: "Sem categoria" });
    expect(stub.builder.callsFor("eq")).toEqual([
      ["id", "p-1"],
      ["active", true]
    ]);
    expect(stub.builder.callsFor("limit")).toEqual([[1]]);
  });

  it("does not filter by active when inactive products are allowed", async () => {
    const stub = createSupabaseStub({ data: null, error: null });
    createClientMock.mockReturnValue(stub.client);

    await expect(getProduct("p-1", { includeInactive: true })).resolves.toBeNull();
    expect(stub.builder.callsFor("eq")).toEqual([["id", "p-1"]]);
  });

  it("propagates the supabase error when the fetch fails", async () => {
    const stub = createSupabaseStub({ data: null, error: { message: "nope" } });
    createClientMock.mockReturnValue(stub.client);

    await expect(getProduct("p-1")).rejects.toThrow("nope");
  });
});

describe("createProduct", () => {
  it("inserts the product with a generated id and no image", async () => {
    const stub = createSupabaseStub({ error: null });
    createClientMock.mockReturnValue(stub.client);

    await createProduct({ ...productInput }, "");

    const [payload] = stub.builder.callsFor("insert")[0] as [ProductMutationInput & { id: string }];
    expect(payload).toMatchObject({ name: "Detergente", image_url: "" });
    expect(payload.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(stub.storage.upload).not.toHaveBeenCalled();
  });

  it("uploads the image to a sanitized path and stores the public url", async () => {
    const stub = createSupabaseStub({ error: null }, { publicUrl: "https://cdn.test/produto.png" });
    createClientMock.mockReturnValue(stub.client);

    const input = { ...productInput, unit_id: "Unidade Joinville" };
    await createProduct(input, fakeImageFile());

    const [path, buffer, options] = stub.storage.upload.mock.calls[0] as [string, Buffer, { contentType: string; upsert: boolean }];
    expect(path).toMatch(/^unidade-joinville\/[0-9a-f-]{36}-foto-produto-acao\.png$/);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(options).toEqual({ contentType: "image/png", upsert: true });
    expect(input.image_url).toBe("https://cdn.test/produto.png");
    expect(stub.client.storage.from).toHaveBeenCalledWith("images");
  });

  it("ignores an empty file input", async () => {
    const stub = createSupabaseStub({ error: null });
    createClientMock.mockReturnValue(stub.client);

    await createProduct({ ...productInput }, fakeImageFile({ size: 0 }));

    expect(stub.storage.upload).not.toHaveBeenCalled();
  });

  it("propagates upload failures", async () => {
    const stub = createSupabaseStub({ error: null }, { uploadError: { message: "bucket cheio" } });
    createClientMock.mockReturnValue(stub.client);

    await expect(createProduct({ ...productInput }, fakeImageFile())).rejects.toThrow("bucket cheio");
    expect(stub.builder.callsFor("insert")).toEqual([]);
  });

  it("propagates insert failures", async () => {
    const stub = createSupabaseStub({ error: { message: "category_id inválido" } });
    createClientMock.mockReturnValue(stub.client);

    await expect(createProduct({ ...productInput }, "")).rejects.toThrow("category_id inválido");
  });
});

describe("updateProduct and deleteProduct", () => {
  it("updates the product filtering by id", async () => {
    const stub = createSupabaseStub({ error: null });
    createClientMock.mockReturnValue(stub.client);

    await updateProduct("p-1", { ...productInput }, "");

    expect(stub.builder.callsFor("update")[0][0]).toMatchObject({ name: "Detergente" });
    expect(stub.builder.callsFor("eq")).toEqual([["id", "p-1"]]);
  });

  it("uploads a new image using the product id in the path", async () => {
    const stub = createSupabaseStub({ error: null }, { publicUrl: "https://cdn.test/novo.png" });
    createClientMock.mockReturnValue(stub.client);

    const input = { ...productInput };
    await updateProduct("p-1", input, fakeImageFile({ name: "novo.png" }));

    expect(stub.storage.upload.mock.calls[0][0]).toBe("unit-joinville/p-1-novo.png");
    expect(input.image_url).toBe("https://cdn.test/novo.png");
  });

  it("deletes the product filtering by id", async () => {
    const stub = createSupabaseStub({ error: null });
    createClientMock.mockReturnValue(stub.client);

    await deleteProduct("p-1");

    expect(stub.builder.callsFor("delete")).toHaveLength(1);
    expect(stub.builder.callsFor("eq")).toEqual([["id", "p-1"]]);
  });

  it.each([
    ["updateProduct", () => updateProduct("p-1", { ...productInput }, "")],
    ["deleteProduct", () => deleteProduct("p-1")]
  ])("%s surfaces the supabase error message", async (_name, run) => {
    const stub = createSupabaseStub({ error: { message: "linha nao encontrada" } });
    createClientMock.mockReturnValue(stub.client);

    await expect(run()).rejects.toThrow("linha nao encontrada");
  });

  it.each([
    ["createProduct", () => createProduct({ ...productInput }, "")],
    ["updateProduct", () => updateProduct("p-1", { ...productInput }, "")],
    ["deleteProduct", () => deleteProduct("p-1")]
  ])("%s requires supabase configuration", async (_name, run) => {
    clearSupabaseEnv();

    await expect(run()).rejects.toThrow(missingConfigMessage);
  });
});
