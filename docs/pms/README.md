# PMS Integration Setup — Overview

HomeU submits renter applications directly into property management software
(PMS) so renters never re-type their information into a property's online
application. This directory is the playbook for getting each provider set up.

## How the integration works

```
Renter profile (HomeU)                    Property side
┌─────────────────────────┐
│ renters                 │      ┌──────────────────────────────┐
│ savedApplications       │──┐   │ pmsConnections (per property)│
│ rentalHistory           │  │   │  provider, externalPropertyId│
│ employmentHistory       │  │   │  apiBaseUrl, credentialRef   │
│ verification (Straddle/ │  │   └──────────────┬───────────────┘
│ Argyle)                 │  │                  │
└─────────────────────────┘  ▼                  ▼
                   StandardApplication ──► provider adapter ──► PMS API
                   (src/lib/pms/payload.ts)   (src/lib/pms/providers.ts)
                                              │ on failure/no connection
                                              ▼
                                       email fallback (Resend)
```

- Every submission is recorded in the `applicationSubmissions` table
  (renter-visible at `/dashboard/applications`).
- Connections are managed at `/admin/pms-connections`.
- Adapters are dispatched in `src/lib/pms/providers.ts` via
  `POST /api/applications/submit-pms`.

## Credential model

Credentials live in **server-side environment variables only** — never in the
database. A connection's `credentialRef` selects the env var group, so two PM
companies on the same provider can have separate credentials:

```
credentialRef = "GREYSTAR"  →  PMS_GREYSTAR_USERNAME, PMS_GREYSTAR_PASSWORD, ...
credentialRef = unset       →  PMS_ENTRATA_*, PMS_BUILDIUM_*, ... (provider default)
```

Recognized suffixes: `API_KEY`, `USERNAME`, `PASSWORD`, `CLIENT_ID`,
`CLIENT_SECRET`. Yardi additionally uses the global vars
`PMS_YARDI_SERVER_NAME`, `PMS_YARDI_DATABASE`, `PMS_YARDI_INTERFACE_LICENSE`.

Set them in Vercel (`vercel env add`) for production and `.env.local` for dev.

## Provider status & effort

| Provider     | Adapter | Access path                                | Difficulty | Guide |
|--------------|---------|--------------------------------------------|-----------|-------|
| Buildium     | ✅ REST applicants API | Self-serve API keys in the PM's account | **Easiest — start here** | [buildium.md](./buildium.md) |
| Entrata      | ✅ sendLeads JSON API  | Per-client API user from Entrata      | Medium    | [entrata.md](./entrata.md) |
| Yardi Voyager| ✅ ILS Guest Card SOAP | Standard Interface license from Yardi | Hard (license fee, weeks) | [yardi.md](./yardi.md) |
| RealPage     | ✅ generic lead POST   | RealPage Exchange partner program     | Hard      | [realpage.md](./realpage.md) |
| Rent Manager | ✅ generic lead POST   | API user enabled by the PM company    | Medium    | [rentmanager.md](./rentmanager.md) |
| AppFolio     | ➖ email delivery      | No public applicant API               | N/A       | [appfolio.md](./appfolio.md) |

## The setup process (same shape for every provider)

Each provider guide walks through these five stages:

1. **Apply for access** — who to contact (the provider's partner program, or
   the PM company's admin), what to ask for, and a copy-paste outreach email.
2. **Collect credentials** — exactly which values you'll receive and which
   env vars they map to.
3. **Configure HomeU** — set env vars, then create the connection at
   `/admin/pms-connections` (provider, external property ID, API base URL,
   credential ref).
4. **Test** — use the credential checker in the admin connect dialog, then
   run a live test submission with a throwaway applicant profile.
5. **Go live** — flip the connection status to `active`; monitor the first
   real submissions in `/admin/pms-connections` (last submission column) and
   the `applicationSubmissions` table.

## Test procedure (all providers)

1. In `/admin/pms-connections`, open the connection and use **Check
   credentials** — all required vars must show present.
2. Create a test renter account, fill the application at
   `/dashboard/application` with obviously-fake data (name "HomeU Test").
3. Send → Send to Property → pick the connected property → Submit.
4. Confirm in `/dashboard/applications` the submission shows **Sent directly
   to <provider>** with an external reference id.
5. Confirm with the PM contact that the guest card / applicant appeared in
   their PMS, attributed to lead source "HomeU".
6. Ask the PM to delete the test record.

## Business notes

- In every conversation, the pitch to the PM company: HomeU sends them
  **pre-verified applicants** (identity via Straddle, income via Argyle,
  payment history from tracked rent payments) with zero data entry.
- Most providers attribute leads to a source id — always register **"HomeU"**
  as the lead source so conversions are measurable on their side.
- Getting the first PM company live on Buildium is the fastest proof point;
  Yardi/RealPage unlock the largest portfolios but take partnership lead time.
