"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Shield } from "lucide-react";
import { calculateLeverageScore } from "@/lib/wasm/resident-scores";
import type { LeverageScoreInput, LeverageScoreResult } from "@/lib/wasm/types";

function getLeverageColor(score: number) {
  if (score >= 70) return "bg-green-100 text-green-800 border-green-300";
  if (score >= 50) return "bg-blue-100 text-blue-800 border-blue-300";
  if (score >= 30) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-red-100 text-red-800 border-red-300";
}

function getLeverageLabel(score: number) {
  if (score >= 70) return "Strong";
  if (score >= 50) return "Moderate";
  if (score >= 30) return "Limited";
  return "Low";
}

interface LeverageBadgeProps {
  propertyId: string;
  /** Pre-fetched property data to avoid N+1 queries when used in lists */
  property?: any;
  marketStats?: any;
}

export function LeverageBadge({ propertyId, property: propFromParent, marketStats: marketFromParent }: LeverageBadgeProps) {
  const [result, setResult] = useState<LeverageScoreResult | null>(null);

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
    const market = resolvedData.marketStats;

    const currentMonth = new Date().getMonth() + 1;
    const currentRent = rent?.averageRent ?? 0;
    const marketRent = market?.avgRent ?? 0;
    const rentVsMarket = marketRent > 0 ? currentRent / marketRent : 1;
    const buildingAge = new Date().getFullYear() - property.yearBuilt;

    const input: LeverageScoreInput = {
      occupancy_rate: occ?.occupancyRate ?? property.occupancyRate ?? 0,
      market_occupancy: market?.avgOccupancy ?? 0,
      current_month: currentMonth,
      rent_vs_market_pct: rentVsMarket,
      concession_prevalence: market?.concessionPrevalence ?? 0,
      building_age: buildingAge,
      google_rating: property.googleRating ?? undefined,
      property_units: property.totalUnits,
    };

    if (input.occupancy_rate > 0 || input.market_occupancy > 0) {
      calculateLeverageScore(input).then(setResult);
    }
  }, [resolvedData, data, needsQuery]);

  if (!result) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={`${getLeverageColor(result.score)} border text-xs py-0.5 px-2 flex items-center gap-1 cursor-help`}>
            <Shield className="h-3 w-3" />
            {getLeverageLabel(result.score)} Leverage
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-semibold mb-1">Negotiation Leverage: {Math.round(result.score)}/100</p>
          {result.negotiation_tips.slice(0, 2).map((tip, i) => (
            <p key={i} className="text-xs text-muted-foreground">{tip}</p>
          ))}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
