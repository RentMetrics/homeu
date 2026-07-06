"use client";

/**
 * Renter-facing HomeU Property Score.
 *
 * Computes the apartment desirability score live from real market data
 * (rent vs market, occupancy, trends, Google rating, amenities, value per
 * sqft) via the Rust/WASM engine in src/lib/wasm/resident-scores — replacing
 * the old fabricated homeuScore. Transparent by design: renters see every
 * factor, its weight, and whether it came from real data or an estimate.
 */

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, Info } from "lucide-react";
import { calculateDesirability } from "@/lib/wasm/resident-scores";
import type { DesirabilityInput, DesirabilityResult, ScoreGrade } from "@/lib/wasm/types";

interface ScoreState {
  result: DesirabilityResult | null;
  /** Inputs that came from real property/market data (vs neutral estimates) */
  dataBacked: string[];
  estimated: string[];
  loading: boolean;
}

export function usePropertyDesirability(propertyId: string | undefined): ScoreState {
  const context = useQuery(
    api.multifamilyproperties.getPropertyWithMarketContext,
    propertyId ? { propertyId } : "skip"
  );

  const [result, setResult] = useState<DesirabilityResult | null>(null);
  const [loading, setLoading] = useState(true);

  const built = useMemo(() => {
    if (!context?.property) return null;
    const { property, propertyRent, propertyOccupancy, propertyConcession, marketStats } = context;

    const dataBacked: string[] = [];
    const estimated: string[] = [];
    const track = <T,>(label: string, real: T | undefined | null, fallback: T): T => {
      if (real !== undefined && real !== null) {
        dataBacked.push(label);
        return real;
      }
      estimated.push(label);
      return fallback;
    };

    const currentRent = track(
      "Property rent",
      propertyRent?.averageRent,
      marketStats?.avgRent ?? 1800
    );
    const marketRent = track("Market rent", marketStats?.avgRent, currentRent);
    const unitSqft = property.averageUnitSize || 900;
    const pricePerSqft = track(
      "Price per sqft",
      propertyRent?.rentPerSqFt,
      unitSqft > 0 ? currentRent / unitSqft : 2
    );

    const input: DesirabilityInput = {
      current_rent: currentRent,
      market_rent: marketRent,
      occupancy_rate: track(
        "Occupancy",
        propertyOccupancy?.occupancyRate,
        marketStats?.avgOccupancy ?? 90
      ),
      rent_trend_3mo: track("3-month rent trend", marketStats?.rentTrend3mo, 0),
      rent_trend_12mo: track("12-month rent trend", marketStats?.rentTrend12mo, 0),
      google_rating: property.googleRating ?? undefined,
      amenity_count: property.amenities?.length ?? 0,
      building_year: property.yearBuilt,
      unit_sqft: unitSqft,
      price_per_sqft: pricePerSqft,
      market_price_per_sqft: track(
        "Market price per sqft",
        marketStats?.avgRentPerSqFt,
        pricePerSqft
      ),
      has_concessions: Boolean(propertyConcession),
      concession_value: propertyConcession?.concessionAmount ?? 0,
    };
    if (property.googleRating) dataBacked.push("Google rating");

    return { input, dataBacked, estimated };
  }, [context]);

  useEffect(() => {
    let cancelled = false;
    if (!built) return;
    setLoading(true);
    calculateDesirability(built.input)
      .then((r) => {
        if (!cancelled) setResult(r);
      })
      .catch((err) => console.error("Desirability calculation failed:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [built]);

  return {
    result,
    dataBacked: built?.dataBacked ?? [],
    estimated: built?.estimated ?? [],
    loading: loading || context === undefined,
  };
}

const gradeStyles: Record<ScoreGrade, string> = {
  Excellent: "bg-green-100 text-green-700 border-green-300",
  Good: "bg-blue-100 text-blue-700 border-blue-300",
  Fair: "bg-yellow-100 text-yellow-700 border-yellow-300",
  Poor: "bg-orange-100 text-orange-700 border-orange-300",
  VeryPoor: "bg-red-100 text-red-700 border-red-300",
};

/** Compact score badge for hero overlays (replaces the old homeuScore badge) */
export function PropertyScoreBadge({ propertyId }: { propertyId: string }) {
  const { result, loading } = usePropertyDesirability(propertyId);

  if (loading || !result) return null;

  return (
    <Badge className={`${gradeStyles[result.grade] ?? gradeStyles.Fair} border text-base py-1 px-3`}>
      <Home className="h-4 w-4 mr-1" />
      {Math.round(result.score)}
    </Badge>
  );
}

/** Full transparent score breakdown for property detail pages */
export function PropertyScoreCard({ propertyId }: { propertyId: string }) {
  const { result, dataBacked, estimated, loading } = usePropertyDesirability(propertyId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            HomeU Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              HomeU Score
            </CardTitle>
            <CardDescription>
              How this property stacks up on price, stability, location, and value
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{Math.round(result.score)}</div>
            <Badge className={`${gradeStyles[result.grade] ?? gradeStyles.Fair} border`}>
              {result.grade === "VeryPoor" ? "Very Poor" : result.grade}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.summary && <p className="text-sm text-gray-600">{result.summary}</p>}

        <div className="space-y-3">
          {result.factors.map((factor) => (
            <div key={factor.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {factor.name}
                  <span className="text-xs text-gray-400 ml-2">
                    {Math.round(factor.weight * 100)}% of score
                  </span>
                </span>
                <span className="font-semibold">{Math.round(factor.value)}</span>
              </div>
              <Progress value={factor.value} className="h-2" />
              {factor.description && (
                <p className="text-xs text-gray-500">{factor.description}</p>
              )}
            </div>
          ))}
        </div>

        {result.recommendation && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
            {result.recommendation}
          </div>
        )}

        {estimated.length > 0 && (
          <p className="text-xs text-gray-400 flex items-start gap-1">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              Based on {dataBacked.length > 0 ? `verified data (${dataBacked.join(", ")})` : "limited data"}
              {"; "}estimated: {estimated.join(", ")}. The score sharpens as more market
              data is reported for this property.
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
