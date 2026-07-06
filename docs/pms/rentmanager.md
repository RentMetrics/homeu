# Rent Manager — Setup Playbook

**Adapter:** `submitGenericLead` in `src/lib/pms/providers.ts` — bearer-token
JSON POST. Rent Manager (London Computer Systems) exposes a full REST API;
the prospect endpoint gets confirmed during onboarding and the adapter
reshaped if needed.

## 1. Apply for access

Rent Manager API access is enabled **per PM company**, and LCS runs a partner
program for integrators:

1. Apply to the **Rent Manager Integrations program** (https://www.rentmanager.com
   → Integrations → "Become an Integration Partner"). LCS reviews and issues
   partner/API documentation for the Prospects endpoints.
2. The PM company enables API access for HomeU in their Rent Manager
   instance: their admin creates an **API user** (Rent Manager 12 → Admin →
   API access) scoped to Prospects, and notes their instance URL
   (`https://{corp}.api.rentmanager.com`).

### Outreach email template

> Subject: HomeU applicant delivery into Rent Manager
>
> Hi {name} — HomeU sends pre-verified rental applicants (identity, income,
> payment history) directly into Rent Manager as prospects. Could your admin
> create an API user for "HomeU" with Prospects access and share the
> credentials plus your API URL ({corp}.api.rentmanager.com)? Your leasing
> workflow doesn't change — applicants just appear with verification already
> done.

## 2. Collect credentials → env vars

| You receive                     | Where it goes |
|---------------------------------|---------------|
| API token (or username/password exchanged for one) | `PMS_{REF}_API_KEY` |
| Instance URL                    | Connection **API Base URL** |
| Property id (per site)          | Connection **External Property ID** |

> Rent Manager's native auth is username/password → session token
> (`POST /authentication`). If the PM can't issue a long-lived token, store
> `PMS_{REF}_USERNAME`/`PASSWORD` instead and add the token exchange to the
> adapter (15-line change).

## 3–5. Configure, test, go live

Standard flow: `/admin/pms-connections` (provider **Rent Manager**), common
test procedure in [README.md](./README.md), then status `active`.

## Gotchas

- Instance URLs are per-corporation — always on the connection, never global.
- Rent Manager's API is strongly typed per entity (`/Prospects` with embedded
  Contacts); expect to map our StandardApplication into their prospect schema
  during the first onboarding — the data is all present in the payload.
