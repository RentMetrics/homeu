"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Target,
  Shield,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { calculateDealScore, calculateLeverageScore } from "@/lib/wasm/resident-scores";
import type { DealScoreResult, LeverageScoreResult } from "@/lib/wasm/types";

function getScoreColor(score: number) {
  if (score >= 80) return "bg-green-100 text-green-800 border-green-300";
  if (score >= 65) return "bg-blue-100 text-blue-800 border-blue-300";
  if (score >= 50) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-red-100 text-red-800 border-red-300";
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Excellent Deal";
  if (score >= 65) return "Good Deal";
  if (score >= 50) return "Fair Deal";
  return "Below Average";
}

function getBarColor(value: number) {
  if (value >= 70) return "bg-green-500";
  if (value >= 50) return "bg-blue-500";
  if (value >= 30) return "bg-yellow-500";
  return "bg-red-500";
}

export function MarketAnalysisPanel({ propertyId }: { propertyId: string }) {
  const [dealResult, setDealResult] = useState<DealScoreResult | null>(null);
  const [leverageResult, setLeverageResult] = useState<LeverageScoreResult | null>(null);
  const [loading, setLoading] = useState(true);

  const data = useQuery(api.multifamilyproperties.getPropertyWithMarketContext, {
    propertyId,
  });

  useEffect(() => {
    if (!data?.property) return;

    const property = data.property;
    const rent = data.propertyRent;
    const occ = data.propertyOccupancy;
    const con = data.propertyConcession;
    const market = data.marketStats;
    const currentMonth = new Date().getMonth() + 1;
    const currentRent = rent?.averageRent ?? 0;
    const marketRent = market?.avgRent ?? currentRent;
    const buildingAge = new Date().getFullYear() - property.yearBuilt;

    const dealPromise = calculateDealScore({
      current_rent: currentRent,
      market_rent: marketRent,
      avg_rent_per_sqft: market?.avgRentPerSqFt ?? rent?.rentPerSqFt ?? 0,
      unit_sqft: property.averageUnitSize || 0,
      occupancy_rate: occ?.occupancyRate ?? 0,
      market_occupancy: market?.avgOccupancy ?? 0,
      concession_value: con?.concessionAmount ?? 0,
      market_concession_value: market?.avgConcessionValue ?? 0,
      rent_trend_3mo: market?.rentTrend3mo ?? 0,
      rent_trend_12mo: market?.rentTrend12mo ?? 0,
      google_rating: property.googleRating ?? undefined,
      building_year: property.yearBuilt,
      amenity_count: property.amenities?.length ?? 0,
    });

    const rentVsMarket = marketRent > 0 ? currentRent / marketRent : 1;

    const leveragePromise = calculateLeverageScore({
      occupancy_rate: occ?.occupancyRate ?? 0,
      market_occupancy: market?.avgOccupancy ?? 0,
      current_month: currentMonth,
      rent_vs_market_pct: rentVsMarket,
      concession_prevalence: market?.concessionPrevalence ?? 0,
      building_age: buildingAge,
      google_rating: property.googleRating ?? undefined,
      property_units: property.totalUnits,
    });

    Promise.all([dealPromise, leveragePromise]).then(([deal, leverage]) => {
      setDealResult(deal);
      setLeverageResult(leverage);
      setLoading(false);
    });
  }, [data]);

  if (data === undefined || loading) {
    return (
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dealResult || !leverageResult) return null;

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-600" />
          Market Intelligence Analysis
        </CardTitle>
        <CardDescription>
          WASM-powered scoring comparing this property against {data?.marketStats?.propertyCount ?? "market"} properties in the area
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Cards Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Deal Score */}
          <div className="p-4 bg-card rounded-lg border-2 border-purple-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-sm text-muted-foreground">Deal Score</div>
                  <div className="text-3xl font-bold text-purple-600">{Math.round(dealResult.score)}/100</div>
                </div>
              </div>
              <Badge className={getScoreColor(dealResult.score)} variant="outline">
                {getScoreLabel(dealResult.score)}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{dealResult.summary}</p>
          </div>

          {/* Leverage Score */}
          <div className="p-4 bg-card rounded-lg border-2 border-blue-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-sm text-muted-foreground">Negotiation Leverage</div>
                  <div className="text-3xl font-bold text-blue-600">{Math.round(leverageResult.score)}/100</div>
                </div>
              </div>
              <Badge className={getScoreColor(leverageResult.score)} variant="outline">
                {leverageResult.score >= 70 ? "Strong" : leverageResult.score >= 50 ? "Moderate" : "Limited"}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{leverageResult.best_timing}</p>
          </div>
        </div>

        {/* Factor Breakdowns */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Deal Score Factors */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Deal Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dealResult.factors.map((factor, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{factor.name}</span>
                    <span className="font-medium">{Math.round(factor.value)}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getBarColor(factor.value)}`}
                      style={{ width: `${Math.min(factor.value, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{factor.description}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Leverage Score Factors */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Leverage Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leverageResult.factors.map((factor, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{factor.name}</span>
                    <span className="font-medium">{Math.round(factor.value)}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getBarColor(factor.value)}`}
                      style={{ width: `${Math.min(factor.value, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{factor.description}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Negotiation Tips */}
        {leverageResult.negotiation_tips.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Negotiation Tactics</h3>
            </div>
            <div className="space-y-2">
              {leverageResult.negotiation_tips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-card rounded-lg border">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <span className="text-sm">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendation */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            <h3 className="font-semibold">Recommendation</h3>
          </div>
          <Alert>
            <AlertDescription className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{dealResult.recommendation}</span>
            </AlertDescription>
          </Alert>
        </div>

        {/* Market Context */}
        {data?.marketStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-card rounded-lg border">
              <div className="text-lg font-bold">${Math.round(data.marketStats.avgRent).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Market Avg Rent</div>
            </div>
            <div className="p-3 bg-card rounded-lg border">
              <div className="text-lg font-bold">{data.marketStats.avgOccupancy.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Market Occupancy</div>
            </div>
            <div className="p-3 bg-card rounded-lg border">
              <div className="text-lg font-bold flex items-center justify-center gap-1">
                {data.marketStats.rentTrend3mo >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                )}
                {data.marketStats.rentTrend3mo > 0 ? "+" : ""}{data.marketStats.rentTrend3mo.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">3-Mo Trend</div>
            </div>
            <div className="p-3 bg-card rounded-lg border">
              <div className="text-lg font-bold">{data.marketStats.propertyCount}</div>
              <div className="text-xs text-muted-foreground">Properties Tracked</div>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Market Intelligence scores are generated by HomeU&apos;s proprietary WASM scoring engine using aggregated market data.
            Scores should be used as guidance — actual outcomes depend on specific circumstances and market conditions.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
