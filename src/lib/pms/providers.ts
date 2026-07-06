/**
 * PMS provider adapters.
 *
 * Each adapter maps the StandardApplication payload into the provider's wire
 * format and submits it. Credentials are read from server-side env vars —
 * never from the database. A connection's `credentialRef` selects the env
 * var group, so multiple PM companies on the same provider can have separate
 * credentials:
 *
 *   credentialRef "ACME" → PMS_ACME_API_KEY / PMS_ACME_USERNAME /
 *   PMS_ACME_PASSWORD / PMS_ACME_CLIENT_ID / PMS_ACME_CLIENT_SECRET
 *
 * Falls back to the provider name (PMS_ENTRATA_*, PMS_BUILDIUM_*, ...) when
 * credentialRef is unset.
 */

import type {
  PmsConnectionConfig,
  PmsSubmitResult,
  StandardApplication,
} from "./types";

interface PmsCredentials {
  apiKey?: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
}

const REQUEST_TIMEOUT_MS = 20_000;

function getCredentials(connection: PmsConnectionConfig): PmsCredentials {
  const ref = (connection.credentialRef || connection.provider)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "_");
  const env = (key: string) => process.env[`PMS_${ref}_${key}`];
  return {
    apiKey: env("API_KEY"),
    username: env("USERNAME"),
    password: env("PASSWORD"),
    clientId: env("CLIENT_ID"),
    clientSecret: env("CLIENT_SECRET"),
  };
}

function notConfigured(provider: string, needed: string): PmsSubmitResult {
  return {
    ok: false,
    code: "not_configured",
    message: `${provider} credentials are not configured (missing ${needed}). Falling back to email delivery.`,
  };
}

async function postJson(
  url: string,
  body: unknown,
  headers: Record<string, string>
): Promise<{ status: number; json: any; text: string }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    // non-JSON response; keep raw text for error reporting
  }
  return { status: res.status, json, text };
}

const xmlEscape = (s: string) =>
  s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] as string)
  );

// ---------------------------------------------------------------------------
// Entrata — JSON API (sendLeads)
// ---------------------------------------------------------------------------

async function submitEntrata(
  app: StandardApplication,
  connection: PmsConnectionConfig
): Promise<PmsSubmitResult> {
  const creds = getCredentials(connection);
  if (!creds.username || !creds.password) {
    return notConfigured("Entrata", "USERNAME/PASSWORD");
  }
  if (!connection.apiBaseUrl || !connection.externalPropertyId) {
    return {
      ok: false,
      code: "not_configured",
      message: "Entrata connection is missing apiBaseUrl or externalPropertyId.",
    };
  }

  const body = {
    auth: { type: "basic" },
    requestId: `homeu-${Date.now()}`,
    method: {
      name: "sendLeads",
      version: "r2",
      params: {
        propertyId: connection.externalPropertyId,
        doNotSendConfirmationEmail: "0",
        prospects: {
          prospect: [
            {
              leadSource: {
                originatingLeadSourceId: connection.externalSourceId ?? "HomeU",
              },
              customers: {
                customer: [
                  {
                    name: {
                      firstName: app.applicant.firstName,
                      lastName: app.applicant.lastName,
                    },
                    phone: app.applicant.phone
                      ? { personalPhoneNumber: app.applicant.phone }
                      : undefined,
                    email: app.applicant.email,
                  },
                ],
              },
              customerPreferences: app.property.unitNumber
                ? { comment: `Requested unit: ${app.property.unitNumber}` }
                : undefined,
              events: {
                event: [
                  {
                    type: "WebLead",
                    date: app.meta.submittedAt,
                    comments: buildProspectComments(app),
                  },
                ],
              },
            },
          ],
        },
      },
    },
  };

  const auth = Buffer.from(`${creds.username}:${creds.password}`).toString("base64");
  const { status, json, text } = await postJson(
    `${connection.apiBaseUrl.replace(/\/$/, "")}/api/v1/leads`,
    body,
    { Authorization: `Basic ${auth}` }
  );

  if (status >= 200 && status < 300 && !json?.response?.error) {
    const leadId =
      json?.response?.result?.prospects?.prospect?.[0]?.applicationId ??
      json?.response?.result?.prospects?.prospect?.[0]?.id;
    return {
      ok: true,
      externalApplicationId: leadId ? String(leadId) : undefined,
      message: "Application submitted to Entrata as a guest card/lead.",
    };
  }
  return {
    ok: false,
    code: "api_error",
    message: `Entrata API error (${status}): ${json?.response?.error?.message ?? text.slice(0, 300)}`,
  };
}

