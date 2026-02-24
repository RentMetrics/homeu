import { v } from "convex/values";
import { query, internalMutation, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

// ============================================
// QUERIES
// ============================================

/** Fetch market stats for a given city/state/month */
export const getMarketStats = query({
  args: {
    city: v.string(),
    state: v.string(),
    month: v.string(), // "YYYY-MM"
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("marketStats")
      .withIndex("by_city_state_month", (q) =>
        q.eq("city", args.city).eq("state", args.state).eq("month", args.month)
      )
      .first();
  },
});

/** Fetch state-level market stats (fallback when city-level is unavailable) */
export const getStateMarketStats = query({
  args: {
    state: v.string(),
    month: v.string(),
  },
  handler: async (ctx, args) => {
    // State-level stats use city = "__STATE__" sentinel
    return await ctx.db
      .query("marketStats")
      .withIndex("by_city_state_month", (q) =>
        q.eq("city", "__STATE__").eq("state", args.state).eq("month", args.month)
      )
      .first();
  },
});

// ============================================
// INTERNAL AGGREGATION
// ============================================

/**
 * Dispatcher: schedules per-state aggregation to stay within Convex limits.
 * Called by the nightly cron job.
 */
export const aggregateMarketStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    const US_STATES = [
      "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
      "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
      "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
      "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
      "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
    ];

    // Schedule each state as a separate mutation to stay within limits
    for (let i = 0; i < US_STATES.length; i++) {
      await ctx.scheduler.runAfter(i * 500, internal.marketStats.aggregateStateStats, { state: US_STATES[i] });
    }
  },
});

/**
 * Aggregate market stats for a single state.
 * Processes up to 100 properties per state to stay within Convex read/write limits.
 */
