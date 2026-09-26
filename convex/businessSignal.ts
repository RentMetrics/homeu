/**
 * BusinessSignal v2 — HomeU snapshot for AI Marketing Hub.
 *
 * `collect` is an action that pages through the larger tables with small
 * internal queries (renters and applicationSubmissions carry big `any`
 * payloads, so a single query could blow the 8 MB read limit).
 *
 * AGGREGATES ONLY: counts, sums, labels. Renter ids are passed between the
 * internal queries and this action to compute distinct counts, but never
 * leave it.
 *
 * Polled at GET https://<deployment>.convex.site/business-signal/snapshot
 * (route in convex/http.ts). Events are pushed via `emit`.
 */
import { v } from "convex/values";
import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { DAY_MS, emitEvent, windows, type SnapshotInput } from "./lib/businessSignal";

const SLUG = "homeu";
const PAGE = 100;

/* --------------------------------- renters --------------------------------- */

export const rentersPage = internalQuery({
  args: { cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, { cursor }) => {
    const d30 = Date.now() - 30 * DAY_MS;
    const page = await ctx.db.query("renters").paginate({ numItems: PAGE, cursor });
    let verified = 0;
    let employmentVerified = 0;
    let linked = 0;
    const created: number[] = [];
    const recent: { userId: string; verified: boolean; linked: boolean }[] = [];
    for (const r of page.page) {
      created.push(r._creationTime);
      const isVerified = r.verified === true || r.verificationStatus === "verified";
      const isLinked = r.propertyLinkStatus === "linked";
      if (isVerified) verified++;
      if (r.employmentVerified) employmentVerified++;
      if (isLinked) linked++;
      if (r._creationTime >= d30) recent.push({ userId: r.userId, verified: isVerified, linked: isLinked });
    }
    return {
      created,
      verified,
      employmentVerified,
      linked,
      recent,
      isDone: page.isDone,
      cursor: page.continueCursor,
    };
  },
});

/* --------------------------- application submissions --------------------------- */

export const applicationsPage = internalQuery({
  args: { cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, { cursor }) => {
    const now = Date.now();
    const d30 = now - 30 * DAY_MS;
    const page = await ctx.db
      .query("applicationSubmissions")
      .order("desc")
      .paginate({ numItems: PAGE, cursor });
    let total = 0;
    let last30 = 0;
    let pms30 = 0;
    let email30 = 0;
    let failed30 = 0;
    let approved = 0;
    const userIds30: string[] = [];
    const times30: number[] = [];
    for (const a of page.page) {
      total++;
      if (a.status === "approved") approved++;
      if (a.submittedAt >= d30) {
        last30++;
        times30.push(a.submittedAt);
        userIds30.push(a.userId);
        if (a.status === "failed") failed30++;
        else if (a.channel === "pms") pms30++;
        else email30++;
      }
    }
    return {
      total,
      last30,
      pms30,
      email30,
      failed30,
      approved,
      userIds30,
      times30,
      isDone: page.isDone,
      cursor: page.continueCursor,
    };
  },
});

/* ---------------------------------- revenue ---------------------------------- */

/**
 * homeuRevenue is written once per completed rent payment
 * (rentPayments.processPaymentCompletion): the $9.99 renter platform fee.
 * Reads the last 60 days, newest first.
 */
export const revenue = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const d30 = now - 30 * DAY_MS;
    const d60 = now - 60 * DAY_MS;
    const rows = await ctx.db.query("homeuRevenue").order("desc").take(12000);

    let fees30 = 0;
    let ops30 = 0;
    let payments30 = 0;
    const payers30 = new Set<string>();
    const payersPrev = new Set<string>();
    let reachedEnd = rows.length < 12000;
    for (const r of rows) {
      const at = r.collectedAt ?? r._creationTime;
      if (r._creationTime < d60) {
        reachedEnd = true;
        break;
      }
      if (at >= d30) {
        fees30 += r.totalFee;
        ops30 += r.operationsRevenue;
        payments30++;
        payers30.add(r.renterId);
      } else if (at >= d60) {
        payersPrev.add(r.renterId);
      }
    }

    // Converted = renter's first-ever fee landed in the last 30 days.
    let firstTimePayers30 = 0;
    for (const renterId of payers30) {
      const first = await ctx.db
        .query("homeuRevenue")
        .withIndex("by_renterId", (q) => q.eq("renterId", renterId))
        .first();
      if (first && first._creationTime >= d30) firstTimePayers30++;
    }

    let churned30 = 0;
    for (const id of payersPrev) if (!payers30.has(id)) churned30++;

    const pmSubs = await ctx.db.query("propertyManagerSubscriptions").collect();
    const activePmSubs = pmSubs.filter((s) => s.status === "active" || s.status === "trialing");
    const pmPlans = new Map<string, number>();
    for (const s of activePmSubs) pmPlans.set(s.plan, (pmPlans.get(s.plan) ?? 0) + 1);

    return {
      fees30: Math.round(fees30),
      ops30: Math.round(ops30),
      payments30,
      payers30: [...payers30],
      firstTimePayers30,
      churned30,
      windowComplete: reachedEnd,
      pmPlans: [...pmPlans.entries()].map(([plan, customers]) => ({ plan, customers })),
    };
  },
});

