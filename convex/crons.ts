import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "aggregate market stats",
  { hourUTC: 6, minuteUTC: 0 },
  internal.marketStats.aggregateMarketStats
);

export default crons;
