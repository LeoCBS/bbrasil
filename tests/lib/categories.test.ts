import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { clearSupabaseEnv, createSupabaseStub, setSupabaseEnv } from "../helpers/supabase";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getPaginatedCategories,
  updateCategory,
  type CategoryMutationInput
} from "@/lib/categories";

vi.mock("next/cache", () => ({ unstable_noStore: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));

const createClientMock = createClient as unknown as Mock;

const categoryInput: CategoryMutationInput = {
  name: "NOVA CATEGORIA",
  description: "Descricao",
  icon: "spray",
  active: true,
  sort_order: 20
};

const missingConfigMessage = "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para usar o admin.";

beforeEach(() => {
  vi.clearAllMocks();
  setSupabaseEnv();
});

afterEach(() => {
  clearSupabaseEnv();
});

describe("getCategories", () => {
  it("returns the fallback catalog when supabase is not configured", async () => {
    clearSupabaseEnv();

    const categories = await getCategories();

    expect(categories).toHaveLength(10);
    expect(categories[0]).toMatchObject({ id: "demo-copa-cozinha", name: "COPA/COZINHA", sort_order: 10 });
  });

  it("orders by sort_order then name and filters inactive categories", async () => {
    const stub = createSupabaseStub({ data: [{ id: "c-1", name: "EPI" }], error: null });
    createClientMock.mockReturnValue(stub.client);

    const categories = await getCategories();

    expect(categories).toEqual([
      { id: "c-1", name: "EPI", description: "", icon: "package", active: true, sort_order: 0, created_at: undefined }
    ]);
    expect(stub.builder.callsFor("order")).toEqual([
      ["sort_order", { ascending: true }],
      ["name", { ascending: true }]
    ]);
    expect(stub.builder.callsFor("eq")).toEqual([["active", true]]);
  });

  it("keeps the values already provided by the record", async () => {
    const stub = createSupabaseStub({
      data: [
        {
          id: "c-1",
          name: "EPI",
          description: "Equipamentos",
          icon: "shield",
          active: false,
          sort_order: 40,
          created_at: "2024-01-01"
        }
      ],
      error: null
    });
    createClientMock.mockReturnValue(stub.client);

    const [category] = await getCategories({ includeInactive: true });

    expect(category).toEqual({
      id: "c-1",
      name: "EPI",
      description: "Equipamentos",
      icon: "shield",
      active: false,
      sort_order: 40,
      created_at: "2024-01-01"
    });
    expect(stub.builder.callsFor("eq")).toEqual([]);
  });

  it("returns an empty list when supabase responds without data", async () => {
    const stub = createSupabaseStub({ data: null, error: null });
    createClientMock.mockReturnValue(stub.client);

    await expect(getCategories()).resolves.toEqual([]);
  });

  it("falls back to the demo catalog when the query fails", async () => {
    const stub = createSupabaseStub({ data: null, error: { message: "unreachable" } });
    createClientMock.mockReturnValue(stub.client);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(getCategories()).resolves.toHaveLength(10);
    expect(consoleError).toHaveBeenCalledWith("Supabase categories fetch failed:", "unreachable");
    consoleError.mockRestore();
  });
});

describe("getPaginatedCategories without supabase", () => {
  beforeEach(() => {
    clearSupabaseEnv();
  });

  it("paginates the fallback catalog", async () => {
    const page = await getPaginatedCategories({ page: 2, pageSize: 4 });

    expect(page).toMatchObject({ total: 10, page: 2, pageSize: 4, totalPages: 3 });
    expect(page.categories.map((category) => category.sort_order)).toEqual([50, 60, 70, 80]);
  });

  it("filters by a case insensitive search", async () => {
    const page = await getPaginatedCategories({ search: "panos" });

    expect(page.categories.map((category) => category.name)).toEqual(["PANOS"]);
    expect(page.total).toBe(1);
  });

  it("clamps invalid pagination values", async () => {
    const page = await getPaginatedCategories({ page: -5, pageSize: 0 });

    expect(page).toMatchObject({ page: 1, pageSize: 1, totalPages: 10 });
    expect(page.categories).toHaveLength(1);
  });

  it("clamps a page beyond the last one", async () => {
    const page = await getPaginatedCategories({ page: 50, pageSize: 4 });

    expect(page.page).toBe(3);
    expect(page.categories).toHaveLength(2);
  });
});

describe("getPaginatedCategories with supabase", () => {
  it("requests the page range and normalizes the records", async () => {
    const stub = createSupabaseStub({ data: [{ id: "c-1", name: "EPI" }], error: null, count: 12 });
    createClientMock.mockReturnValue(stub.client);

    const page = await getPaginatedCategories({ page: 2, pageSize: 5 });

    expect(page).toMatchObject({ total: 12, page: 2, pageSize: 5, totalPages: 3 });
    expect(page.categories[0]).toMatchObject({ id: "c-1", icon: "package", description: "" });
    expect(stub.builder.callsFor("range")).toEqual([[5, 9]]);
  });

  it("escapes wildcards in the ilike search", async () => {
    const stub = createSupabaseStub({ data: [], error: null, count: 0 });
    createClientMock.mockReturnValue(stub.client);

    await getPaginatedCategories({ search: "100%_off", includeInactive: true });

    expect(stub.builder.callsFor("ilike")).toEqual([["name", "%100\\%\\_off%"]]);
    expect(stub.builder.callsFor("eq")).toEqual([]);
  });

  it("clamps the requested page to the available pages", async () => {
    const stub = createSupabaseStub({ data: [], error: null, count: 3 });
    createClientMock.mockReturnValue(stub.client);

    await expect(getPaginatedCategories({ page: 9, pageSize: 3 })).resolves.toMatchObject({ page: 1, totalPages: 1 });
  });

  it("falls back to the demo catalog when the paginated query fails", async () => {
    const stub = createSupabaseStub({ data: null, error: { message: "broken" }, count: null });
    createClientMock.mockReturnValue(stub.client);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const page = await getPaginatedCategories({ search: "epi", pageSize: 5 });

    expect(page).toMatchObject({ total: 1, page: 1, totalPages: 1 });
    expect(consoleError).toHaveBeenCalledWith("Supabase categories fetch failed:", "broken");
    consoleError.mockRestore();
  });
});

describe("category mutations", () => {
  it("inserts, updates and deletes categories", async () => {
    const insertStub = createSupabaseStub({ error: null });
    createClientMock.mockReturnValue(insertStub.client);
    await createCategory(categoryInput);
    expect(insertStub.builder.callsFor("insert")).toEqual([[categoryInput]]);

    const updateStub = createSupabaseStub({ error: null });
    createClientMock.mockReturnValue(updateStub.client);
    await updateCategory("c-1", categoryInput);
    expect(updateStub.builder.callsFor("update")).toEqual([[categoryInput]]);
    expect(updateStub.builder.callsFor("eq")).toEqual([["id", "c-1"]]);

    const deleteStub = createSupabaseStub({ error: null });
    createClientMock.mockReturnValue(deleteStub.client);
    await deleteCategory("c-1");
    expect(deleteStub.builder.callsFor("delete")).toHaveLength(1);
    expect(deleteStub.builder.callsFor("eq")).toEqual([["id", "c-1"]]);
  });

  it.each([
    ["createCategory", () => createCategory(categoryInput)],
    ["updateCategory", () => updateCategory("c-1", categoryInput)],
    ["deleteCategory", () => deleteCategory("c-1")]
  ])("%s requires supabase configuration", async (_name, run) => {
    clearSupabaseEnv();

    await expect(run()).rejects.toThrow(missingConfigMessage);
  });

  it.each([
    ["createCategory", () => createCategory(categoryInput)],
    ["updateCategory", () => updateCategory("c-1", categoryInput)],
    ["deleteCategory", () => deleteCategory("c-1")]
  ])("%s surfaces the supabase error message", async (_name, run) => {
    const stub = createSupabaseStub({ error: { message: "name already used" } });
    createClientMock.mockReturnValue(stub.client);

    await expect(run()).rejects.toThrow("name already used");
  });
});
