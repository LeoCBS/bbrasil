import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSupabaseEnv, setSupabaseEnv } from "../helpers/supabase";
import {
  getNFeTechnicalResponsibles,
  getNFeTechnicalResponsible,
  getActiveNFeTechnicalResponsible,
  createNFeTechnicalResponsible,
  updateNFeTechnicalResponsible,
  deleteNFeTechnicalResponsible,
  type NFeTechnicalResponsibleInput
} from "@/lib/nfe-technical-responsible";

vi.mock("next/cache", () => ({ unstable_noStore: vi.fn() }));

const mockInput: NFeTechnicalResponsibleInput = {
  cnpj: "12.345.678/0001-90",
  contact_name: "João Silva",
  email: "joao@example.com",
  phone: "(47) 99999-9999",
  active: true
};

beforeEach(() => {
  vi.clearAllMocks();
  setSupabaseEnv();
});

afterEach(() => {
  clearSupabaseEnv();
});

describe("getNFeTechnicalResponsibles without supabase", () => {
  beforeEach(() => {
    clearSupabaseEnv();
  });

  it("returns empty array when no data", async () => {
    const responsibles = await getNFeTechnicalResponsibles();
    expect(responsibles).toEqual([]);
  });

  it("returns only active by default", async () => {
    const responsibles = await getNFeTechnicalResponsibles({ includeInactive: false });
    expect(responsibles).toEqual([]);
  });

  it("returns all when includeInactive is true", async () => {
    const responsibles = await getNFeTechnicalResponsibles({ includeInactive: true });
    expect(responsibles).toEqual([]);
  });
});

describe("getNFeTechnicalResponsible", () => {
  it("returns null when not found without supabase", async () => {
    clearSupabaseEnv();
    const responsible = await getNFeTechnicalResponsible("non-existent");
    expect(responsible).toBeNull();
  });
});

describe("getActiveNFeTechnicalResponsible", () => {
  it("returns null when no active responsible without supabase", async () => {
    clearSupabaseEnv();
    const responsible = await getActiveNFeTechnicalResponsible();
    expect(responsible).toBeNull();
  });
});

describe("NFeTechnicalResponsible mutations", () => {
  it("createNFeTechnicalResponsible requires supabase configuration", async () => {
    clearSupabaseEnv();
    await expect(createNFeTechnicalResponsible(mockInput)).rejects.toThrow(
      "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY"
    );
  });

  it("updateNFeTechnicalResponsible requires supabase configuration", async () => {
    clearSupabaseEnv();
    await expect(updateNFeTechnicalResponsible("id-1", mockInput)).rejects.toThrow(
      "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY"
    );
  });

  it("deleteNFeTechnicalResponsible requires supabase configuration", async () => {
    clearSupabaseEnv();
    await expect(deleteNFeTechnicalResponsible("id-1")).rejects.toThrow(
      "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY"
    );
  });
});