/* ------------------------------ points + activity ------------------------------ */

export const pointsAndActivity = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const d30 = now - 30 * DAY_MS;
    // Ledger rows are small; newest first until we leave the 30-day window.
    const txs = await ctx.db.query("pointTransactions").order("desc").take(12000);
    let earned30 = 0;
    let redeemed30 = 0;
    let rentPoints30 = 0;
    const activeUserIds: string[] = [];
    const activeTimes: number[] = [];
    let complete = txs.length < 12000;
    for (const t of txs) {
      if (t._creationTime < d30) {
        complete = true;
        break;
      }
      if (t.status === "failed") continue;
      if (t.type === "earn") {
        earned30 += t.amount;
        if (t.category === "rent") rentPoints30 += t.amount;
      } else if (t.type === "redeem") {
        redeemed30 += Math.abs(t.amount);
      }
      activeUserIds.push(t.userId);
      activeTimes.push(t.createdAt ?? t._creationTime);
    }

    const balances = await ctx.db.query("userPoints").collect();
    const tiers: Record<string, number> = {};
    let outstanding = 0;
    for (const b of balances) {
      tiers[b.tier] = (tiers[b.tier] ?? 0) + 1;
      outstanding += b.currentBalance;
    }

    const achievements = await ctx.db.query("userAchievements").order("desc").take(5000);
    let achievements30 = 0;
    for (const a of achievements) {
      if (a.unlockedAt >= d30) achievements30++;
      else if (a._creationTime < d30) break;
    }

    return {
      earned30,
      redeemed30,
      rentPoints30,
      activeUserIds,
      activeTimes,
      ledgerWindowComplete: complete,
      outstanding,
      tiers,
      achievements30,
    };
  },
});

/* ------------------------------ PM side + leads ------------------------------ */

export const pmSideAndLeads = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const d30 = now - 30 * DAY_MS;

    const pms = await ctx.db.query("propertyManagers").collect();
    const connections = await ctx.db.query("pmsConnections").collect();
    const providers: Record<string, number> = {};
    for (const c of connections) {
      if (c.status === "active") providers[c.provider] = (providers[c.provider] ?? 0) + 1;
    }

    // Rent-collection predictions generated for PMs (docs carry per-resident
    // arrays, so read only the newest few hundred).
    const preds = await ctx.db.query("rentPredictions").order("desc").take(300);
    const predictions30 = preds.filter((p) => p.generatedAt >= d30).length;

    // Lead list: PMs a renter asked us to onboard (B2B prospects).
    const outreach = await ctx.db.query("pmOutreachRequests").collect();
    const ow = windows(outreach.map((o) => o.createdAt), now);
    const pmEmails = new Set(outreach.map((o) => o.pmEmail.trim().toLowerCase()));

    // Lead list: renter referral invites.
    const referrals = await ctx.db.query("referrals").collect();
    const rw = windows(referrals.map((r) => r.createdAt ?? r._creationTime), now);

    const routings = await ctx.db.query("rentPaymentRouting").collect();

    return {
      pmsTotal: pms.length,
      pmsActive: pms.filter((p) => p.isActive).length,
      pmsPaymentOnboarded: pms.filter((p) => p.paymentOnboardingComplete).length,
      pmsNew30d: pms.filter((p) => p.createdAt >= d30).length,
      pmsActive30d: pms.filter((p) => (p.lastLogin ?? 0) >= d30).length,
      pmsConnectionsActive: Object.values(providers).reduce((a, b) => a + b, 0),
      providers,
      predictions30,
      outreach: {
        total: ow.total,
        new7d: ow.last7d,
        new30d: ow.last30d,
        converted: outreach.filter((o) => o.status === "onboarded").length,
        uniquePms: pmEmails.size,
      },
      referrals: {
        total: rw.total,
        new7d: rw.last7d,
        new30d: rw.last30d,
        converted: referrals.filter((r) => r.status === "completed").length,
      },
      autopayRoutings: routings.filter((r) => r.isActive && r.autoPayEnabled).length,
      activeRoutings: routings.filter((r) => r.isActive).length,
    };
  },
});

