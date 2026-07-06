# Entrata — Setup Playbook

**Adapter:** `submitEntrata` in `src/lib/pms/providers.ts` — creates a
prospect/guest card via Entrata's `sendLeads` API (`POST
https://{client}.entrata.com/api/v1/leads`).

## 1. Apply for access

Entrata API access is granted **per client organization** — each PM company
running Entrata has its own subdomain and must provision an API user for
HomeU. Two paths:

- **Through the PM company (faster):** their Entrata administrator opens a
  ticket with their Entrata account manager requesting a **Web Services API
  user** scoped to the Leads (`sendLeads`) endpoint for HomeU, listing the
  properties to enable.
- **Through Entrata directly (scales):** apply to Entrata's integration
  partner program (https://www.entrata.com — Partners) to get listed, which
  smooths every subsequent PM conversation. Expect a partnership agreement
  and possibly certification of your payload.

Also ask Entrata/the PM to register **"HomeU" as an originating lead source**
so submissions are attributed (this gives you the
`originatingLeadSourceId`).

### Outreach email template

> Subject: HomeU → Entrata lead delivery for {PM company}
>
> Hi {name} — HomeU delivers rental applicants with verified identity, income
> (Argyle), and rent-payment history directly into Entrata as guest cards via
> the sendLeads API. Could you ask your Entrata account manager to (1) create
> a Web Services API user for HomeU with access to the Leads endpoint for the
> properties below, and (2) add "HomeU" as a lead source? We handle the rest —
> your leasing team just sees pre-verified applicants appear in their
> pipeline. Properties: {list}.

## 2. Collect credentials → env vars

| You receive                    | Where it goes                     |
|--------------------------------|-----------------------------------|
| API username                   | `PMS_{REF}_USERNAME`              |
| API password                   | `PMS_{REF}_PASSWORD`              |
| Client subdomain (base URL)    | Connection **API Base URL** (`https://{client}.entrata.com`) |
| Entrata property id (per site) | Connection **External Property ID** |
| Lead source id for HomeU       | Connection **Lead Source ID**     |

## 3. Configure HomeU

- Set the env vars for the credential ref (e.g. `PMS_GREYSTAR_USERNAME`).
- `/admin/pms-connections` → Connect Property with provider **Entrata**,
  the base URL, external property id, lead source id, credential ref.

## 4. Test

Common procedure in [README.md](./README.md). Entrata returns the created
prospect/application id in the response; it shows as the external reference.
Verify with the leasing team that the guest card appears with lead source
"HomeU" and the verification summary in the event comments.

## 5. Go live

Status `active`. Entrata dedupes prospects by email — repeat submissions from
the same renter update the existing guest card rather than duplicating.

## Gotchas

- Every PM company has a **different base URL** (their subdomain) — that's why
  it lives on the connection, not in env.
- Some orgs require IP allow-listing for API users — provide your Vercel
  egress IPs or use a static-IP proxy if they insist.
- The sendLeads schema is versioned (`r2` in our adapter); if Entrata
  certification asks for a different version, it's one line in the adapter.
