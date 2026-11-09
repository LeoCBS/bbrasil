import { getOrder, type Order, type OrderItem } from "./orders";
import { getClient, type Client } from "./clients";
import { getUnit, type Unit } from "./units";
import { getProduct, type Product } from "./products";
import { getActiveNFeTechnicalResponsible, type NFeTechnicalResponsible } from "./nfe-technical-responsible";
import { signNFeXml } from "./nfe-signer";
import { getNFeEnvironment, getNFeTpAmb } from "./nfe-config";

/**
 * Generate NFe XML from order data
 * Based on NFe 4.00 layout for SEFAZ RS
 */
export async function generateNFeXml(orderId: number): Promise<string> {
  const order = await getOrder(orderId);
  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  const [client, unit, products, technicalResponsible] = await Promise.all([
    getClient(order.client_id),
    getUnit(order.unit_id),
    Promise.all(order.items?.map(item => getProduct(item.product_id)) || []),
    getActiveNFeTechnicalResponsible()
  ]);

  if (!client) {
    throw new Error(`Client ${order.client_id} not found`);
  }

  if (!unit) {
    throw new Error(`Unit ${order.unit_id} not found`);
  }

  // Parse unit address
  const unitAddress = parseAddress(unit.address);

  // Parse client address
  const clientAddress = parseAddress(client.address);

  // Generate NFe ID
  const nfeId = generateNFeId(order.id, unit, order.created_at || new Date());

  // Generate XML
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<nfeProc versao="4.00"
	xmlns="http://www.portalfiscal.inf.br/nfe">
	<NFe
		xmlns="http://www.portalfiscal.inf.br/nfe">
		<infNFe versao="4.00" Id="${nfeId}">
			<ide>
				<cUF>${getUFCode(unit.state || 'SC')}</cUF>
				<cNF>${generateCNF(order.id)}</cNF>
				<natOp>VENDA DE MERCADORIA</natOp>
				<mod>55</mod>
				<serie>1</serie>
				<nNF>${order.id}</nNF>
				<dhEmi>${formatDateTime(order.created_at || new Date())}</dhEmi>
				<dhSaiEnt>${formatDateTime(order.created_at || new Date())}</dhSaiEnt>
				<tpNF>1</tpNF>
				<idDest>1</idDest>
				<cMunFG>${esc(unit.city_code || unitAddress.cityCode) || 'FALTANTE'}</cMunFG>
				<tpImp>1</tpImp>
				<tpEmis>1</tpEmis>
				<cDV>${nfeId.slice(-1)}</cDV>
				<tpAmb>${getNFeTpAmb()}</tpAmb>
				<finNFe>1</finNFe>
				<indFinal>1</indFinal>
				<indPres>1</indPres>
				<indIntermed>0</indIntermed>
				<procEmi>0</procEmi>
				<verProc>${unit.process_version || '1.0'}</verProc>
			</ide>
			<emit>
				<CNPJ>${formatCNPJ(unit.cnpj || 'FALTANTE')}</CNPJ>
				<xNome>${esc(unit.name)}</xNome>
				<enderEmit>
					<xLgr>${esc(unitAddress.street) || 'FALTANTE'}</xLgr>
					<nro>${esc(unit.address_number || unitAddress.number) || 'FALTANTE'}</nro>
					<xBairro>${esc(unit.neighborhood || unitAddress.neighborhood) || 'FALTANTE'}</xBairro>
					<cMun>${esc(unit.city_code || unitAddress.cityCode) || 'FALTANTE'}</cMun>
					<xMun>${esc(unit.city || unitAddress.city) || 'FALTANTE'}</xMun>
					<UF>${esc(unit.state || unitAddress.state) || 'SC'}</UF>
					<CEP>${formatCEP(unitAddress.zipCode || 'FALTANTE')}</CEP>
					<cPais>1058</cPais>
					<xPais>BRASIL</xPais>
					<fone>${formatPhone(unit.phone || 'FALTANTE')}</fone>
				</enderEmit>
				<IE>${esc(unit.ie) || 'FALTANTE'}</IE>
				<CRT>1</CRT>
			</emit>
			<dest>
				<CNPJ>${formatCNPJ(client.cnpj)}</CNPJ>
				<xNome>${getNFeEnvironment() === "homologation" ? "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL" : esc(client.corporate_name)}</xNome>
				<enderDest>
					<xLgr>${esc(clientAddress.street) || 'FALTANTE'}</xLgr>
					<nro>${esc(client.address_number || clientAddress.number) || 'FALTANTE'}</nro>
					<xBairro>${esc(client.neighborhood) || 'FALTANTE'}</xBairro>
					<cMun>${esc(client.city_code || clientAddress.cityCode) || 'FALTANTE'}</cMun>
					<xMun>${esc(client.city) || 'FALTANTE'}</xMun>
					<UF>${esc(client.state) || 'SC'}</UF>
					<CEP>${formatCEP(client.zip_code || 'FALTANTE')}</CEP>
					<cPais>1058</cPais>
					<xPais>BRASIL</xPais>
					<fone>${formatPhone(client.phone || 'FALTANTE')}</fone>
				</enderDest>
				<indIEDest>1</indIEDest>
				<IE>${esc(client.state_registration) || 'FALTANTE'}</IE>
				<email>${esc(client.email) || 'FALTANTE'}</email>
			</dest>
${order.items?.map((item, index) => generateItemXml(item, products[index], index + 1)).join('\n')}
			<total>
				<ICMSTot>
					<vBC>0.00</vBC>
					<vICMS>0.00</vICMS>
					<vICMSDeson>0.00</vICMSDeson>
					<vFCP>0.00</vFCP>
					<vBCST>0.00</vBCST>
					<vST>0.00</vST>
					<vFCPST>0.00</vFCPST>
					<vFCPSTRet>0.00</vFCPSTRet>
					<vProd>${order.total_amount.toFixed(2)}</vProd>
					<vFrete>0.00</vFrete>
					<vSeg>0.00</vSeg>
					<vDesc>0.00</vDesc>
					<vII>0.00</vII>
					<vIPI>0.00</vIPI>
					<vIPIDevol>0.00</vIPIDevol>
					<vPIS>0.00</vPIS>
					<vCOFINS>0.00</vCOFINS>
					<vOutro>0.00</vOutro>
					<vNF>${order.total_amount.toFixed(2)}</vNF>
					<vTotTrib>${calculateTotalTrib(order.items || [])}</vTotTrib>
				</ICMSTot>
			</total>
			<transp>
				<modFrete>0</modFrete>
				<vol>
					<pesoL>0.000</pesoL>
					<pesoB>0.000</pesoB>
				</vol>
			</transp>
			<cobr>
				<fat>
					<nFat>N${order.id}</nFat>
					<vOrig>${order.total_amount.toFixed(2)}</vOrig>
					<vDesc>0.00</vDesc>
					<vLiq>${order.total_amount.toFixed(2)}</vLiq>
				</fat>
				<dup>
					<nDup>001</nDup>
					<dVenc>${formatDueDate(order.created_at || new Date())}</dVenc>
					<vDup>${order.total_amount.toFixed(2)}</vDup>
				</dup>
			</cobr>
			<pag>
				<detPag>
					<indPag>1</indPag>
					<tPag>15</tPag>
					<vPag>${order.total_amount.toFixed(2)}</vPag>
				</detPag>
			</pag>
			<infAdic>
				<infCpl>${esc(order.nfe_info) || 'FALTANTE'}</infCpl>
			</infAdic>
			<infRespTec>
				<CNPJ>${formatCNPJ(technicalResponsible?.cnpj || 'FALTANTE')}</CNPJ>
				<xContato>${esc(technicalResponsible?.contact_name) || 'FALTANTE'}</xContato>
				<email>${esc(technicalResponsible?.email) || 'FALTANTE'}</email>
				<fone>${formatPhone(technicalResponsible?.phone || 'FALTANTE')}</fone>
			</infRespTec>
		</infNFe>
		<!-- Signature and protNFe will be added during emission -->
	</NFe>
	<!-- protNFe will be added during emission -->
</nfeProc>`;

  // Compact the XML before signing: SEFAZ rejects whitespace between tags
  // ("caracteres de edição ... entre as tags"). Canonicalization keeps
  // inter-tag whitespace in the digest, so this must happen before signing.
  const compactXml = xml.trim().replace(/>\s+</g, "><");

  // Sign the XML with digital certificate
  try {
    const signedXml = await signNFeXml(compactXml);
    return signedXml;
  } catch (error) {
    console.error('Failed to sign NFe XML:', error);
    // Return unsigned XML if signing fails
    // This allows the system to continue working even without a certificate configured
    return xml;
  }
}

/**
 * Generate XML for a single order item
 */
function generateItemXml(item: OrderItem, product: Product | null, nItem: number): string {
  const productCode = item.product_code || product?.code || 'FALTANTE';
  const productNcm = product?.ncm || 'FALTANTE';
  const productUnit = product?.unit || 'UN';
  const productCean = product?.cean || 'SEM GTIN';
  const productCeanTrib = product?.cean_trib || 'SEM GTIN';

  return `			<det nItem="${nItem}">
				<prod>
					<cProd>${esc(productCode) || 'FALTANTE'}</cProd>
					<cEAN>${productCean}</cEAN>
					<xProd>${esc(item.product_name)}</xProd>
					<NCM>${esc(productNcm) || 'FALTANTE'}</NCM>
					<CFOP>${item.cfop || 5102}</CFOP>
					<uCom>${esc(productUnit)}</uCom>
					<qCom>${item.quantity.toFixed(2)}</qCom>
					<vUnCom>${item.unit_price.toFixed(2)}</vUnCom>
					<vProd>${item.total_price.toFixed(2)}</vProd>
					<cEANTrib>${productCeanTrib}</cEANTrib>
					<uTrib>${esc(productUnit)}</uTrib>
					<qTrib>${(item.qtrib || item.quantity).toFixed(2)}</qTrib>
					<vUnTrib>${(item.v_un_trib || item.unit_price).toFixed(2)}</vUnTrib>
					<indTot>${item.indtot || 1}</indTot>
				</prod>
				<imposto>
					<vTotTrib>${(item.v_tot_trib || 0).toFixed(2)}</vTotTrib>
					<ICMS>
						<ICMSSN101>
							<orig>0</orig>
							<CSOSN>101</CSOSN>
							<pCredSN>0.00</pCredSN>
							<vCredICMSSN>0.00</vCredICMSSN>
						</ICMSSN101>
					</ICMS>
					<PIS>
						<PISOutr>
							<CST>99</CST>
							<vBC>0.00</vBC>
							<pPIS>0.00</pPIS>
							<vPIS>${(item.v_pis || 0).toFixed(2)}</vPIS>
						</PISOutr>
					</PIS>
					<COFINS>
						<COFINSOutr>
							<CST>99</CST>
							<vBC>0.00</vBC>
							<pCOFINS>0.00</pCOFINS>
							<vCOFINS>${(item.v_cofins || 0).toFixed(2)}</vCOFINS>
						</COFINSOutr>
					</COFINS>
				</imposto>
				<vItem>${item.total_price.toFixed(2)}</vItem>
			</det>`;
}

/**
 * Escape and normalize a text value for XML: trims leading/trailing
 * whitespace (rejected by SEFAZ) and escapes XML special characters.
 */
function esc(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim()
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Parse address string into components
 */
function parseAddress(address: string): {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  cityCode?: string;
} {
  const parts = address.split('\n').map(p => p.trim());
  const result: ReturnType<typeof parseAddress> = {};

  if (parts.length > 0) {
    const addressLine = parts[0];
    const match = addressLine.match(/(.+?)\s+-\s*CEP\s*(\d{5}-?\d{3})/);
    if (match) {
      result.street = match[1];
      result.zipCode = match[2];
    } else {
      result.street = addressLine;
    }
  }

  if (parts.length > 1) {
    const cityLine = parts[1];
    const cityMatch = cityLine.match(/(.+?)\s+-\s*(\w{2})/);
    if (cityMatch) {
      result.neighborhood = cityMatch[1];
      result.state = cityMatch[2];
    }
  }

  return result;
}

/**
 * Format date to NFe datetime format
 */
function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(d);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}-03:00`;
}