/* ---------------------------------- collect ---------------------------------- */

export const collect = internalAction({
  args: {},
  handler: async (ctx): Promise<SnapshotInput> => {
    const now = Date.now();
    const d7 = now - 7 * DAY_MS;

    // Renters (paged).
    const created: number[] = [];
    let verified = 0;
    let employmentVerified = 0;
    let linked = 0;
    const recent: { userId: string; verified: boolean; linked: boolean }[] = [];
    let cursor: string | null = null;
    for (;;) {
      const p: {
        created: number[];
        verified: number;
        employmentVerified: number;
        linked: number;
        recent: { userId: string; verified: boolean; linked: boolean }[];
        isDone: boolean;
        cursor: string;
      } = await ctx.runQuery(internal.businessSignal.rentersPage, { cursor });
      created.push(...p.created);
      verified += p.verified;
      employmentVerified += p.employmentVerified;
      linked += p.linked;
      recent.push(...p.recent);
      if (p.isDone) break;
      cursor = p.cursor;
    }
    const sw = windows(created, now);

    // Application submissions (paged, all-time counts + 30d detail).
    let appsTotal = 0;
    let apps30 = 0;
    let appsPms30 = 0;
    let appsEmail30 = 0;
    let appsFailed30 = 0;
    let appsApproved = 0;
    const appUsers30 = new Set<string>();
    const appActivity: { userId: string; at: number }[] = [];
    cursor = null;
    for (;;) {
      const p: {
        total: number;
        last30: number;
        pms30: number;
        email30: number;
        failed30: number;
        approved: number;
        userIds30: string[];
        times30: number[];
        isDone: boolean;
        cursor: string;
      } = await ctx.runQuery(internal.businessSignal.applicationsPage, { cursor });
      appsTotal += p.total;
      apps30 += p.last30;
      appsPms30 += p.pms30;
      appsEmail30 += p.email30;
      appsFailed30 += p.failed30;
      appsApproved += p.approved;
      p.userIds30.forEach((u, i) => {
        appUsers30.add(u);
        appActivity.push({ userId: u, at: p.times30[i] });
      });
      if (p.isDone) break;
      cursor = p.cursor;
    }

    const rev = await ctx.runQuery(internal.businessSignal.revenue, {});
    const pts = await ctx.runQuery(internal.businessSignal.pointsAndActivity, {});
    const pm = await ctx.runQuery(internal.businessSignal.pmSideAndLeads, {});

    // Active renters = earned/redeemed points (rent, sign-up steps, referrals,
    // achievements), submitted an application, or paid rent through HomeU.
    const active30 = new Set<string>([...pts.activeUserIds, ...appUsers30, ...rev.payers30]);
    const active7 = new Set<string>();
    pts.activeUserIds.forEach((u, i) => {
      if (pts.activeTimes[i] >= d7) active7.add(u);
    });
    for (const a of appActivity) if (a.at >= d7) active7.add(a.userId);

    // Funnel for renters who signed up in the last 30 days.
    const payers = new Set(rev.payers30);
    const newVerified = recent.filter((r) => r.verified).length;
    const newLinked = recent.filter((r) => r.linked).length;
    const newApplied = recent.filter((r) => appUsers30.has(r.userId)).length;
    const newPaying = recent.filter((r) => payers.has(r.userId)).length;

    const gaps = [
      "Revenue is transactional ($9.99 fee per rent payment), not subscriptions — mrr = platform fees collected in the last 30 days (homeuRevenue.totalFee); net-of-rewards in custom.opsRevenue30d.",
      "PM premium subscriptions (propertyManagerSubscriptions) have no price and no Stripe billing wired (upsertSubscription is never called) — counted, no MRR.",
      "renters don't store utm_source/referrer — capture it at sign-up (users.createOrUpdateUser / renters.create).",
      "No test/internal flag on renters — seed/test accounts are included in counts.",
      "No lastActiveAt on renters — active7d/30d come from the points ledger, application submissions and rent payments.",
      "No admin page for PM outreach requests or referrals (renters.getPendingOutreachRequests exists but no UI uses it).",
    ];
    if (!rev.windowComplete) gaps.push("homeuRevenue read cap (12k rows) hit — 30-day revenue is a lower bound.");
    if (!pts.ledgerWindowComplete) gaps.push("pointTransactions read cap (12k rows) hit — 30-day points and activity are lower bounds.");

    return {
      users: { total: sw.total, new24h: sw.last24h, active7d: active7.size, active30d: active30.size },
      revenue: {
        mrr: rev.fees30,
        arr: rev.fees30 * 12,
        paying: rev.payers30.length,
        churn30d: rev.churned30,
      },
      growth: {
        signups24h: sw.last24h,
        signups7d: sw.last7d,
        signups30d: sw.last30d,
        conversions30d: rev.firstTimePayers30,
      },
      funnel: [
        { key: "signed_up", label: "Renters signed up", count: sw.last30d },
        { key: "verified", label: "Identity verified", count: newVerified },
        { key: "linked", label: "Linked to property", count: newLinked },
        { key: "applied", label: "Submitted an application", count: newApplied },
        { key: "paying", label: "Paid rent via HomeU", count: newPaying },
      ],
      leads: [
        {
          key: "pm_outreach",
          label: "Property managers requested by renters",
          total: pm.outreach.total,
          new7d: pm.outreach.new7d,
          new30d: pm.outreach.new30d,
          converted: pm.outreach.converted,
        },
        {
          key: "referrals",
          label: "Renter referral invites",
          total: pm.referrals.total,
          new7d: pm.referrals.new7d,
          new30d: pm.referrals.new30d,
          converted: pm.referrals.converted,
        },
      ],
      plans: [
        { plan: "renter_rent_fee", customers: rev.payers30.length, mrr: rev.fees30 },
        ...rev.pmPlans.map((p) => ({ plan: `pm_${p.plan}`, customers: p.customers })),
      ],
      usage: [
        { key: "applications_submitted", label: "Applications submitted", value: apps30, window: "30d" },
        { key: "applications_pms", label: "Applications sent direct to PMS", value: appsPms30, window: "30d" },
        { key: "points_earned", label: "Points earned", value: pts.earned30, window: "30d" },
        { key: "rent_payments", label: "Rent payments through HomeU", value: rev.payments30, window: "30d" },
        { key: "achievements", label: "Achievements unlocked", value: pts.achievements30, window: "30d" },
        { key: "rent_predictions", label: "PM rent predictions generated", value: pm.predictions30, window: "30d" },
      ],
      signupsDaily: sw.daily,
      custom: {
        activeRenters30d: active30.size,
        rentersVerified: verified,
        rentersEmploymentVerified: employmentVerified,
        rentersLinkedToProperty: linked,
        applicationsTotal: appsTotal,
        applicationsApproved: appsApproved,
        applicationsEmailFallback30d: appsEmail30,
        applicationsFailed30d: appsFailed30,
        opsRevenue30d: rev.ops30,
        pointsRedeemed30d: pts.redeemed30,
        rentPoints30d: pts.rentPoints30,
        pointsOutstanding: pts.outstanding,
        tierBronze: pts.tiers.bronze ?? 0,
        tierSilver: pts.tiers.silver ?? 0,
        tierGold: pts.tiers.gold ?? 0,
        tierPlatinum: pts.tiers.platinum ?? 0,
        activeRentRoutings: pm.activeRoutings,
        autopayRoutings: pm.autopayRoutings,
        propertyManagers: pm.pmsTotal,
        propertyManagersActive: pm.pmsActive,
        propertyManagersPaymentOnboarded: pm.pmsPaymentOnboarded,
        propertyManagersNew30d: pm.pmsNew30d,
        propertyManagersLoggedIn30d: pm.pmsActive30d,
        pmsConnectionsActive: pm.pmsConnectionsActive,
        pmsEntrata: pm.providers.entrata ?? 0,
        pmsYardi: pm.providers.yardi ?? 0,
        pmsBuildium: pm.providers.buildium ?? 0,
        pmsEmail: pm.providers.email ?? 0,
        pmOutreachUniquePms: pm.outreach.uniquePms,
      },
      gaps,
    };
  },
});

/* ---------------------------------- events ---------------------------------- */

export const emit = internalAction({
  args: { kind: v.string(), payload: v.optional(v.any()) },
  handler: async (_ctx, { kind, payload }) => {
    try {
      await emitEvent({
        business: SLUG,
        secret: process.env.BUSINESS_SIGNAL_SECRET,
        hubUrl: process.env.MARKETING_HUB_URL,
        kind,
        payload,
      });
    } catch (err) {
      console.error("[businessSignal] emit failed", kind, err);
    }
  },
});
