import { describe, expect, it } from "vitest";
import { formatCep, formatCpf, formatDocument, formatCnpj, isValidCpf, isValidDocument } from "@/lib/format";

describe("formatCpf", () => {
  it("applies the CPF mask", () => {
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
    expect(formatCpf("529.982.247-25")).toBe("529.982.247-25");
  });

  it("limits to 11 digits", () => {
    expect(formatCpf("52998224725999")).toBe("529.982.247-25");
  });
});

describe("formatDocument", () => {
  it("uses the CPF mask for up to 11 digits", () => {
    expect(formatDocument("52998224725")).toBe("529.982.247-25");
  });

  it("uses the CNPJ mask for 12+ digits", () => {
    expect(formatDocument("12345678000195")).toBe("12.345.678/0001-95");
  });
});

describe("formatCep", () => {
  it("applies the CEP mask", () => {
    expect(formatCep("01310100")).toBe("01310-100");
    expect(formatCep("01310-100")).toBe("01310-100");
  });
});

describe("isValidCpf", () => {
  it("accepts a valid cpf", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224725")).toBe(true);
  });

  it("rejects invalid cpfs", () => {
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("529.982.247-26")).toBe(false);
    expect(isValidCpf("123")).toBe(false);
  });
});

describe("isValidDocument", () => {
  it("accepts valid cpf and cnpj", () => {
    expect(isValidDocument("529.982.247-25")).toBe(true);
    expect(isValidDocument("12.345.678/0001-95")).toBe(true);
  });

  it("rejects other lengths and invalid documents", () => {
    expect(isValidDocument("123")).toBe(false);
    expect(isValidDocument("111.111.111-11")).toBe(false);
    expect(isValidDocument("12.345.678/0001-00")).toBe(false);
  });
});
