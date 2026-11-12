import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSupabaseEnv, setSupabaseEnv } from "../helpers/supabase";
import { generateNFeXml } from "@/lib/nfe-generator";
import { getOrder } from "@/lib/orders";
import { getClient } from "@/lib/clients";
import { getUnit } from "@/lib/units";
import { getProduct } from "@/lib/products";

vi.mock("next/cache", () => ({ unstable_noStore: vi.fn() }));
vi.mock("@/lib/orders");
vi.mock("@/lib/clients");
vi.mock("@/lib/units");
vi.mock("@/lib/products");
vi.mock("@/lib/nfe-technical-responsible", () => ({
  getActiveNFeTechnicalResponsible: vi.fn(async () => null)
}));
vi.mock("@/lib/nfe-signer", () => ({
  signNFeXml: vi.fn(async (xml: string) => xml)
}));

const mockGetOrder = getOrder as unknown as ReturnType<typeof vi.fn>;
const mockGetClient = getClient as unknown as ReturnType<typeof vi.fn>;
const mockGetUnit = getUnit as unknown as ReturnType<typeof vi.fn>;
const mockGetProduct = getProduct as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  setSupabaseEnv();
});

afterEach(() => {
  clearSupabaseEnv();
});

describe("generateNFeXml", () => {
  const mockOrder = {
    id: 123,
    client_id: "client-1",
    client_name: "Test Client Ltda",
    client_cnpj: "12.345.678/0001-90",
    unit_id: "unit-1",
    unit_name: "FLORIANOPOLIS SC",
    total_amount: 1500.00,
    created_at: "2026-11-07T10:00:00Z",
    items: [
      {
        id: 1,
        order_id: 123,
        product_id: "prod-1",
        product_name: "Test Product",
        product_code: "ALT001",
        quantity: 10,
        unit_price: 150.00,
        total_price: 1500.00,
        cfop: 5102,
        indtot: 1,
        qtrib: 10,
        v_un_trib: 150.00,
        v_pis: 0.00,
        v_cofins: 0.00,
        v_tot_trib: 0.00
      }
    ]
  };

  const mockClient = {
    id: "client-1",
    corporate_name: "Test Client Ltda",
    cnpj: "12.345.678/0001-90",
    state_registration: "123456789",
    address: "Rua Teste, 123",
    neighborhood: "Centro",
    notes: "",
    city: "Florianópolis",
    state: "SC",
    zip_code: "88000-000",
    email: "test@example.com",
    phone: "(48) 99999-9999",
    profile_id: null,
    unit: "FLORIANOPOLIS SC",
    unit_id: "unit-1",
    active: true
  };

  const mockUnit = {
    id: "unit-1",
    name: "FLORIANOPOLIS SC",
    address: "Rua Sao Ludgero, 1580 - CEP 88117-270\nBarreiros - Sao Jose - SC",
    phone: "(48) 3240 0074",
    whatsapp_number: "554832400074",
    email: "comercial@bbrasilprodutosdelimpeza.com.br",
    active: true
  };

  const mockProduct = {
    id: "prod-1",
    code: "ALT001",
    unit: "UN",
    name: "Test Product",
    unit_name: "FLORIANOPOLIS SC",
    unit_id: "unit-1",
    category_id: "cat-1",
    category: "Test Category",
    description: "Test description",
    size: "1L",
    ncm: "12345678",
    stock: 100,
    cost_price: 100.00,
    price: 150.00,
    cean: "SEM GTIN",
    cean_trib: "SEM GTIN",
    image_blob: null,
    image_mime_type: null,
    image_url: null,
    active: true
  };

  it("generates valid NFe XML structure", async () => {
    mockGetOrder.mockResolvedValue(mockOrder);
    mockGetClient.mockResolvedValue(mockClient);
    mockGetUnit.mockResolvedValue(mockUnit);
    mockGetProduct.mockResolvedValue(mockProduct);

    const xml = await generateNFeXml(123);

    expect(xml).toContain('<?xml version="1.0" encoding="utf-8"?>');
    expect(xml).toContain('<nfeProc versao="4.00"');
    expect(xml).toContain('xmlns="http://www.portalfiscal.inf.br/nfe"');
    expect(xml).toContain('<NFe');
    expect(xml).toContain('<infNFe versao="4.00"');
  });

  it("includes order data in ide section", async () => {
    mockGetOrder.mockResolvedValue(mockOrder);
    mockGetClient.mockResolvedValue(mockClient);
    mockGetUnit.mockResolvedValue(mockUnit);
    mockGetProduct.mockResolvedValue(mockProduct);

    const xml = await generateNFeXml(123);

    expect(xml).toContain('<nNF>123</nNF>');
    expect(xml).toContain('<mod>55</mod>');
    expect(xml).toContain('<serie>1</serie>');
    expect(xml).toContain('<tpNF>1</tpNF>');
  });

  it("includes unit data in emit section", async () => {
    mockGetOrder.mockResolvedValue(mockOrder);
    mockGetClient.mockResolvedValue(mockClient);
    mockGetUnit.mockResolvedValue(mockUnit);
    mockGetProduct.mockResolvedValue(mockProduct);

    const xml = await generateNFeXml(123);

    expect(xml).toContain('<emit>');
    expect(xml).toContain('<xNome>FLORIANOPOLIS SC</xNome>');
    expect(xml).toContain('<UF>SC</UF>');
  });

  it("includes client data in dest section", async () => {
    vi.stubEnv("NFE_ENVIRONMENT", "production");
    mockGetOrder.mockResolvedValue(mockOrder);
    mockGetClient.mockResolvedValue(mockClient);
    mockGetUnit.mockResolvedValue(mockUnit);
    mockGetProduct.mockResolvedValue(mockProduct);

    const xml = await generateNFeXml(123);

    expect(xml).toContain('<dest>');
    expect(xml).toContain('<xNome>Test Client Ltda</xNome>');
    expect(xml).toContain('<CNPJ>12345678000190</CNPJ>');
    expect(xml).toContain('<email>test@example.com</email>');
  });

  it("includes product items in det sections", async () => {
    mockGetOrder.mockResolvedValue(mockOrder);
    mockGetClient.mockResolvedValue(mockClient);
    mockGetUnit.mockResolvedValue(mockUnit);
    mockGetProduct.mockResolvedValue(mockProduct);

    const xml = await generateNFeXml(123);

    expect(xml).toContain('<det nItem="1">');
    expect(xml).toContain('<cProd>ALT001</cProd>');
    expect(xml).toContain('<xProd>Test Product</xProd>');
    expect(xml).toContain('<NCM>12345678</NCM>');
    expect(xml).toContain('<qCom>10.00</qCom>');
    expect(xml).toContain('<vUnCom>150.00</vUnCom>');
    expect(xml).toContain('<vProd>1500.00</vProd>');
  });

  it("includes total values in total section", async () => {
    mockGetOrder.mockResolvedValue(mockOrder);
    mockGetClient.mockResolvedValue(mockClient);
    mockGetUnit.mockResolvedValue(mockUnit);
    mockGetProduct.mockResolvedValue(mockProduct);

    const xml = await generateNFeXml(123);

    expect(xml).toContain('<total>');
    expect(xml).toContain('<vProd>1500.00</vProd>');
    expect(xml).toContain('<vNF>1500.00</vNF>');
  });

  it("uses FALTANTE for missing fields", async () => {
    mockGetOrder.mockResolvedValue(mockOrder);
    mockGetClient.mockResolvedValue({
      ...mockClient,
      state_registration: ""
    });
    mockGetUnit.mockResolvedValue(mockUnit);
    mockGetProduct.mockResolvedValue(mockProduct);

    const xml = await generateNFeXml(123);

    expect(xml).toContain('FALTANTE');
  });

  it("throws error when order not found", async () => {
    mockGetOrder.mockResolvedValue(null);

    await expect(generateNFeXml(999)).rejects.toThrow("Order 999 not found");
  });

  it("throws error when client not found", async () => {
    mockGetOrder.mockResolvedValue(mockOrder);
    mockGetClient.mockResolvedValue(null);
    mockGetUnit.mockResolvedValue(mockUnit);
    mockGetProduct.mockResolvedValue(mockProduct);

    await expect(generateNFeXml(123)).rejects.toThrow("Client client-1 not found");
  });

  it("throws error when unit not found", async () => {
    mockGetOrder.mockResolvedValue(mockOrder);
    mockGetClient.mockResolvedValue(mockClient);
    mockGetUnit.mockResolvedValue(null);
    mockGetProduct.mockResolvedValue(mockProduct);

    await expect(generateNFeXml(123)).rejects.toThrow("Unit unit-1 not found");
  });

  it("handles multiple items", async () => {
    const multiItemOrder = {
      ...mockOrder,
      items: [
        {
          ...mockOrder.items[0],
          id: 1,
          product_id: "prod-1"
        },
        {
          ...mockOrder.items[0],
          id: 2,
          product_id: "prod-2",
          product_name: "Product 2",
          quantity: 5,
          unit_price: 100.00,
          total_price: 500.00
        }
      ]
    };

    mockGetOrder.mockResolvedValue(multiItemOrder);
    mockGetClient.mockResolvedValue(mockClient);
    mockGetUnit.mockResolvedValue(mockUnit);
    mockGetProduct
      .mockResolvedValueOnce(mockProduct)
      .mockResolvedValueOnce({ ...mockProduct, id: "prod-2", name: "Product 2" });

    const xml = await generateNFeXml(123);

    expect(xml).toContain('<det nItem="1">');
    expect(xml).toContain('<det nItem="2">');
  });

  it("formats CNPJ correctly", async () => {
    mockGetOrder.mockResolvedValue(mockOrder);
    mockGetClient.mockResolvedValue(mockClient);
    mockGetUnit.mockResolvedValue(mockUnit);
    mockGetProduct.mockResolvedValue(mockProduct);

    const xml = await generateNFeXml(123);

    // CNPJ should be formatted without punctuation
    expect(xml).toContain('<CNPJ>12345678000190</CNPJ>');
    expect(xml).not.toContain('<CNPJ>12.345.678/0001-90</CNPJ>');
  });

  it("formats CEP correctly", async () => {
    mockGetOrder.mockResolvedValue(mockOrder);
    mockGetClient.mockResolvedValue(mockClient);
    mockGetUnit.mockResolvedValue(mockUnit);
    mockGetProduct.mockResolvedValue(mockProduct);

    const xml = await generateNFeXml(123);

    // CEP should be formatted without hyphen
    expect(xml).toContain('<CEP>88000000</CEP>');
  });

  it("includes tax information in imposto section", async () => {
    mockGetOrder.mockResolvedValue(mockOrder);
    mockGetClient.mockResolvedValue(mockClient);
    mockGetUnit.mockResolvedValue(mockUnit);
    mockGetProduct.mockResolvedValue(mockProduct);

    const xml = await generateNFeXml(123);

    expect(xml).toContain('<imposto>');
    expect(xml).toContain('<ICMS>');
    expect(xml).toContain('<ICMSSN101>');
    expect(xml).toContain('<CSOSN>101</CSOSN>');
    expect(xml).toContain('<PIS>');
    expect(xml).toContain('<COFINS>');
  });
});