// ---------------------------------------------------------------------------
// Yardi Voyager — ILS Guest Card (SOAP)
// ---------------------------------------------------------------------------

async function submitYardi(
  app: StandardApplication,
  connection: PmsConnectionConfig
): Promise<PmsSubmitResult> {
  const creds = getCredentials(connection);
  if (!creds.username || !creds.password) {
    return notConfigured("Yardi", "USERNAME/PASSWORD");
  }
  if (!connection.apiBaseUrl || !connection.externalPropertyId) {
    return {
      ok: false,
      code: "not_configured",
      message: "Yardi connection is missing apiBaseUrl or externalPropertyId.",
    };
  }

  const e = xmlEscape;
  const leadXml = `<LeadManagement><Prospects><Prospect>
    <Customers><Customer Type="prospect">
      <Name><FirstName>${e(app.applicant.firstName)}</FirstName><LastName>${e(app.applicant.lastName)}</LastName></Name>
      ${app.applicant.phone ? `<Phone PhoneType="cell"><PhoneNumber>${e(app.applicant.phone)}</PhoneNumber></Phone>` : ""}
      <Email>${e(app.applicant.email)}</Email>
    </Customer></Customers>
    <CustomerPreferences><Comment>${e(buildProspectComments(app))}</Comment></CustomerPreferences>
    <Events><Event EventType="WebService" EventDate="${e(app.meta.submittedAt)}">
      <TransactionSource>${e(connection.externalSourceId ?? "HomeU")}</TransactionSource>
    </Event></Events>
  </Prospect></Prospects></LeadManagement>`;

  const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ImportYardiGuest_Login xmlns="http://tempuri.org/YSI.Interfaces.WebServices/ItfILSGuestCard">
      <UserName>${e(creds.username)}</UserName>
      <Password>${e(creds.password)}</Password>
      <ServerName>${e(process.env.PMS_YARDI_SERVER_NAME ?? "")}</ServerName>
      <Database>${e(process.env.PMS_YARDI_DATABASE ?? "")}</Database>
      <Platform>SQL Server</Platform>
      <YardiPropertyId>${e(connection.externalPropertyId)}</YardiPropertyId>
      <InterfaceEntity>HomeU</InterfaceEntity>
      <InterfaceLicense>${e(process.env.PMS_YARDI_INTERFACE_LICENSE ?? "")}</InterfaceLicense>
      <XmlDoc>${e(leadXml)}</XmlDoc>
    </ImportYardiGuest_Login>
  </soap:Body>
</soap:Envelope>`;

  const res = await fetch(connection.apiBaseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction:
        '"http://tempuri.org/YSI.Interfaces.WebServices/ItfILSGuestCard/ImportYardiGuest_Login"',
    },
    body: envelope,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const text = await res.text();

  if (res.ok && !/<ErrorMessages>|Error<\/MessageType>/i.test(text)) {
    const idMatch = text.match(/<CustomerID[^>]*>([^<]+)<\/CustomerID>/i);
    return {
      ok: true,
      externalApplicationId: idMatch?.[1],
      message: "Guest card created in Yardi Voyager.",
    };
  }
  return {
    ok: false,
    code: "api_error",
    message: `Yardi ILS error (${res.status}): ${text.slice(0, 300)}`,
  };
}

// ---------------------------------------------------------------------------
// Buildium — REST API (applicants)
// ---------------------------------------------------------------------------

async function submitBuildium(
  app: StandardApplication,
  connection: PmsConnectionConfig
): Promise<PmsSubmitResult> {
  const creds = getCredentials(connection);
  if (!creds.clientId || !creds.clientSecret) {
    return notConfigured("Buildium", "CLIENT_ID/CLIENT_SECRET");
  }
  if (!connection.externalPropertyId) {
    return {
      ok: false,
      code: "not_configured",
      message: "Buildium connection is missing externalPropertyId.",
    };
  }

  const base = connection.apiBaseUrl?.replace(/\/$/, "") || "https://api.buildium.com";
  const { status, json, text } = await postJson(
    `${base}/v1/applicants`,
    {
      FirstName: app.applicant.firstName,
      LastName: app.applicant.lastName,
      Email: app.applicant.email,
      PhoneNumber: app.applicant.phone,
      PropertyId: Number(connection.externalPropertyId),
      Comment: buildProspectComments(app),
    },
    {
      "x-buildium-client-id": creds.clientId,
      "x-buildium-client-secret": creds.clientSecret,
    }
  );

  if (status >= 200 && status < 300) {
    return {
      ok: true,
      externalApplicationId: json?.Id ? String(json.Id) : undefined,
      message: "Applicant created in Buildium.",
    };
  }
  return {
    ok: false,
    code: "api_error",
    message: `Buildium API error (${status}): ${json?.UserMessage ?? text.slice(0, 300)}`,
  };
}

// ---------------------------------------------------------------------------
// RealPage / RentManager — generic authenticated lead POST
// ---------------------------------------------------------------------------

async function submitGenericLead(
  providerLabel: string,
  app: StandardApplication,
  connection: PmsConnectionConfig
): Promise<PmsSubmitResult> {
  const creds = getCredentials(connection);
  if (!creds.apiKey) {
    return notConfigured(providerLabel, "API_KEY");
  }
  if (!connection.apiBaseUrl) {
    return {
      ok: false,
      code: "not_configured",
      message: `${providerLabel} connection is missing apiBaseUrl.`,
    };
  }

  const { status, json, text } = await postJson(
    `${connection.apiBaseUrl.replace(/\/$/, "")}/leads`,
    {
      source: connection.externalSourceId ?? "HomeU",
      propertyId: connection.externalPropertyId,
      applicant: app.applicant,
      employment: app.employment,
      residenceHistory: app.residenceHistory,
      household: app.household,
      incomeSources: app.incomeSources,
      meta: app.meta,
    },
    { Authorization: `Bearer ${creds.apiKey}` }
  );

  if (status >= 200 && status < 300) {
    return {
      ok: true,
      externalApplicationId:
        json?.id ?? json?.leadId ?? json?.applicationId ?? undefined,
      message: `Application submitted to ${providerLabel}.`,
    };
  }
  return {
    ok: false,
    code: "api_error",
    message: `${providerLabel} API error (${status}): ${text.slice(0, 300)}`,
  };
}

// ---------------------------------------------------------------------------
// Shared helpers + dispatch
// ---------------------------------------------------------------------------

/**
 * Human-readable summary embedded in guest-card comments so leasing agents
 * see the verified HomeU data even in lead-only integrations.
 */
function buildProspectComments(app: StandardApplication): string {
  const lines: string[] = [
    `Application submitted via HomeU${app.applicant.verifiedRenter ? " (Verified Renter)" : ""}.`,
  ];
  if (app.employment.employer) {
    lines.push(
      `Employment: ${app.employment.position ?? "—"} at ${app.employment.employer}` +
        (app.employment.annualIncome
          ? `, $${app.employment.annualIncome.toLocaleString()}/yr`
          : "") +
        (app.employment.verified ? " (income verified)" : "")
    );
  }
  const current = app.residenceHistory[0];
  if (current) {
    lines.push(
      `Current residence: ${current.address}, ${current.city}, ${current.state} — $${current.monthlyRent}/mo since ${current.moveInDate}` +
        (current.onTimePayments > 0
          ? ` (${current.onTimePayments} on-time payments tracked)`
          : "")
    );
  }
  if (app.household.coApplicants.length > 0) {
    lines.push(
      `Co-applicants: ${app.household.coApplicants.map((c) => c.name).join(", ")}`
    );
  }
  return lines.join(" | ");
}

export async function submitToPms(
  connection: PmsConnectionConfig,
  application: StandardApplication
): Promise<PmsSubmitResult> {
  try {
    switch (connection.provider) {
      case "entrata":
        return await submitEntrata(application, connection);
      case "yardi":
        return await submitYardi(application, connection);
      case "buildium":
        return await submitBuildium(application, connection);
      case "realpage":
        return await submitGenericLead("RealPage", application, connection);
      case "rentmanager":
        return await submitGenericLead("Rent Manager", application, connection);
      case "appfolio":
        return {
          ok: false,
          code: "unsupported",
          message:
            "AppFolio does not expose a public applicant API — delivering via email instead.",
        };
      default:
        return {
          ok: false,
          code: "unsupported",
          message: `Unknown PMS provider "${connection.provider}".`,
        };
    }
  } catch (error: any) {
    return {
      ok: false,
      code: "api_error",
      message: `PMS request failed: ${error?.message ?? String(error)}`,
    };
  }
}