export const aggregateStateStats = internalMutation({
  args: { state: v.string() },
  handler: async (ctx, args) => {
    const { state } = args;
    const now = Date.now();
    const currentDate = new Date(now);
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;

    const properties = await ctx.db
      .query("multifamilyproperties")
      .withIndex("by_state", (q) => q.eq("state", state))
      .take(100);

    if (properties.length === 0) return;

    // Group properties by city
    const citiesMap = new Map<string, typeof properties>();
    for (const prop of properties) {
      const city = prop.city;
      if (!citiesMap.has(city)) citiesMap.set(city, []);
      citiesMap.get(city)!.push(prop);
    }

    // State-level accumulators
    let stateRentSum = 0;
    let stateRentCount = 0;
    let stateRents: number[] = [];
    let stateRentPerSqFtSum = 0;
    let stateRentPerSqFtCount = 0;
    let stateOccupancySum = 0;
    let stateOccupancyCount = 0;
    let stateConcessionSum = 0;
    let stateConcessionCount = 0;
    let statePropsWithConcessions = 0;
    let stateTotalProps = 0;
    let stateTotalUnits = 0;
    let stateRentTrend3moWeighted = 0;
    let stateRentTrend12moWeighted = 0;
    let stateRentTrendCount = 0;

    for (const [city, cityProperties] of citiesMap) {
      const rents: number[] = [];
      let rentPerSqFtSum = 0;
      let rentPerSqFtCount = 0;
      let occupancySum = 0;
      let occupancyCount = 0;
      let concessionSum = 0;
      let concessionCount = 0;
      let propsWithConcessions = 0;
      let cityTotalUnits = 0;

      // Track rents by month across all properties for trend calculation
      const rentsByMonth = new Map<string, number[]>();

      for (const prop of cityProperties) {
        cityTotalUnits += prop.totalUnits;

        // Get rent data (up to 13 months for trend calculation)
        const rentRecords = await ctx.db
          .query("rentData")
          .withIndex("by_propertyId_month", (q) => q.eq("propertyId", prop.propertyId))
          .take(13);

        if (rentRecords.length > 0) {
          const sorted = rentRecords.sort((a, b) => b.month.localeCompare(a.month));
          const latest = sorted[0];
          rents.push(latest.averageRent);
          if (latest.rentPerSqFt > 0) {
            rentPerSqFtSum += latest.rentPerSqFt;
            rentPerSqFtCount++;
          }

          for (const rec of sorted) {
            if (!rentsByMonth.has(rec.month)) rentsByMonth.set(rec.month, []);
            rentsByMonth.get(rec.month)!.push(rec.averageRent);
          }
        }

        // Get latest occupancy data
        const occRecords = await ctx.db
          .query("occupancyData")
          .withIndex("by_propertyId_month", (q) => q.eq("propertyId", prop.propertyId))
          .take(1);

        if (occRecords.length > 0) {
          occupancySum += occRecords[0].occupancyRate;
          occupancyCount++;
        }

        // Get latest concession data
        const conRecords = await ctx.db
          .query("concessionData")
          .withIndex("by_propertyId_month", (q) => q.eq("propertyId", prop.propertyId))
          .take(1);

        if (conRecords.length > 0) {
          concessionSum += conRecords[0].concessionAmount;
          concessionCount++;
          if (conRecords[0].concessionAmount > 0) propsWithConcessions++;
        }
      }

      // Calculate city-level stats
      if (rents.length === 0) continue;

      const avgRent = rents.reduce((s, r) => s + r, 0) / rents.length;
      const sortedRents = [...rents].sort((a, b) => a - b);
      const medianRent = sortedRents.length % 2 === 0
        ? (sortedRents[sortedRents.length / 2 - 1] + sortedRents[sortedRents.length / 2]) / 2
        : sortedRents[Math.floor(sortedRents.length / 2)];
      const avgRentPerSqFt = rentPerSqFtCount > 0 ? rentPerSqFtSum / rentPerSqFtCount : 0;
      const avgOccupancy = occupancyCount > 0 ? occupancySum / occupancyCount : 0;
      const avgConcessionValue = concessionCount > 0 ? concessionSum / concessionCount : 0;
      const concessionPrevalence = cityProperties.length > 0
        ? (propsWithConcessions / cityProperties.length) * 100
        : 0;

      // Calculate rent trends from monthly averages
      const monthlyAvgs = new Map<string, number>();
      for (const [month, monthRents] of rentsByMonth) {
        monthlyAvgs.set(month, monthRents.reduce((s, r) => s + r, 0) / monthRents.length);
      }
      const sortedMonths = [...monthlyAvgs.keys()].sort((a, b) => b.localeCompare(a));

      let rentTrend3mo = 0;
      let rentTrend12mo = 0;

      if (sortedMonths.length >= 2) {
        const latestAvg = monthlyAvgs.get(sortedMonths[0])!;
        const mo3Ago = sortedMonths.length >= 4 ? sortedMonths[3] : sortedMonths[sortedMonths.length - 1];
        const avg3mo = monthlyAvgs.get(mo3Ago)!;
        if (avg3mo > 0) {
          rentTrend3mo = ((latestAvg - avg3mo) / avg3mo) * 100;
        }
        const mo12Ago = sortedMonths.length >= 13 ? sortedMonths[12] : sortedMonths[sortedMonths.length - 1];
        const avg12mo = monthlyAvgs.get(mo12Ago)!;
        if (avg12mo > 0) {
          rentTrend12mo = ((latestAvg - avg12mo) / avg12mo) * 100;
        }
      }

      // Upsert city stats
      const existing = await ctx.db
        .query("marketStats")
        .withIndex("by_city_state_month", (q) =>
          q.eq("city", city).eq("state", state).eq("month", currentMonth)
        )
        .first();

      const statsDoc = {
        city,
        state,
        month: currentMonth,
        avgRent,
        medianRent,
        avgRentPerSqFt,
        avgOccupancy,
        avgConcessionValue,
        concessionPrevalence,
        rentTrend3mo: Math.round(rentTrend3mo * 100) / 100,
        rentTrend12mo: Math.round(rentTrend12mo * 100) / 100,
        propertyCount: cityProperties.length,
        totalUnits: cityTotalUnits,
        updatedAt: now,
      };

      if (existing) {
        await ctx.db.patch(existing._id, statsDoc);
      } else {
        await ctx.db.insert("marketStats", statsDoc);
      }

      // Accumulate state-level stats
      stateRentSum += avgRent * rents.length;
      stateRentCount += rents.length;
      stateRents.push(...rents);
      stateRentPerSqFtSum += avgRentPerSqFt * rentPerSqFtCount;
      stateRentPerSqFtCount += rentPerSqFtCount;
      stateOccupancySum += avgOccupancy * occupancyCount;
      stateOccupancyCount += occupancyCount;
      stateConcessionSum += avgConcessionValue * concessionCount;
      stateConcessionCount += concessionCount;
      statePropsWithConcessions += propsWithConcessions;
      stateTotalProps += cityProperties.length;
      stateTotalUnits += cityTotalUnits;
      stateRentTrend3moWeighted += rentTrend3mo * cityProperties.length;
      stateRentTrend12moWeighted += rentTrend12mo * cityProperties.length;
      stateRentTrendCount += cityProperties.length;
    }

    // Upsert state-level stats
    if (stateRentCount > 0) {
      const stateAvgRent = stateRentSum / stateRentCount;
      const sortedStateRents = [...stateRents].sort((a, b) => a - b);
      const stateMedianRent = sortedStateRents.length % 2 === 0
        ? (sortedStateRents[sortedStateRents.length / 2 - 1] + sortedStateRents[sortedStateRents.length / 2]) / 2
        : sortedStateRents[Math.floor(sortedStateRents.length / 2)];

      const existingState = await ctx.db
        .query("marketStats")
        .withIndex("by_city_state_month", (q) =>
          q.eq("city", "__STATE__").eq("state", state).eq("month", currentMonth)
        )
        .first();

      const stateStatsDoc = {
        city: "__STATE__",
        state,
        month: currentMonth,
        avgRent: stateAvgRent,
        medianRent: stateMedianRent,
        avgRentPerSqFt: stateRentPerSqFtCount > 0 ? stateRentPerSqFtSum / stateRentPerSqFtCount : 0,
        avgOccupancy: stateOccupancyCount > 0 ? stateOccupancySum / stateOccupancyCount : 0,
        avgConcessionValue: stateConcessionCount > 0 ? stateConcessionSum / stateConcessionCount : 0,
        concessionPrevalence: stateTotalProps > 0 ? (statePropsWithConcessions / stateTotalProps) * 100 : 0,
        rentTrend3mo: stateRentTrendCount > 0 ? Math.round((stateRentTrend3moWeighted / stateRentTrendCount) * 100) / 100 : 0,
        rentTrend12mo: stateRentTrendCount > 0 ? Math.round((stateRentTrend12moWeighted / stateRentTrendCount) * 100) / 100 : 0,
        propertyCount: stateTotalProps,
        totalUnits: stateTotalUnits,
        updatedAt: now,
      };

      if (existingState) {
        await ctx.db.patch(existingState._id, stateStatsDoc);
      } else {
        await ctx.db.insert("marketStats", stateStatsDoc);
      }
    }
  },
});

