import { exec } from 'child_process';
import { promisify } from 'util';
import { SignedXml } from 'xml-crypto';
import { writeFile, unlink, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

/**
 * Sign NFe XML with digital certificate
 * Following Brazilian fiscal standards for NFe 4.00
 * Uses OpenSSL to extract key/cert from PFX (same approach as bash script)
 */
export async function signNFeXml(xml: string): Promise<string> {
  const certPath = process.env.NFE_CERTIFICATE_PATH;
  const certPassword = process.env.NFE_CERTIFICATE_PASSWORD;

  if (!certPath) {
    throw new Error('NFE_CERTIFICATE_PATH environment variable is not configured');
  }

  if (!certPassword) {
    throw new Error('NFE_CERTIFICATE_PASSWORD environment variable is not configured');
  }

  // Create temporary directory for PEM files
  const tempDir = tmpdir();
  const certPemPath = join(tempDir, `cert-${Date.now()}.pem`);
  const keyPemPath = join(tempDir, `key-${Date.now()}.pem`);

  try {
    // Extract certificate from PFX using OpenSSL (same as bash script)
    const certExtractResult = await execAsync(`openssl pkcs12 -in "${certPath}" -passin pass:"${certPassword}" -clcerts -nokeys -out "${certPemPath}" 2>&1`);
    if (certExtractResult.stderr && certExtractResult.stderr.includes('error')) {
      throw new Error(`OpenSSL certificate extraction failed: ${certExtractResult.stderr}`);
    }

    // Extract private key from PFX using OpenSSL (same as bash script)
    const keyExtractResult = await execAsync(`openssl pkcs12 -in "${certPath}" -passin pass:"${certPassword}" -nocerts -nodes -out "${keyPemPath}" 2>&1`);
    if (keyExtractResult.stderr && keyExtractResult.stderr.includes('error')) {
      throw new Error(`OpenSSL key extraction failed: ${keyExtractResult.stderr}`);
    }

    // Read the extracted PEM files
    const [certificate, privateKey] = await Promise.all([
      readFile(certPemPath, 'utf-8'),
      readFile(keyPemPath, 'utf-8')
    ]);

    // Parse XML to get the infNFe ID
    const infNFeId = extractInfNFeId(xml);
    if (!infNFeId) {
      throw new Error('Could not find infNFe Id attribute in XML');
    }

    // Sign the XML
    const signedXml = signXml(xml, infNFeId, privateKey, certificate);

    return signedXml;
  } catch (error) {
    if (error instanceof Error) {
      // Check for certificate-specific errors
      if (error.message.includes('password') || error.message.includes('decrypt') || error.message.includes('bad decrypt')) {
        throw new Error('Invalid certificate password');
      }
      if (error.message.includes('expired') || error.message.includes('not valid')) {
        throw new Error('Certificate is expired or invalid');
      }
      if (error.message.includes('file') || error.message.includes('ENOENT') || error.message.includes('No such file')) {
        throw new Error('Certificate file not found');
      }
      if (error.message.includes('command not found')) {
        throw new Error('OpenSSL is not installed on the system');
      }
      throw new Error(`Failed to sign NFe XML: ${error.message}`);
    }
    throw new Error('Failed to sign NFe XML: Unknown error');
  } finally {
    // Clean up temporary files
    try {
      await Promise.all([
        unlink(certPemPath).catch(() => {}),
        unlink(keyPemPath).catch(() => {})
      ]);
    } catch (error) {
      // Ignore cleanup errors
    }
  }
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
    // Check if XML has Signature element
    if (!xml.includes('<Signature')) {
      return false;
    }

    const signedXml = new SignedXml();
    signedXml.loadSignature(xml);
    return signedXml.checkSignature(xml);
  } catch (error) {
    // Return false for unsigned or invalid XML without logging errors in tests
    return false;
  }
}