/**
 * Format CNPJ (remove formatting)
 */
function formatCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

/**
 * Format CEP (remove formatting)
 */
function formatCEP(cep: string): string {
  return cep.replace(/\D/g, '');
}

/**
 * Format phone (remove formatting)
 */
function formatPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Generate NFe ID
 */
function generateNFeId(orderId: number, unit: Unit, emissionDate: string | Date): string {
  const cUF = getUFCode(unit.state || 'SC');
  const cnpj = formatCNPJ(unit.cnpj || '00000000000000');
  const emittedAt = formatDateTime(emissionDate);
  const aamm = `${emittedAt.slice(2, 4)}${emittedAt.slice(5, 7)}`;
  const mod = '55';
  const serie = '001';
  const nNF = String(orderId).padStart(9, '0');
  const tpEmis = '1';
  const cNF = generateCNF(orderId);

  const base = `${cUF}${aamm}${cnpj}${mod}${serie}${nNF}${tpEmis}${cNF}`;
  const weights = base.split('').reverse().map((_, index) => (index % 8) + 2);
  const sum = [...base].reverse().reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
  const remainder = 11 - (sum % 11);
  const cDV = remainder >= 10 ? 0 : remainder;
  return `NFe${base}${cDV}`;
}

/**
 * Generate CNF (8-digit code for the access key).
 * SEFAZ rule B03-10 (rejection 897): cNF must not equal nNF and must not
 * match the forbidden patterns below. The value is derived deterministically
 * from the order id so the access key stays stable for a given order.
 */
