# Buildium — Setup Playbook

**Adapter:** `submitBuildium` in `src/lib/pms/providers.ts` — creates an
applicant via Buildium's Open API (`POST /v1/applicants`).
**Best first target:** credentials are self-serve; a cooperative PM company
can be live in under an hour.

## 1. Apply for access

Buildium's Open API is enabled per Buildium account by the **PM company
itself** — there is no vendor gatekeeping for basic API keys.

Ask your PM contact (must be an Account Administrator) to:

1. Log into Buildium → **Settings → Application settings → API keys**
   (developer docs: https://developer.buildium.com).
2. Create a new API key named **"HomeU"**.
3. Send you the **Client ID** and **Client Secret** through a secure channel
   (1Password share, not email).

> Note: API access requires the PM company to be on a Buildium plan that
> includes Open API (Premium; confirm with their account rep if the API keys
> page is missing).

### Outreach email template

> Subject: Enable HomeU applicant delivery into your Buildium account
>
> Hi {name} — HomeU sends you rental applicants with verified identity,
> income, and payment history, delivered straight into Buildium as applicant
> records (no data entry, no PDFs). To turn this on we need a Buildium API
> key: Settings → Application settings → API keys → "Add API key", name it
> "HomeU", and share the Client ID/Secret with us securely. Takes about two
> minutes — happy to walk through it on a call.

## 2. Collect credentials → env vars

| You receive     | Env var                       |
|-----------------|-------------------------------|
| Client ID       | `PMS_{REF}_CLIENT_ID`         |
| Client Secret   | `PMS_{REF}_CLIENT_SECRET`     |

`{REF}` = the credential ref you choose for this PM company (e.g. `ACMEPM`).

You also need each property's **Buildium rental property ID** (numeric — the
PM can read it from the property page URL in Buildium, or via
`GET /v1/rentals`).

## 3. Configure HomeU

- `vercel env add PMS_ACMEPM_CLIENT_ID` / `..._CLIENT_SECRET` (all environments).
- `/admin/pms-connections` → Connect Property:
  - Provider: **Buildium**
  - External Property ID: the numeric rental id
  - API Base URL: leave blank (defaults to `https://api.buildium.com`)
  - Credential Ref: `ACMEPM`
  - Fallback Email: the leasing office email
  - Status: `pending` until tested

## 4. Test

Follow the common test procedure in [README.md](./README.md). Success = a new
applicant appears in Buildium under the property with the comment block
containing the HomeU verification summary.

## 5. Go live

Set status `active`. The adapter reports Buildium's applicant `Id` back as
the external reference on each submission.

## Gotchas

- Buildium rate-limits per key (HTTP 429) — one applicant per submission is
  well within limits.
- `PropertyId` must be the **rentals** id, not an association id.
- Buildium's applicant record carries name/email/phone natively; the full
  HomeU application (rental history, income, household) rides in the Comment
  field. If the PM wants structured data deeper than that, revisit with
  Buildium's applicant-group and lease-transaction endpoints.
