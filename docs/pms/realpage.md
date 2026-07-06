# RealPage — Setup Playbook

**Adapter:** `submitGenericLead` in `src/lib/pms/providers.ts` — bearer-token
JSON POST to the lead endpoint provisioned for HomeU. The exact wire format
gets finalized during RealPage certification; the adapter sends the full
StandardApplication payload and is easy to reshape.

## 1. Apply for access

RealPage third-party integrations go through the **RealPage Exchange /
partner program**:

1. Apply at https://developer.realpage.com (RealPage Exchange) as an
   integration vendor — describe the integration as *inbound lead/guest-card
   delivery into OneSite/ILM from a renter application platform*.
2. RealPage assigns a partner/integration manager; expect a partnership
   agreement, sandbox credentials, and a certification pass of your payload
   against their **ILS Guest Card / Leads API**.
3. Each PM company (PMC) then **authorizes HomeU** on their account — the PMC
   admin approves the vendor and RealPage scopes credentials to their site
   ids.

### Outreach email template (to a PM company on RealPage)

> Subject: HomeU applicant delivery into OneSite
>
> Hi {name} — HomeU delivers pre-verified rental applicants (identity,
> income, rent-payment history) directly into your RealPage leasing pipeline
> as guest cards. We're onboarding with RealPage Exchange; the step we need
> from you is vendor authorization on your PMC account for "HomeU" and the
> OneSite property IDs (PMC id + site id) for the properties below. Your
> teams keep working in OneSite/ILM exactly as today. Properties: {list}.

## 2. Collect credentials → env vars

| You receive                          | Where it goes |
|--------------------------------------|---------------|
| API key / bearer token               | `PMS_{REF}_API_KEY` |
| Lead endpoint base URL               | Connection **API Base URL** |
| PMC id + Site id (per property)      | Connection **External Property ID** (`{pmcid}:{siteid}`) |
| Lead source id for "HomeU"           | Connection **Lead Source ID** |

## 3. Configure HomeU

Standard flow at `/admin/pms-connections`, provider **RealPage**.

## 4. Test

RealPage certification includes a sandbox pass — run the common test
procedure (README.md) against sandbox first. Confirm the guest card shows in
OneSite/ILM with source "HomeU", then swap to production credentials.

## 5. Go live

Status `active`.

## Gotchas

- RealPage's lead APIs differ by product line (OneSite vs. ILM vs. Knock
  after acquisition) — pin down with the integration manager **which product
  the PMC uses** before certifying.
- The adapter posts our standardized JSON to `{apiBaseUrl}/leads`; if
  certification lands on a different path or an XML guest-card format,
  implement it in `submitGenericLead`'s RealPage branch (10-line change) —
  the payload data is already complete.
- RealPage typically wants volume/SLA expectations in the agreement; HomeU
  volume is one POST per renter submission.
