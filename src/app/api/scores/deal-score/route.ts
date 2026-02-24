import { NextRequest, NextResponse } from "next/server";
import type { DealScoreInput, DealScoreResult, ScoreGrade } from "@/lib/wasm/types";

function getGrade(score: number): ScoreGrade {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 40) return "Poor";
  return "VeryPoor";
}

function calculateDealScoreServer(input: DealScoreInput): DealScoreResult {
  // Rent Position (35%)
  let rentScore = 50;
  if (input.market_rent > 0) {
    const diffPct = ((input.market_rent - input.current_rent) / input.market_rent) * 100;
    rentScore = Math.max(0, Math.min(100, 50 + diffPct * 2.5));
  }

  // Occupancy Signal (20%)
  let occScore = 50;
  if (input.occupancy_rate < 80) occScore += 40;
  else if (input.occupancy_rate < 85) occScore += 30;
  else if (input.occupancy_rate < 90) occScore += 20;
  else if (input.occupancy_rate < 95) occScore += 5;
  else occScore -= 15;
  if (input.market_occupancy > 0) {
    occScore += (input.market_occupancy - input.occupancy_rate) * 1.5;
  }
  occScore = Math.max(0, Math.min(100, occScore));

  // Concession Value (15%)
  let conScore = 50;
  if (input.concession_value > 0) {
    conScore += 15;
    if (input.market_concession_value > 0) {
      const ratio = input.concession_value / input.market_concession_value;
      if (ratio > 1.5) conScore += 25;
      else if (ratio > 1.0) conScore += 15;
      else conScore += 5;
    } else {
      conScore += 20;
    }
  } else if (input.market_concession_value > 0) {
    conScore -= 15;
  }
  conScore = Math.max(0, Math.min(100, conScore));

  // Price/SqFt Value (15%)
  let sqftScore = 50;
  if (input.avg_rent_per_sqft > 0 && input.unit_sqft > 0) {
    const unitPpsqft = input.current_rent / input.unit_sqft;
    const ratio = unitPpsqft / input.avg_rent_per_sqft;
    if (ratio < 0.80) sqftScore = 95;
    else if (ratio < 0.90) sqftScore = 80;
    else if (ratio < 1.0) sqftScore = 65;
    else if (ratio < 1.10) sqftScore = 45;
    else if (ratio < 1.20) sqftScore = 30;
    else sqftScore = 15;
  }

  // Trend Momentum (15%)
  let trendScore = 50;
  if (input.rent_trend_3mo < -3) trendScore += 30;
  else if (input.rent_trend_3mo < -1) trendScore += 20;
  else if (input.rent_trend_3mo < 0) trendScore += 10;
  else if (input.rent_trend_3mo > 3) trendScore -= 20;
  else if (input.rent_trend_3mo > 1) trendScore -= 10;
  if (input.rent_trend_12mo < -2) trendScore += 10;
  else if (input.rent_trend_12mo > 5) trendScore -= 10;
  trendScore = Math.max(0, Math.min(100, trendScore));

  const score = Math.round(
    (rentScore * 0.35 + occScore * 0.2 + conScore * 0.15 + sqftScore * 0.15 + trendScore * 0.15) * 10
  ) / 10;
  const finalScore = Math.max(0, Math.min(100, score));
  const grade = getGrade(finalScore);

  return {
    score: finalScore,
    grade,
    factors: [
      { name: "Rent Position", value: rentScore, weight: 0.35, contribution: rentScore * 0.35, description: `Rent vs market` },
      { name: "Occupancy Signal", value: occScore, weight: 0.2, contribution: occScore * 0.2, description: `${input.occupancy_rate}% occ` },
      { name: "Concession Value", value: conScore, weight: 0.15, contribution: conScore * 0.15, description: `$${input.concession_value}` },
      { name: "Price/SqFt Value", value: sqftScore, weight: 0.15, contribution: sqftScore * 0.15, description: `$/sqft ratio` },
      { name: "Trend Momentum", value: trendScore, weight: 0.15, contribution: trendScore * 0.15, description: `3-mo: ${input.rent_trend_3mo}%` },
    ],
    summary: `Deal Score ${finalScore}/100 — ${grade.toLowerCase()} deal.`,
    recommendation: finalScore >= 75 ? "This is a strong deal." : "Consider negotiating or comparing alternatives.",
  };
}

export async function POST(req: NextRequest) {
  try {
    const input: DealScoreInput = await req.json();
    const result = calculateDealScoreServer(input);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Invalid input" }, { status: 400 });
  }
}
