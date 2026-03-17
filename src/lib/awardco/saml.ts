/**
 * Awardco SAML SSO Implementation
 *
 * HomeU acts as the Identity Provider (IdP).
 * Awardco acts as the Service Provider (SP).
 *
 * From awardco_metadata.xml:
 * - SP Entity ID: https://homeu.awardco.com/sso/saml
 * - ACS URL: https://homeu.awardco.com/sso/saml (HTTP-POST binding)
 * - NameID Format: unspecified (we send email)
 * - WantAssertionsSigned: false
 *
 * NameID mapping:
 * - "Employee" in Awardco = Resident (renter) in HomeU
 * - NameID = resident's email address (primary identifier)
 * - employeeId = Clerk userId (secondary identifier)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface SAMLUser {
  email: string;
  firstName: string;
  lastName: string;
  employeeId: string; // Clerk userId - maps to Awardco's "employee ID"
  sessionIndex?: string;
}

export interface SAMLConfig {
  issuer: string;        // HomeU's entity ID (IdP)
  acsUrl: string;        // Awardco's Assertion Consumer Service URL
  entityId: string;      // Awardco's SP entity ID
  privateKey?: string;   // PEM private key for signing (optional)
  certificate?: string;  // PEM certificate for signing (optional)
}

/**
 * Generate a unique SAML ID
 */
function generateSAMLId(): string {
  const chars = 'abcdef0123456789';
  let id = '_';
  for (let i = 0; i < 32; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Get current ISO timestamp for SAML
 */
function getSAMLTimestamp(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Get timestamp for SAML NotOnOrAfter (5 minutes from now)
 */
function getSAMLNotOnOrAfter(): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 5);
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Get timestamp for session expiry (8 hours from now)
 */
function getSessionNotOnOrAfter(): string {
  const date = new Date();
  date.setHours(date.getHours() + 8);
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build SAML Response XML
 *
 * NameID is set to the resident's email address.
 * Attributes include email, firstName, lastName, and employeeId (Clerk userId).
 */
export function buildSAMLResponse(user: SAMLUser, config: SAMLConfig): string {
  const responseId = generateSAMLId();
  const assertionId = generateSAMLId();
  const sessionIndex = user.sessionIndex || generateSAMLId();
  const issueInstant = getSAMLTimestamp();
  const notOnOrAfter = getSAMLNotOnOrAfter();
  const sessionNotOnOrAfter = getSessionNotOnOrAfter();

  const samlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:Response
  xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
  ID="${responseId}"
  Version="2.0"
  IssueInstant="${issueInstant}"
  Destination="${escapeXml(config.acsUrl)}"
  InResponseTo="_homeu_sso_request">
  <saml:Issuer>${escapeXml(config.issuer)}</saml:Issuer>
  <samlp:Status>
    <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
  </samlp:Status>
  <saml:Assertion
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    ID="${assertionId}"
    Version="2.0"
    IssueInstant="${issueInstant}">
    <saml:Issuer>${escapeXml(config.issuer)}</saml:Issuer>
    <saml:Subject>
      <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">${escapeXml(user.email)}</saml:NameID>
      <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
        <saml:SubjectConfirmationData
          NotOnOrAfter="${notOnOrAfter}"
          Recipient="${escapeXml(config.acsUrl)}"
          InResponseTo="_homeu_sso_request"/>
      </saml:SubjectConfirmation>
    </saml:Subject>
    <saml:Conditions NotBefore="${issueInstant}" NotOnOrAfter="${notOnOrAfter}">
      <saml:AudienceRestriction>
        <saml:Audience>${escapeXml(config.entityId)}</saml:Audience>
      </saml:AudienceRestriction>
    </saml:Conditions>
    <saml:AuthnStatement
      AuthnInstant="${issueInstant}"
      SessionIndex="${sessionIndex}"
      SessionNotOnOrAfter="${sessionNotOnOrAfter}">
      <saml:AuthnContext>
        <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef>
      </saml:AuthnContext>
    </saml:AuthnStatement>
    <saml:AttributeStatement>
      <saml:Attribute Name="email" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue xsi:type="xs:string">${escapeXml(user.email)}</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="firstName" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue xsi:type="xs:string">${escapeXml(user.firstName)}</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="lastName" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue xsi:type="xs:string">${escapeXml(user.lastName)}</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="employeeId" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue xsi:type="xs:string">${escapeXml(user.employeeId)}</saml:AttributeValue>
      </saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>`;

  return samlResponse;
}

/**
 * Encode SAML Response for POST binding
 */
export function encodeSAMLResponse(samlResponse: string): string {
  if (typeof window !== 'undefined') {
    return btoa(samlResponse);
  }
  return Buffer.from(samlResponse, 'utf-8').toString('base64');
}

/**
 * Generate the complete SSO payload for Awardco
 */
export function generateSSOPayload(user: SAMLUser, config: SAMLConfig): {
  samlResponse: string;
  relayState?: string;
  acsUrl: string;
} {
  const samlXml = buildSAMLResponse(user, config);
  const encodedResponse = encodeSAMLResponse(samlXml);

  return {
    samlResponse: encodedResponse,
    relayState: 'HomeU_SSO',
    acsUrl: config.acsUrl,
  };
}

/**
 * Load certificate and key files if they exist
 */
function loadCertFiles(): { privateKey?: string; certificate?: string } {
  const result: { privateKey?: string; certificate?: string } = {};

  try {
    const keyPath = process.env.SAML_PRIVATE_KEY_PATH;
    const certPath = process.env.SAML_CERTIFICATE_PATH;

    if (keyPath) {
      const resolvedKeyPath = path.resolve(process.cwd(), keyPath);
      if (fs.existsSync(resolvedKeyPath)) {
        result.privateKey = fs.readFileSync(resolvedKeyPath, 'utf-8');
      }
    }

    if (certPath) {
      const resolvedCertPath = path.resolve(process.cwd(), certPath);
      if (fs.existsSync(resolvedCertPath)) {
        result.certificate = fs.readFileSync(resolvedCertPath, 'utf-8');
      }
    }
  } catch (e) {
    console.warn('Could not load SAML certificate files:', e);
  }

  return result;
}

/**
 * Get SAML configuration from environment
 */
export function getSAMLConfig(): SAMLConfig {
  const certs = loadCertFiles();

  return {
    issuer: process.env.AWARDCO_SSO_ISSUER || 'https://homeu.co/saml/metadata',
    acsUrl: process.env.AWARDCO_SSO_ACS_URL || 'https://homeu.awardco.com/sso/saml',
    entityId: process.env.AWARDCO_SSO_ENTITY_ID || 'https://homeu.awardco.com/sso/saml',
    privateKey: certs.privateKey,
    certificate: certs.certificate,
  };
}

/**
 * Validate that SSO is properly configured
 */
export function isSSOConfigured(): boolean {
  const config = getSAMLConfig();
  return !!(config.issuer && config.acsUrl && config.entityId);
}
