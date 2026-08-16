import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { clearSupabaseEnv, createSupabaseStub, setSupabaseEnv } from "../helpers/supabase";
import {
  createClient,
  deleteClient,
  getClient,
  getPaginatedClients,
  updateClient,
  type ClientMutationInput
} from "@/lib/clients";

vi.mock("next/cache", () => ({ unstable_noStore: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));

const createSupabaseClientMock = createSupabaseClient as unknown as Mock;

const clientInput: ClientMutationInput = {
  corporate_name: "Padaria Central",
  cnpj: "12.345.678/0001-90",
  state_registration: "",
  address: "Rua A, 1",
  neighborhood: "Centro",
  notes: "",
  city: "Joinville",
  state: "SC",
  zip_code: "89201-000",
  email: "contato@padaria.com.br",
  phone: "(47) 90000-0000",
  salesperson: "João da Silva",
  unit: "",
  unit_id: "unit-joinville",
  active: true
};

const missingConfigMessage =
  "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para usar o cadastro de clientes.";

beforeEach(() => {
  vi.clearAllMocks();
  setSupabaseEnv();
});

afterEach(() => {
  clearSupabaseEnv();
});

describe("getPaginatedClients without supabase", () => {
  beforeEach(() => {
    clearSupabaseEnv();
  });

  it("returns every fallback client on a single page", async () => {
    const page = await getPaginatedClients();

    expect(page).toMatchObject({ total: 2, page: 1, pageSize: 10, totalPages: 1 });
    expect(page.clients).toHaveLength(2);
  });

  it("matches the search term ignoring accents and casing", async () => {
    const page = await getPaginatedClients({ search: "  mercado 3 irmaos  " });

    expect(page.clients.map((client) => client.corporate_name)).toEqual(["Mercado 3 Irmãos Ltda"]);
  });

  it("searches across cnpj, city, email and salesperson", async () => {
    await expect(getPaginatedClients({ search: "23.456.789" })).resolves.toMatchObject({ total: 1 });
    await expect(getPaginatedClients({ search: "joinville" })).resolves.toMatchObject({ total: 2 });
    await expect(getPaginatedClients({ search: "hotelpraianorte" })).resolves.toMatchObject({ total: 1 });
    await expect(getPaginatedClients({ search: "Maria Santos" })).resolves.toMatchObject({ total: 1 });
    await expect(getPaginatedClients({ search: "inexistente" })).resolves.toMatchObject({ total: 0, totalPages: 1 });
  });

  it("filters by status", async () => {
    await expect(getPaginatedClients({ status: "ativo" })).resolves.toMatchObject({ total: 2 });
    await expect(getPaginatedClients({ status: "inativo" })).resolves.toMatchObject({ total: 0 });
  });

  it("clamps invalid page and page size values", async () => {
    const page = await getPaginatedClients({ page: 0, pageSize: 0 });

    expect(page).toMatchObject({ page: 1, pageSize: 1, total: 2, totalPages: 2 });
    expect(page.clients).toHaveLength(1);
  });

  it("clamps a page beyond the last one to the last page", async () => {
    const page = await getPaginatedClients({ page: 99, pageSize: 1 });

    expect(page).toMatchObject({ page: 2, totalPages: 2 });
    expect(page.clients.map((client) => client.id)).toEqual(["demo-client-2"]);
  });
});

describe("getPaginatedClients with supabase", () => {
  it("builds a range query and reports the total from the count", async () => {
    const stub = createSupabaseStub({ data: [{ id: "c-1" }], error: null, count: 21 });
    createSupabaseClientMock.mockReturnValue(stub.client);

    const page = await getPaginatedClients({ page: 3, pageSize: 10 });

    expect(page).toMatchObject({ total: 21, page: 3, pageSize: 10, totalPages: 3 });
    expect(stub.builder.callsFor("range")).toEqual([[20, 29]]);
    expect(stub.client.from).toHaveBeenCalledWith("clients");
  });

  it("filters by active status", async () => {
    const activeStub = createSupabaseStub({ data: [], error: null, count: 0 });
    createSupabaseClientMock.mockReturnValue(activeStub.client);
    await getPaginatedClients({ status: "ativo" });
    expect(activeStub.builder.callsFor("eq")).toEqual([["active", true]]);

    const inactiveStub = createSupabaseStub({ data: [], error: null, count: 0 });
    createSupabaseClientMock.mockReturnValue(inactiveStub.client);
    await getPaginatedClients({ status: "inativo" });
    expect(inactiveStub.builder.callsFor("eq")).toEqual([["active", false]]);
  });

  it("escapes wildcard characters in the search filter", async () => {
    const stub = createSupabaseStub({ data: [], error: null, count: 0 });
    createSupabaseClientMock.mockReturnValue(stub.client);

    await getPaginatedClients({ search: " 50%_a,b " });

    expect(stub.builder.callsFor("or")).toEqual([
      [
        "corporate_name.ilike.%50\\%\\_a\\,b%,cnpj.ilike.%50\\%\\_a\\,b%,city.ilike.%50\\%\\_a\\,b%,email.ilike.%50\\%\\_a\\,b%"
      ]
    ]);
  });

  it("ignores a blank search term", async () => {
    const stub = createSupabaseStub({ data: [], error: null, count: 0 });
    createSupabaseClientMock.mockReturnValue(stub.client);

    await getPaginatedClients({ search: "   " });

    expect(stub.builder.callsFor("or")).toEqual([]);
  });

  it("falls back to the demo clients when the query fails", async () => {
    const stub = createSupabaseStub({ data: null, error: { message: "timeout" }, count: null });
    createSupabaseClientMock.mockReturnValue(stub.client);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const page = await getPaginatedClients({ search: "hotel" });

    expect(page).toMatchObject({ total: 1, page: 1, totalPages: 1 });
    expect(consoleError).toHaveBeenCalledWith("Supabase clients fetch failed:", "timeout");
    consoleError.mockRestore();
  });

  it("treats a missing count as zero", async () => {
    const stub = createSupabaseStub({ data: null, error: null, count: null });
    createSupabaseClientMock.mockReturnValue(stub.client);

    await expect(getPaginatedClients()).resolves.toMatchObject({ clients: [], total: 0, totalPages: 1 });
  });
});

describe("getClient", () => {
  it("reads from the fallback list when supabase is not configured", async () => {
    clearSupabaseEnv();

    await expect(getClient("demo-client-2")).resolves.toMatchObject({ corporate_name: "Hotel Praia Norte" });
    await expect(getClient("nope")).resolves.toBeNull();
  });

  it("fetches a single client by id", async () => {
    const stub = createSupabaseStub({ data: { id: "c-1" }, error: null });
    createSupabaseClientMock.mockReturnValue(stub.client);

    await expect(getClient("c-1")).resolves.toEqual({ id: "c-1" });
    expect(stub.builder.callsFor("eq")).toEqual([["id", "c-1"]]);
  });

  it("throws when the fetch fails", async () => {
    const stub = createSupabaseStub({ data: null, error: { message: "denied" } });
    createSupabaseClientMock.mockReturnValue(stub.client);

    await expect(getClient("c-1")).rejects.toThrow("Não foi possível carregar o cliente: denied");
  });
});

describe("client mutations", () => {
  it("creates a client with a generated id", async () => {
    const stub = createSupabaseStub({ error: null });
    createSupabaseClientMock.mockReturnValue(stub.client);

    await createClient(clientInput);

    const [payload] = stub.builder.callsFor("insert")[0] as [ClientMutationInput & { id: string }];
    expect(payload).toMatchObject(clientInput);
    expect(payload.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("updates and deletes filtering by id", async () => {
    const updateStub = createSupabaseStub({ error: null });
    createSupabaseClientMock.mockReturnValue(updateStub.client);
    await updateClient("c-1", clientInput);
    expect(updateStub.builder.callsFor("update")).toEqual([[clientInput]]);
    expect(updateStub.builder.callsFor("eq")).toEqual([["id", "c-1"]]);

    const deleteStub = createSupabaseStub({ error: null });
    createSupabaseClientMock.mockReturnValue(deleteStub.client);
    await deleteClient("c-1");
    expect(deleteStub.builder.callsFor("delete")).toHaveLength(1);
    expect(deleteStub.builder.callsFor("eq")).toEqual([["id", "c-1"]]);
  });

  it.each([
    ["createClient", () => createClient(clientInput)],
    ["updateClient", () => updateClient("c-1", clientInput)],
    ["deleteClient", () => deleteClient("c-1")]
  ])("%s requires supabase configuration", async (_name, run) => {
    clearSupabaseEnv();

    await expect(run()).rejects.toThrow(missingConfigMessage);
  });

  it.each([
    ["createClient", () => createClient(clientInput)],
    ["updateClient", () => updateClient("c-1", clientInput)],
    ["deleteClient", () => deleteClient("c-1")]
  ])("%s surfaces the supabase error message", async (_name, run) => {
    const stub = createSupabaseStub({ error: { message: "cnpj already used" } });
    createSupabaseClientMock.mockReturnValue(stub.client);

    await expect(run()).rejects.toThrow("cnpj already used");
  });
});
