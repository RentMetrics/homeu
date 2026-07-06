"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Gift,
  Shield,
  Clock,
  TrendingUp,
  DollarSign,
  Sparkles
} from "lucide-react";

interface HomeUFeeExplainerProps {
  feeAmount?: number;
  pointsAwarded?: number;
  showBenefits?: boolean;
}

export function HomeUFeeExplainer({
  feeAmount = 5.00,
  pointsAwarded = 100,
  showBenefits = true
}: HomeUFeeExplainerProps) {
  const operationsFee = 4.00;
  const pointsConversion = 1.00;
  const operationsPercentage = (operationsFee / feeAmount) * 100;
  const pointsPercentage = (pointsConversion / feeAmount) * 100;

  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-2 bg-green-100 rounded-full">
          <Sparkles className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-green-800">Where Your Fee Goes</h3>
          <p className="text-sm text-green-600">Transparency you can trust</p>
        </div>
      </div>

      {/* Fee Breakdown Visual */}
      <div className="space-y-3">
        {/* Visual bar */}
        <div className="h-8 rounded-full overflow-hidden flex">
          <div
            className="bg-green-600 flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${operationsPercentage}%` }}
          >
            ${operationsFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div
            className="bg-emerald-400 flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${pointsPercentage}%` }}
          >
            ${pointsConversion.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600" />
            <div>
              <span className="font-medium">Platform & Processing</span>
              <p className="text-xs text-muted-foreground">${operationsFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (80%)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <div>
              <span className="font-medium">Your Reward Points</span>
              <p className="text-xs text-muted-foreground">${pointsConversion.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} = {pointsAwarded} pts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Value Proposition */}
      <div className="p-3 bg-white rounded-lg border border-green-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-full">
            <Gift className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-green-800">You get back {pointsAwarded} points!</p>
            <p className="text-sm text-green-600">
              That's ${(pointsAwarded / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in rewards value
            </p>
          </div>
        </div>
      </div>

      {/* Benefits */}
      {showBenefits && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
            <Gift className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium">Reward Points</p>
              <p className="text-muted-foreground">$1 back as 100 pts</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
            <Shield className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium">Secure Payments</p>
              <p className="text-muted-foreground">Bank-level encryption</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
            <Clock className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium">Streak Tracking</p>
              <p className="text-muted-foreground">Earn bonus points</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
            <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium">Credit Building</p>
              <p className="text-muted-foreground">Report to bureaus</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom note */}
      <p className="text-xs text-center text-green-600">
        Your fee helps us provide a better renting experience while rewarding you for being a great tenant.
      </p>
    </div>
  );
}

// Compact version for inline display
export function HomeUFeeExplainerCompact() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full text-sm">
      <Gift className="h-4 w-4 text-green-600" />
      <span className="text-green-800">
        $5 fee = <strong>100 points back</strong>
      </span>
    </div>
  );
}
