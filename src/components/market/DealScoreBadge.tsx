"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";
import { calculateDealScore } from "@/lib/wasm/resident-scores";
import type { DealScoreInput, DealScoreResult } from "@/lib/wasm/types";

function getScoreBadgeColor(score: number) {
  if (score >= 80) return "bg-green-100 text-green-800 border-green-300";
  if (score >= 65) return "bg-blue-100 text-blue-800 border-blue-300";
  if (score >= 50) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-red-100 text-red-800 border-red-300";
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Great Deal";
  if (score >= 65) return "Good Deal";
  if (score >= 50) return "Fair Deal";
  return "Below Avg";
}

interface DealScoreBadgeProps {
  propertyId: string;
  /** Pre-fetched property data to avoid N+1 queries when used in lists */
  property?: any;
  marketStats?: any;
}

export function DealScoreBadge({ propertyId, property: propFromParent, marketStats: marketFromParent }: DealScoreBadgeProps) {
  const [result, setResult] = useState<DealScoreResult | null>(null);

  // Only query if parent didn't provide the data
  const needsQuery = !propFromParent;
  const data = useQuery(
    api.multifamilyproperties.getPropertyWithMarketContext,
    needsQuery ? { propertyId } : "skip"
  );

  const resolvedData = needsQuery ? data : { property: propFromParent, marketStats: marketFromParent };

  useEffect(() => {
    if (!resolvedData?.property) return;

    const property = resolvedData.property;
    const rent = needsQuery ? data?.propertyRent : null;
    const occ = needsQuery ? data?.propertyOccupancy : null;
    const con = needsQuery ? data?.propertyConcession : null;
    const market = resolvedData.marketStats;

    const input: DealScoreInput = {
      current_rent: rent?.averageRent ?? 0,
      market_rent: market?.avgRent ?? rent?.averageRent ?? 0,
      avg_rent_per_sqft: market?.avgRentPerSqFt ?? rent?.rentPerSqFt ?? 0,
      unit_sqft: property.averageUnitSize || 0,
      occupancy_rate: occ?.occupancyRate ?? property.occupancyRate ?? 0,
      market_occupancy: market?.avgOccupancy ?? 0,
      concession_value: con?.concessionAmount ?? 0,
      market_concession_value: market?.avgConcessionValue ?? 0,
      rent_trend_3mo: market?.rentTrend3mo ?? 0,
      rent_trend_12mo: market?.rentTrend12mo ?? 0,
      google_rating: property.googleRating ?? undefined,
      building_year: property.yearBuilt,
      amenity_count: property.amenities?.length ?? 0,
    };

    // Only score if we have meaningful data
    if (input.current_rent > 0 || input.market_rent > 0) {
      calculateDealScore(input).then(setResult);
    }
  }, [resolvedData, data, needsQuery]);

  if (!result) return null;

  return (
    <Badge className={`${getScoreBadgeColor(result.score)} border text-xs py-0.5 px-2 flex items-center gap-1`}>
      <Target className="h-3 w-3" />
      {Math.round(result.score)} {getScoreLabel(result.score)}
    </Badge>
  );
}
