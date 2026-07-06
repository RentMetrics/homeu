# AppFolio — Setup Playbook

**Adapter:** none (by design). AppFolio does not expose a public API for
creating applicants/guest cards — our dispatcher returns `unsupported` and
the submission is **delivered by email** with the full verified application
summary. Renters still get one-click submission; the PM gets a rich email
instead of a PMS record.

## What to do today

1. Create the connection at `/admin/pms-connections` with provider
   **AppFolio (email delivery)** and set **Fallback Email** to the leasing
   office address (auto-filled from the property record when present).
2. Submissions are tracked identically in `applicationSubmissions`.

## Path to a real integration

- **AppFolio Stack marketplace** (https://www.appfolio.com/stack) is their
  partner program. Apply as a prospective Stack partner — inbound
  lead/applicant delivery is the pitch. Access is selective and
  relationship-driven; expect this to be the longest timeline of any
  provider.
- AppFolio's **Data API** (reporting) is read-only and doesn't help with
  applicant creation; don't burn time on it.
- Practical interim: many AppFolio PMs accept **email-to-lead ingestion**
  from registered ILS senders — AppFolio parses inbound lead emails from
  recognized listing sources into guest cards. When you talk to a PM on
  AppFolio, ask them to add HomeU's sending address as a recognized lead
  source; if AppFolio's parser picks up our emails, delivery becomes
  effectively structured without an API. Our email template already leads
  with applicant name/contact in parseable form.

### Outreach email template

> Subject: Pre-verified applicants for your AppFolio properties
>
> Hi {name} — HomeU sends rental applicants with verified identity, income,
> and payment history. For AppFolio properties we deliver the complete
> application to your leasing inbox (and we're pursuing an AppFolio Stack
> integration for direct delivery). Two asks: (1) confirm the best leasing
> email per property, and (2) if you use AppFolio's lead email ingestion, add
> us as a recognized source so applicants land in your pipeline
> automatically.
