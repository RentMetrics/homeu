# Yardi Voyager — Setup Playbook

**Adapter:** `submitYardi` in `src/lib/pms/providers.ts` — creates a guest
card via the Voyager **ILS Guest Card** SOAP interface
(`ImportYardiGuest_Login` on `ItfILSGuestCard`).

Yardi is the heaviest lift (license fees, multi-week lead time) but unlocks
the largest institutional portfolios.

## 1. Apply for access

Yardi interfaces are licensed **per PM company (Voyager database)** through
Yardi's **Standard Interface** program:

1. The PM company contacts their Yardi sales/account rep and requests the
   **ILS/Guest Card standard interface** for vendor **"HomeU"**.
2. Yardi issues an **interface license** (there is typically an annual fee,
   billed to the PM company or the vendor depending on the deal) and
   provisions a web-services endpoint + credentials against the PM's Voyager
   environment.
3. In parallel, apply to the **Yardi Standard Interface Vendor program**
   (interested vendors email Yardi's interface team via
   https://www.yardi.com — Interfaces/Partners) so HomeU is a registered
   vendor; this is a one-time step that every subsequent PM setup reuses.

### Outreach email template

> Subject: Enable the HomeU ILS Guest Card interface for {PM company}
>
> Hi {name} — HomeU sends your leasing teams applicants with verified
> identity, income, and 12+ months of tracked rent-payment history, delivered
> directly into Voyager as guest cards (ILS Guest Card standard interface —
> no new software for your team). Could you ask your Yardi account rep to
> provision the ILS/Guest Card interface for vendor "HomeU"? We'll need the
> web-services URL, ServerName/Database, an interface user + password, and
> the interface license string. We're happy to be on the call with Yardi.

## 2. Collect credentials → env vars

| You receive                        | Env var / field |
|------------------------------------|-----------------|
| Interface username                 | `PMS_{REF}_USERNAME` |
| Interface password                 | `PMS_{REF}_PASSWORD` |
| ServerName                         | `PMS_YARDI_SERVER_NAME` (global) |
| Database                           | `PMS_YARDI_DATABASE` (global) |
| Interface license string           | `PMS_YARDI_INTERFACE_LICENSE` (global) |
| Web services URL (ItfILSGuestCard) | Connection **API Base URL** |
| Voyager property code (per site)   | Connection **External Property ID** |
| ILS source name ("HomeU")          | Connection **Lead Source ID** |

> ⚠️ The three global `PMS_YARDI_*` vars currently support **one Voyager
> environment**. When a second Yardi PM company onboards, move ServerName /
> Database / License into per-ref env vars (small change in
> `submitYardi`) — noted as a TODO in the adapter.

## 3. Configure HomeU

Set env vars, then create the connection with provider **Yardi Voyager**, the
full ItfILSGuestCard service URL as API Base URL, and the Voyager property
code.

## 4. Test

Yardi provisions a **test/UAT database** first in most engagements — run the
common test procedure (README.md) against UAT, have the PM confirm the guest
card in Voyager (prospect appears with agent comments containing the HomeU
verification summary), then repoint the connection's base URL at production.

## 5. Go live

Status `active`. The adapter extracts Voyager's `CustomerID` from the SOAP
response as the external reference.

## Gotchas

- Yardi validates the XML strictly; if they reject the payload during
  certification, they return `<ErrorMessages>` — the adapter surfaces these
  verbatim in the submission error.
- Yardi interface provisioning is measured in **weeks, not days**; start this
  process before you need it.
- Some Voyager environments require IP allow-listing.
- Yardi also offers newer REST-based Guest Card APIs on some stacks
  (RentCafe CRM) — if a PM is on RentCafe CRM Flex, ask their rep whether the
  RentCafe lead API is available instead; it's simpler and our generic lead
  adapter pattern can cover it.
