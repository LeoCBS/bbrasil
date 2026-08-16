import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { clearSupabaseEnv, createSupabaseStub, setSupabaseEnv } from "../helpers/supabase";
import { createUnit, deleteUnit, getUnits, updateUnit, type UnitInput } from "@/lib/units";

vi.mock("next/cache", () => ({ unstable_noStore: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));

const createClientMock = createClient as unknown as Mock;

const unitInput: UnitInput = {
  name: "NOVA UNIDADE",
  address: "Rua Teste, 10",
  phone: "(47) 3000 0000",
  whatsapp_number: "554730000000",
  email: "nova@bbrasil.com.br",
  active: true
};

beforeEach(() => {
  vi.clearAllMocks();
  setSupabaseEnv();
});

afterEach(() => {
  clearSupabaseEnv();
});

describe("getUnits", () => {
  it("returns only active fallback units when supabase is not configured", async () => {
    clearSupabaseEnv();

    const units = await getUnits();

    expect(units.length).toBeGreaterThan(0);
    expect(units.every((unit) => unit.active)).toBe(true);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("returns fallback units including inactive ones when requested", async () => {
    clearSupabaseEnv();

    const all = await getUnits({ includeInactive: true });
    const active = await getUnits();

    expect(all.length).toBeGreaterThanOrEqual(active.length);
  });

  it("filters by active unit and orders by name when supabase is configured", async () => {
    const stub = createSupabaseStub({ data: [{ id: "unit-1", name: "UNIDADE 1", active: true }], error: null });
    createClientMock.mockReturnValue(stub.client);

    const units = await getUnits();

    expect(units).toEqual([{ id: "unit-1", name: "UNIDADE 1", active: true }]);
    expect(stub.client.from).toHaveBeenCalledWith("units");
    expect(stub.builder.callsFor("order")).toEqual([["name"]]);
    expect(stub.builder.callsFor("eq")).toEqual([["active", true]]);
  });

  it("does not filter by active when inactive units are requested", async () => {
    const stub = createSupabaseStub({ data: [], error: null });
    createClientMock.mockReturnValue(stub.client);

    await getUnits({ includeInactive: true });

    expect(stub.builder.callsFor("eq")).toEqual([]);
  });

  it("returns an empty list when supabase responds without data", async () => {
    const stub = createSupabaseStub({ data: null, error: null });
    createClientMock.mockReturnValue(stub.client);

    await expect(getUnits()).resolves.toEqual([]);
  });

  it("throws a descriptive error when the query fails", async () => {
    const stub = createSupabaseStub({ data: null, error: { message: "boom" } });
    createClientMock.mockReturnValue(stub.client);

    await expect(getUnits()).rejects.toThrow("Não foi possível carregar as unidades: boom");
  });
});

describe("unit mutations", () => {
  it("creates a unit with a generated id", async () => {
    const stub = createSupabaseStub({ error: null });
    createClientMock.mockReturnValue(stub.client);

    await createUnit(unitInput);

    const [payload] = stub.builder.callsFor("insert")[0] as [UnitInput & { id: string }];
    expect(payload).toMatchObject(unitInput);
    expect(payload.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("updates a unit filtered by id", async () => {
    const stub = createSupabaseStub({ error: null });
    createClientMock.mockReturnValue(stub.client);

    await updateUnit("unit-1", unitInput);

    expect(stub.builder.callsFor("update")).toEqual([[unitInput]]);
    expect(stub.builder.callsFor("eq")).toEqual([["id", "unit-1"]]);
  });

  it("deletes a unit filtered by id", async () => {
    const stub = createSupabaseStub({ error: null });
    createClientMock.mockReturnValue(stub.client);

    await deleteUnit("unit-1");

    expect(stub.builder.callsFor("delete")).toHaveLength(1);
    expect(stub.builder.callsFor("eq")).toEqual([["id", "unit-1"]]);
  });

  it.each([
    ["createUnit", () => createUnit(unitInput)],
    ["updateUnit", () => updateUnit("unit-1", unitInput)],
    ["deleteUnit", () => deleteUnit("unit-1")]
  ])("%s asks for supabase configuration when it is missing", async (_name, run) => {
    clearSupabaseEnv();

    await expect(run()).rejects.toThrow("Configure o Supabase para cadastrar unidades.");
  });

  it.each([
    ["createUnit", () => createUnit(unitInput)],
    ["updateUnit", () => updateUnit("unit-1", unitInput)],
    ["deleteUnit", () => deleteUnit("unit-1")]
  ])("%s surfaces the supabase error message", async (_name, run) => {
    const stub = createSupabaseStub({ error: { message: "constraint violation" } });
    createClientMock.mockReturnValue(stub.client);

    await expect(run()).rejects.toThrow("constraint violation");
  });
});
