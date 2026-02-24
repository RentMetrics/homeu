import { NextRequest, NextResponse } from "next/server";
import type { LeverageScoreInput, LeverageScoreResult, ScoreGrade } from "@/lib/wasm/types";

function getGrade(score: number): ScoreGrade {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 40) return "Poor";
  return "VeryPoor";
}

function calculateLeverageScoreServer(input: LeverageScoreInput): LeverageScoreResult {
  // Vacancy Leverage (30%)
  let vacScore = 40;
  const occDiff = input.market_occupancy - input.occupancy_rate;
  if (occDiff > 10) vacScore += 50;
  else if (occDiff > 5) vacScore += 35;
  else if (occDiff > 0) vacScore += 15;
  else vacScore -= 10;
  if (input.occupancy_rate < 80) vacScore += 10;
  else if (input.occupancy_rate > 97) vacScore -= 20;
  vacScore = Math.max(0, Math.min(100, vacScore));

  // Seasonality (20%)
  const seasonScores: Record<number, number> = { 11: 85, 12: 85, 1: 85, 2: 85, 3: 60, 4: 60, 5: 25, 6: 25, 7: 25, 8: 25, 9: 50, 10: 50 };
  const seasonScore = seasonScores[input.current_month] ?? 50;

  // Market Position (20%)
  const pctAbove = (input.rent_vs_market_pct - 1.0) * 100;
  const mktScore = pctAbove > 15 ? 95 : pctAbove > 10 ? 80 : pctAbove > 5 ? 65 : pctAbove > 0 ? 50 : pctAbove > -5 ? 35 : 20;

  // Property Weakness (15%)
  let weakScore = 40;
  if (input.building_age > 40) weakScore += 25;
  else if (input.building_age > 25) weakScore += 15;
  else if (input.building_age > 15) weakScore += 5;
  else if (input.building_age < 5) weakScore -= 15;
  if (input.google_rating !== undefined && input.google_rating !== null) {
    if (input.google_rating < 3.0) weakScore += 25;
    else if (input.google_rating < 3.5) weakScore += 15;
    else if (input.google_rating < 4.0) weakScore += 5;
    else if (input.google_rating >= 4.5) weakScore -= 10;
  }
  if (input.property_units > 300) weakScore += 10;
  else if (input.property_units > 150) weakScore += 5;
  weakScore = Math.max(0, Math.min(100, weakScore));

  // Concession Climate (15%)
  const climateScore = input.concession_prevalence > 60 ? 90 : input.concession_prevalence > 40 ? 75 : input.concession_prevalence > 20 ? 55 : input.concession_prevalence > 5 ? 35 : 20;

  const score = Math.round(
    (vacScore * 0.3 + seasonScore * 0.2 + mktScore * 0.2 + weakScore * 0.15 + climateScore * 0.15) * 10
  ) / 10;
  const finalScore = Math.max(0, Math.min(100, score));
  const grade = getGrade(finalScore);

  const tips: string[] = [];
  if (input.occupancy_rate < 90) tips.push("Vacancy is your strongest card — mention you have other options.");
  if (input.rent_vs_market_pct > 1.05) tips.push("Your rent is above market average. Present comparable listings as evidence.");
  if (input.concession_prevalence > 30) tips.push("Competitors are offering concessions. Ask for matching incentives.");
  if (tips.length === 0) tips.push("Market conditions are tight. Focus on demonstrating your value as a reliable tenant.");

  const bestTiming = [11, 12, 1, 2].includes(input.current_month)
    ? "Now is an excellent time to negotiate."
    : [5, 6, 7, 8].includes(input.current_month)
    ? "Consider waiting until fall/winter for better leverage."
    : "Current timing is moderate for negotiations.";

  return {
    score: finalScore,
    grade,
    factors: [
      { name: "Vacancy Leverage", value: vacScore, weight: 0.3, contribution: vacScore * 0.3, description: `${input.occupancy_rate}% occ` },
      { name: "Seasonality", value: seasonScore, weight: 0.2, contribution: seasonScore * 0.2, description: `Month ${input.current_month}` },
      { name: "Market Position", value: mktScore, weight: 0.2, contribution: mktScore * 0.2, description: `${pctAbove.toFixed(0)}% vs market` },
      { name: "Property Weakness", value: weakScore, weight: 0.15, contribution: weakScore * 0.15, description: `${input.building_age}yr old` },
      { name: "Concession Climate", value: climateScore, weight: 0.15, contribution: climateScore * 0.15, description: `${input.concession_prevalence}% offering` },
    ],
    negotiation_tips: tips,
    best_timing: bestTiming,
  };
}

export async function POST(req: NextRequest) {
  try {
    const input: LeverageScoreInput = await req.json();
    const result = calculateLeverageScoreServer(input);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Invalid input" }, { status: 400 });
  }
}
