"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  RefreshCw,
  Target,
  MessageSquare,
  Clock,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Search,
} from "lucide-react";
import { calculateRenewalStrategy } from "@/lib/wasm/resident-scores";
import type { RenewalStrategyInput, RenewalStrategyResult } from "@/lib/wasm/types";

function getActionColor(action: string) {
  switch (action) {
    case "negotiate":
      return "bg-green-100 text-green-800 border-green-300";
    case "renew":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "explore":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    default:
      return "bg-muted text-foreground";
  }
}

function getActionIcon(action: string) {
  switch (action) {
    case "negotiate":
      return <ArrowDownRight className="h-5 w-5" />;
    case "renew":
      return <RefreshCw className="h-5 w-5" />;
    case "explore":
      return <Search className="h-5 w-5" />;
    default:
      return <Target className="h-5 w-5" />;
  }
}

function getActionLabel(action: string) {
  switch (action) {
    case "negotiate":
      return "Negotiate Reduction";
    case "renew":
      return "Renew as-is";
    case "explore":
      return "Explore Alternatives";
    default:
      return action;
  }
}

interface RenewalStrategyPanelProps {
  currentRent: number;
  marketRent: number;
  occupancyRate: number;
  tenureTenureMonths: number;
  onTimePaymentRate: number;
  rentTrend3mo: number;
  concessionValue: number;
  leaseEndMonth: number;
}

export function RenewalStrategyPanel({
  currentRent,
  marketRent,
  occupancyRate,
  tenureTenureMonths,
  onTimePaymentRate,
  rentTrend3mo,
  concessionValue,
  leaseEndMonth,
}: RenewalStrategyPanelProps) {
  const [result, setResult] = useState<RenewalStrategyResult | null>(null);

  useEffect(() => {
    if (currentRent <= 0) return;

    const currentMonth = new Date().getMonth() + 1;

    const input: RenewalStrategyInput = {
      current_rent: currentRent,
      market_rent: marketRent,
      occupancy_rate: occupancyRate,
      tenant_tenure_months: tenureTenureMonths,
      on_time_payment_rate: onTimePaymentRate,
      current_month: currentMonth,
      rent_trend_3mo: rentTrend3mo,
      concession_value: concessionValue,
      lease_end_month: leaseEndMonth,
    };

    calculateRenewalStrategy(input).then(setResult);
  }, [currentRent, marketRent, occupancyRate, tenureTenureMonths, onTimePaymentRate, rentTrend3mo, concessionValue, leaseEndMonth]);

  if (!result) return null;

  return (
    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 text-indigo-600" />
          Lease Renewal Strategy
        </CardTitle>
        <CardDescription>
          AI-powered strategy based on your lease, market data, and tenant profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Action + Target Rent */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 bg-card rounded-lg border-2 border-indigo-300">
            <div className="text-sm text-muted-foreground mb-1">Recommended Action</div>
            <div className="flex items-center gap-2">
              {getActionIcon(result.recommended_action)}
              <Badge className={`${getActionColor(result.recommended_action)} border text-base py-1 px-3`}>
                {getActionLabel(result.recommended_action)}
              </Badge>
            </div>
          </div>

          <div className="p-4 bg-card rounded-lg border">
            <div className="text-sm text-muted-foreground mb-1">Target Rent</div>
            <div className="text-2xl font-bold text-green-600">
              ${result.target_rent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mo
            </div>
            <div className="text-xs text-muted-foreground">
              {result.max_discount_pct > 0 && (
                <span className="flex items-center gap-1">
                  <ArrowDownRight className="h-3 w-3 text-green-600" />
                  Up to {result.max_discount_pct}% discount achievable
                </span>
              )}
            </div>
          </div>

          <div className="p-4 bg-card rounded-lg border">
            <div className="text-sm text-muted-foreground mb-1">Leverage Score</div>
            <div className="text-2xl font-bold">{Math.round(result.leverage_score)}/100</div>
            <div className="text-xs text-muted-foreground">
              {result.leverage_score >= 60 ? "Strong position" : result.leverage_score >= 40 ? "Moderate position" : "Limited leverage"}
            </div>
          </div>
        </div>

        {/* Timing Advice */}
        <div className="flex items-start gap-3 p-4 bg-card rounded-lg border">
          <Clock className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold text-sm mb-1">Timing</div>
            <div className="text-sm text-muted-foreground">{result.timing_advice}</div>
          </div>
        </div>

        {/* Talking Points */}
        {result.talking_points.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold">Your Talking Points</h3>
            </div>
            <div className="space-y-2">
              {result.talking_points.map((point, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-card rounded-lg border">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold">
                    {i + 1}
                  </div>
                  <span className="text-sm">{point}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Negotiation Scripts */}
        {result.scripts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold">Negotiation Scripts</h3>
            </div>
            <div className="space-y-3">
              {result.scripts.map((script, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="text-xs font-semibold text-indigo-600 mb-2 uppercase tracking-wide">
                      {script.scenario}
                    </div>
                    <p className="text-sm italic text-muted-foreground">&ldquo;{script.script}&rdquo;</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            This strategy is AI-generated based on market data and your profile. Results may vary.
            Always consider your personal circumstances when making lease decisions.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