// ============================================
// MANUAL SEED TRIGGER
// ============================================

/** Manually trigger market stats aggregation (for initial seeding or refresh) */
export const triggerAggregation = mutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, internal.marketStats.aggregateMarketStats);
    return { status: "scheduled", message: "Market stats aggregation has been scheduled." };
  },
});

/**
 * Seed rent/occupancy data from existing properties so aggregation has data to work with.
 * Generates realistic market data based on property size, age, and location.
 * Run once to bootstrap, then the nightly cron keeps stats up-to-date.
 */
export const seedMarketData = mutation({
  args: { state: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const currentDate = new Date(now);
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;

    // Build previous months list for trend data
    const months: string[] = [];
    for (let i = 0; i < 13; i++) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    // Get properties (optionally filtered by state)
    let properties;
    if (args.state) {
      properties = await ctx.db
        .query("multifamilyproperties")
        .withIndex("by_state", (q) => q.eq("state", args.state!))
        .take(200);
    } else {
      properties = await ctx.db.query("multifamilyproperties").take(500);
    }

    let seeded = 0;
    for (const prop of properties) {
      // Check if rent data already exists
      const existingRent = await ctx.db
        .query("rentData")
        .withIndex("by_propertyId_month", (q) => q.eq("propertyId", prop.propertyId).eq("month", currentMonth))
        .first();

      if (existingRent) continue; // Skip if already seeded

      // Generate realistic rent based on unit size and year built
      const sqft = prop.averageUnitSize || 900;
      const age = currentDate.getFullYear() - prop.yearBuilt;
      // Base rent: $1.10-$1.80/sqft depending on age
      const basePricePerSqFt = age < 5 ? 1.80 : age < 15 ? 1.50 : age < 30 ? 1.25 : 1.10;
      // Add some variance (±15%)
      const variance = 0.85 + Math.random() * 0.30;
      const rentPerSqFt = Math.round(basePricePerSqFt * variance * 100) / 100;
      const baseRent = Math.round(sqft * rentPerSqFt);

      // Generate 13 months of rent data with slight upward trend
      for (let i = 0; i < months.length; i++) {
        // Slight downward adjustment for older months (simulates 2-3% annual growth)
        const trendFactor = 1 - (i * 0.002);
        const monthRent = Math.round(baseRent * trendFactor);
        await ctx.db.insert("rentData", {
          propertyId: prop.propertyId,
          month: months[i],
          averageRent: monthRent,
          minRent: Math.round(monthRent * 0.80),
          maxRent: Math.round(monthRent * 1.25),
          rentPerSqFt: Math.round((monthRent / sqft) * 100) / 100,
          totalRevenue: monthRent * prop.totalUnits,
          unitsRented: Math.round(prop.totalUnits * (0.88 + Math.random() * 0.10)),
          totalUnits: prop.totalUnits,
          createdAt: now,
        });
      }

      // Generate occupancy data (current month only)
      const occupancyRate = Math.round((88 + Math.random() * 10) * 10) / 10; // 88-98%
      const occupiedUnits = Math.round(prop.totalUnits * occupancyRate / 100);
      await ctx.db.insert("occupancyData", {
        propertyId: prop.propertyId,
        month: currentMonth,
        occupancyRate,
        occupiedUnits,
        vacantUnits: prop.totalUnits - occupiedUnits,
        totalUnits: prop.totalUnits,
        createdAt: now,
      });

      // Generate concession data (~30% of properties have concessions)
      if (Math.random() < 0.30) {
        const concessionTypes = ["Free Rent", "Reduced Rent", "Move-in Special"];
        await ctx.db.insert("concessionData", {
          propertyId: prop.propertyId,
          month: currentMonth,
          concessionType: concessionTypes[Math.floor(Math.random() * concessionTypes.length)],
          concessionAmount: Math.round(200 + Math.random() * 600), // $200-$800
          concessionDuration: Math.random() < 0.5 ? 1 : 2,
          unitsWithConcessions: Math.round(prop.totalUnits * (0.1 + Math.random() * 0.2)),
          totalUnits: prop.totalUnits,
          createdAt: now,
        });
      }

      seeded++;
    }

    // Now trigger aggregation to compute market stats
    if (seeded > 0) {
      await ctx.scheduler.runAfter(0, internal.marketStats.aggregateMarketStats);
    }

    return { seeded, message: `Seeded rent/occupancy data for ${seeded} properties. Aggregation scheduled.` };
  },
});