export const FORBIDDEN_CNF = new Set([
  "00000000", "11111111", "22222222", "33333333", "44444444", "55555555",
  "66666666", "77777777", "88888888", "99999999", "12345678", "23456789",
  "34567890", "45678901", "56789012", "67890123", "78901234", "89012345",
  "90123456", "01234567"
]);

function generateCNF(orderId: number): string {
  const nNF = String(orderId).padStart(8, "0").slice(-8);
  let hash = 0;
  for (const ch of `nfe-cnf-${orderId}`) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  }
  let candidate = String(hash % 100000000).padStart(8, "0");
  while (FORBIDDEN_CNF.has(candidate) || candidate === nNF || Number(candidate) === orderId) {
    candidate = String((Number(candidate) + 1) % 100000000).padStart(8, "0");
  }
  return candidate;
}

/**
 * Get UF code from state abbreviation
 */
function getUFCode(state: string): string {
  const ufCodes: Record<string, string> = {
    'AC': '12', 'AL': '27', 'AP': '16', 'AM': '13', 'BA': '29',
    'CE': '23', 'DF': '53', 'ES': '32', 'GO': '52', 'MA': '21',
    'MT': '51', 'MS': '50', 'MG': '31', 'PA': '15', 'PB': '25',
    'PR': '41', 'PE': '26', 'PI': '22', 'RJ': '33', 'RN': '24',
    'RS': '43', 'RO': '11', 'RR': '14', 'SC': '42', 'SP': '35',
    'SE': '28', 'TO': '17'
  };
  return ufCodes[state.toUpperCase()] || '42'; // Default to SC
}

/**
 * Calculate total tributes from items
 */
function calculateTotalTrib(items: OrderItem[]): string {
  const total = items.reduce((sum, item) => sum + (item.v_tot_trib || 0), 0);
  return total.toFixed(2);
}

/**
 * Format due date (30 days from order date)
 */
function formatDueDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  d.setDate(d.getDate() + 30);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(d);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
