import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { clearSupabaseEnv, createSupabaseStub, setSupabaseEnv } from "../helpers/supabase";
import {
  createSalesperson,
  deleteSalesperson,
  getSalesperson,
  getSalespeople,
  updateSalesperson,
  type SalespersonInput
} from "@/lib/salespeople";

vi.mock("next/cache", () => ({ unstable_noStore: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));

const createClientMock = createClient as unknown as Mock;

const salespersonInput: SalespersonInput = {
  name: "Ana Souza",
  email: "ana@bbrasil.com.br",
  phone: "(47) 90000-0000",
  unit_id: "unit-joinville",
  active: true
};

const missingConfigMessage =
  "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para usar o cadastro de vendedores.";

beforeEach(() => {
  vi.clearAllMocks();
  setSupabaseEnv();
});

afterEach(() => {
  clearSupabaseEnv();
});

describe("getSalespeople", () => {
  it("returns fallback salespeople when supabase is not configured", async () => {
    clearSupabaseEnv();

    const salespeople = await getSalespeople();

    expect(salespeople.map((person) => person.name)).toEqual(["João da Silva", "Maria Santos"]);
  });

  it("queries active salespeople ordered by name", async () => {
    const stub = createSupabaseStub({ data: [{ id: "s-1", name: "Ana" }], error: null });
    createClientMock.mockReturnValue(stub.client);

    const salespeople = await getSalespeople();

    expect(salespeople).toEqual([{ id: "s-1", name: "Ana" }]);
    expect(stub.client.from).toHaveBeenCalledWith("salespeople");
    expect(stub.builder.callsFor("order")).toEqual([["name"]]);
    expect(stub.builder.callsFor("eq")).toEqual([["active", true]]);
  });

  it("skips the active filter when inactive salespeople are included", async () => {
    const stub = createSupabaseStub({ data: null, error: null });
    createClientMock.mockReturnValue(stub.client);

    await expect(getSalespeople({ includeInactive: true })).resolves.toEqual([]);
    expect(stub.builder.callsFor("eq")).toEqual([]);
  });

  it("throws when the list query fails", async () => {
    const stub = createSupabaseStub({ data: null, error: { message: "offline" } });
    createClientMock.mockReturnValue(stub.client);

    await expect(getSalespeople()).rejects.toThrow("Não foi possível carregar os vendedores: offline");
  });
});

describe("getSalesperson", () => {
  it("finds a fallback salesperson by id and returns null for unknown ids", async () => {
    clearSupabaseEnv();

    await expect(getSalesperson("demo-salesperson-1")).resolves.toMatchObject({ name: "João da Silva" });
    await expect(getSalesperson("missing")).resolves.toBeNull();
  });

  it("fetches a single salesperson by id", async () => {
    const stub = createSupabaseStub({ data: { id: "s-1", name: "Ana" }, error: null });
    createClientMock.mockReturnValue(stub.client);

    await expect(getSalesperson("s-1")).resolves.toEqual({ id: "s-1", name: "Ana" });
    expect(stub.builder.callsFor("eq")).toEqual([["id", "s-1"]]);
    expect(stub.builder.callsFor("maybeSingle")).toHaveLength(1);
  });

  it("throws when the single fetch fails", async () => {
    const stub = createSupabaseStub({ data: null, error: { message: "no row" } });
    createClientMock.mockReturnValue(stub.client);

    await expect(getSalesperson("s-1")).rejects.toThrow("Não foi possível carregar o vendedor: no row");
  });
});

describe("salesperson mutations", () => {
  it("creates a salesperson with a generated id", async () => {
    const stub = createSupabaseStub({ error: null });
    createClientMock.mockReturnValue(stub.client);

    await createSalesperson(salespersonInput);

    const [payload] = stub.builder.callsFor("insert")[0] as [SalespersonInput & { id: string }];
    expect(payload).toMatchObject(salespersonInput);
    expect(payload.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("updates and deletes filtering by id", async () => {
    const updateStub = createSupabaseStub({ error: null });
    createClientMock.mockReturnValue(updateStub.client);
    await updateSalesperson("s-1", salespersonInput);
    expect(updateStub.builder.callsFor("update")).toEqual([[salespersonInput]]);
    expect(updateStub.builder.callsFor("eq")).toEqual([["id", "s-1"]]);

    const deleteStub = createSupabaseStub({ error: null });
    createClientMock.mockReturnValue(deleteStub.client);
    await deleteSalesperson("s-1");
    expect(deleteStub.builder.callsFor("delete")).toHaveLength(1);
    expect(deleteStub.builder.callsFor("eq")).toEqual([["id", "s-1"]]);
  });

  it.each([
    ["createSalesperson", () => createSalesperson(salespersonInput)],
    ["updateSalesperson", () => updateSalesperson("s-1", salespersonInput)],
    ["deleteSalesperson", () => deleteSalesperson("s-1")]
  ])("%s requires supabase configuration", async (_name, run) => {
    clearSupabaseEnv();

    await expect(run()).rejects.toThrow(missingConfigMessage);
  });

  it.each([
    ["createSalesperson", () => createSalesperson(salespersonInput)],
    ["updateSalesperson", () => updateSalesperson("s-1", salespersonInput)],
    ["deleteSalesperson", () => deleteSalesperson("s-1")]
  ])("%s surfaces the supabase error message", async (_name, run) => {
    const stub = createSupabaseStub({ error: { message: "duplicated" } });
    createClientMock.mockReturnValue(stub.client);

    await expect(run()).rejects.toThrow("duplicated");
  });
});
