import { NextRequest, NextResponse } from "next/server";
import type { RenewalStrategyInput, RenewalStrategyResult } from "@/lib/wasm/types";

function calculateRenewalStrategyServer(input: RenewalStrategyInput): RenewalStrategyResult {
  let leverage = 30;
  const rentRatio = input.market_rent > 0 ? input.current_rent / input.market_rent : 1;

  if (rentRatio > 1.15) leverage += 25;
  else if (rentRatio > 1.05) leverage += 15;
  else if (rentRatio > 1.0) leverage += 5;
  else if (rentRatio < 0.90) leverage -= 15;

  if (input.occupancy_rate < 85) leverage += 20;
  else if (input.occupancy_rate < 90) leverage += 10;
  else if (input.occupancy_rate < 95) leverage += 5;
  else leverage -= 5;

  const tenureYears = input.tenant_tenure_months / 12;
  const loyaltyDiscount = Math.min(tenureYears * 2, 10);
  const paymentBonus = input.on_time_payment_rate >= 98 ? 5 : input.on_time_payment_rate >= 95 ? 3 : 0;

  const seasonalAdj = [11, 12, 1, 2].includes(input.lease_end_month) ? 5 : [5, 6, 7, 8].includes(input.lease_end_month) ? -5 : 0;
  if (input.rent_trend_3mo < -2) leverage += 10;
  else if (input.rent_trend_3mo < 0) leverage += 5;
  leverage += seasonalAdj;
  leverage = Math.max(0, Math.min(100, leverage));

  const baseDiscount = leverage > 70 ? 8 : leverage > 50 ? 5 : leverage > 30 ? 3 : 1;
  const maxDiscount = Math.min(baseDiscount + loyaltyDiscount + paymentBonus, 20);
  const targetRent = Math.round(input.current_rent * (1 - maxDiscount / 100) * 100) / 100;

  let action: string;
  if (rentRatio > 1.10 && input.occupancy_rate < 92) action = "negotiate";
  else if (rentRatio < 0.95 || (input.occupancy_rate > 97 && rentRatio < 1.05)) action = "renew";
  else if (leverage > 60) action = "negotiate";
  else if (maxDiscount < 3 && input.occupancy_rate > 95) action = "explore";
  else action = "negotiate";

  const talkingPoints: string[] = [];
  if (input.tenant_tenure_months >= 12) talkingPoints.push(`You've been a reliable tenant for ${input.tenant_tenure_months} months.`);
  if (input.on_time_payment_rate >= 95) talkingPoints.push(`Your ${input.on_time_payment_rate.toFixed(0)}% on-time payment rate makes you low-risk.`);
  if (input.current_rent > input.market_rent && input.market_rent > 0) talkingPoints.push(`Your rent is ${((rentRatio - 1) * 100).toFixed(0)}% above market rate.`);
  if (talkingPoints.length === 0) talkingPoints.push("Emphasize your reliability and interest in a long-term stay.");

  const monthsBeforeEnd = input.lease_end_month >= input.current_month
    ? input.lease_end_month - input.current_month
    : 12 - input.current_month + input.lease_end_month;
  const timingAdvice = monthsBeforeEnd >= 3 && monthsBeforeEnd <= 4
    ? "Perfect timing — 60-90 days before lease end."
    : monthsBeforeEnd > 4
    ? `Your lease ends in ~${monthsBeforeEnd} months. Start 60-90 days before.`
    : "Initiate negotiations immediately.";

  return {
    recommended_action: action,
    target_rent: targetRent,
    max_discount_pct: Math.round(maxDiscount * 10) / 10,
    leverage_score: Math.round(leverage * 10) / 10,
    talking_points: talkingPoints,
    scripts: [
      { scenario: "Opening Request", script: `Hi, I'd like to discuss my lease renewal. I've been a great tenant for ${input.tenant_tenure_months} months. Would you consider renewing at $${targetRent}/month?` },
      { scenario: "Alternative Ask", script: "If a rent reduction isn't possible, I'd be open to other concessions — waived parking fees, a storage unit, or a month of free rent." },
    ],
    timing_advice: timingAdvice,
  };
}

export async function POST(req: NextRequest) {
  try {
    const input: RenewalStrategyInput = await req.json();
    const result = calculateRenewalStrategyServer(input);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Invalid input" }, { status: 400 });
  }
}
