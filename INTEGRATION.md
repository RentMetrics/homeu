# BusinessSignal — HomeU integration

This repo exposes its metrics to **AIMarketingHub** via the BusinessSignal SDK.

## What was added

| File | Purpose |
| --- | --- |
| `src/lib/business-signal.ts` | Vendored SDK |
| `src/app/api/internal/metrics/snapshot/route.ts` | Hub-polled snapshot endpoint |

## Required env vars

```bash
BUSINESS_SIGNAL_SECRET=<32+ char random>
# Hub side: BUSINESS_SIGNAL_SECRET_HOMEU
MARKETING_HUB_URL=https://aimarketinghub.example.com  # optional
```

Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Add a Convex query for real metrics

Create `convex/businessSignal.ts`:

```ts
import { query } from "./_generated/server";

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const users  = await ctx.db.query("users").collect();
    const orgs   = await ctx.db.query("organizations").collect();
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return {
      users: {
        total: users.length,
        new24h: users.filter(u => u._creationTime >= dayAgo).length,
      },
      custom: { organizations: orgs.length },
    };
  },
});
```

## Push live events (optional)

```ts
import { emitEvent } from "@/lib/business-signal";

await emitEvent({
  hubUrl:   process.env.MARKETING_HUB_URL!,
  business: "homeu",
  secret:   process.env.BUSINESS_SIGNAL_SECRET!,
  kind:     "organization.onboarded",
  payload:  { orgId, seats },
});
```

## Verifying

1. Set `BUSINESS_SIGNAL_SECRET` and `BUSINESS_SIGNAL_SECRET_HOMEU` on the hub.
2. Deploy.
3. Hub's Convex dashboard → `businessSignal:pollOne { slug: "homeu" }`.
4. Visit `/dashboard/portfolio` on the hub.
