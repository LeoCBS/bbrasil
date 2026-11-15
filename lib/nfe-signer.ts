import { SignedXml } from 'xml-crypto';
import forge from 'node-forge';
import { loadNFeCertificatePfx } from './nfe-certificate';

/**
 * Sign NFe XML with digital certificate
 * Following Brazilian fiscal standards for NFe 4.00
 * Parses the PFX certificate in pure JavaScript (node-forge) so it works
 * on serverless runtimes where the openssl binary may be missing or
 * incompatible with the system OpenSSL libraries (e.g. Vercel).
 */
export async function signNFeXml(xml: string): Promise<string> {
  const certPassword = process.env.NFE_CERTIFICATE_PASSWORD;

  if (!certPassword) {
    throw new Error('NFE_CERTIFICATE_PASSWORD environment variable is not configured');
  }

  try {
    const pfx = await loadNFeCertificatePfx();
    const { privateKey, certificate } = extractPemCredentials(pfx, certPassword);

    // Parse XML to get the infNFe ID
    const infNFeId = extractInfNFeId(xml);
    if (!infNFeId) {
      throw new Error('Could not find infNFe Id attribute in XML');
    }

    // Sign the XML
    const signedXml = signXml(xml, infNFeId, privateKey, certificate);
    if (!validateNFeSignature(signedXml)) {
      throw new Error('Generated NF-e XML signature could not be verified');
    }

    return signedXml;
  } catch (error) {
    if (error instanceof Error) {
      // Check for certificate-specific errors
      if (error.message.includes('password') || error.message.includes('decrypt') || error.message.includes('bad decrypt') || error.message.includes('MAC')) {
        throw new Error('Invalid certificate password');
      }
      if (error.message.includes('expired') || error.message.includes('not valid')) {
        throw new Error('Certificate is expired or invalid');
      }
      if (error.message.includes('file') || error.message.includes('ENOENT') || error.message.includes('No such file')) {
        throw new Error('Certificate file not found');
      }
      throw new Error(`Failed to sign NFe XML: ${error.message}`);
    }
    throw new Error('Failed to sign NFe XML: Unknown error');
  }
}

/**
 * Extract the PEM-encoded private key and certificate from a PFX/PKCS#12 file.
 */
function extractPemCredentials(pfx: Buffer, password: string): { privateKey: string; certificate: string } {
  const asn1 = forge.asn1.fromDer(pfx.toString('binary'));
  // pkcs12FromAsn1 decrypts the safe contents and key bags using the password
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password);

  const keyBagOid = forge.pki.oids.keyBag;
  const shroudedKeyBagOid = forge.pki.oids.pkcs8ShroudedKeyBag;
  const certBagOid = forge.pki.oids.certBag;

  const bagsOf = (oid: string) => p12.getBags({ bagType: oid })[oid] ?? [];
  const keyBag = bagsOf(keyBagOid)[0] ?? bagsOf(shroudedKeyBagOid)[0];
  const certBag = bagsOf(certBagOid)[0];

  if (!keyBag?.key || !certBag?.cert) {
    throw new Error('PFX certificate does not contain a private key and certificate');
  }

  return {
    privateKey: forge.pki.privateKeyToPem(keyBag.key as forge.pki.PrivateKey),
    certificate: forge.pki.certificateToPem(certBag.cert),
  };
}

/**
 * Extract infNFe Id attribute from XML
 */
function extractInfNFeId(xml: string): string | null {
  const idMatch = xml.match(/<infNFe[^>]*Id="([^"]+)"/);
  return idMatch ? idMatch[1] : null;
}

/**
 * Sign XML using xml-crypto with NFe-specific transformations
 */
function signXml(xml: string, referenceUri: string, privateKey: string, certificate: string): string {
  const signedXml = new SignedXml({ privateKey, publicCert: certificate });

  // Configure NFe-specific transformations as per fiscal standards
  signedXml.signatureAlgorithm = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
  signedXml.canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
  // xml-crypto 6 uses the object form. `referenceUri` is the Id value
  // (without the #); the XML Reference itself uses #<Id>, as in xmlsec1.
  signedXml.addReference({
    xpath: `//*[@Id='${referenceUri}']`,
    uri: `#${referenceUri}`,
    transforms: [
      'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
      'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
    ],
    digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1'
  });

  // Sign the XML
  signedXml.computeSignature(xml, {
    prefix: '',
    location: { action: 'after', reference: "//*[local-name(.)='infNFe']" }
  });

  // Get signed XML
  const signedXmlString = signedXml.getSignedXml();

  // Ensure Signature is placed correctly as sibling of infNFe within NFe
  return placeSignatureCorrectly(signedXmlString);
}

/**
 * Ensure Signature is placed correctly as sibling of infNFe within NFe
 */
function placeSignatureCorrectly(xml: string): string {
  // Check if Signature is already correctly placed
  if (xml.includes('<infNFe') && xml.includes('</infNFe>') && xml.includes('<Signature')) {
    // Ensure Signature comes after infNFe closing tag
    const infNFeEnd = xml.indexOf('</infNFe>');
    const signatureStart = xml.indexOf('<Signature');

    if (signatureStart > infNFeEnd) {
      // Signature is already after infNFe, check if it's in the right position
      const nFeEnd = xml.indexOf('</NFe>');
      if (signatureStart < nFeEnd) {
        return xml; // Already correctly placed
      }
    }

    // Move Signature to correct position
    const beforeInfNFe = xml.substring(0, infNFeEnd + 10); // includes </infNFe>
    const signature = xml.substring(signatureStart);
    const afterInfNFe = xml.substring(infNFeEnd + 10, signatureStart);
    const rest = xml.substring(signatureStart + signature.length);

    return beforeInfNFe + afterInfNFe + signature + rest;
  }

  return xml;
}

/**
 * Validate that XML signature is correct (for testing/validation)
 */
export function validateNFeSignature(xml: string): boolean {
  try {
    const signatureMatch = xml.match(/<(?:[\w.-]+:)?Signature\b[\s\S]*?<\/(?:[\w.-]+:)?Signature\s*>/);
    if (!signatureMatch) return false;

    const signedXml = new SignedXml({ getCertFromKeyInfo: SignedXml.getCertFromKeyInfo });
    signedXml.loadSignature(signatureMatch[0]);
    return signedXml.checkSignature(xml);
  } catch (error) {
    // Return false for unsigned or invalid XML without logging errors in tests
    return false;
  }
}
