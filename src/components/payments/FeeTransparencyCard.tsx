"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Gift,
  Shield,
  Clock,
  TrendingUp,
  DollarSign,
  HelpCircle
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Benefit {
  icon: string;
  title: string;
  description: string;
}

interface FeeTransparencyCardProps {
  feeAmount?: number;
  compact?: boolean;
}

export function FeeTransparencyCard({
  feeAmount = 9.99,
  compact = false
}: FeeTransparencyCardProps) {
  const transparencyInfo = useQuery(api.homeuFees.getFeeTransparencyInfo, {});

  if (!transparencyInfo) {
    return null;
  }

  const { breakdown, benefits, valueProposition } = transparencyInfo;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-green-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-green-800">
            $9.99/mo = Credit reporting + 200 points!
          </p>
          <p className="text-xs text-green-600">
            Build credit with every rent payment
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-4 w-4 text-green-600" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{valueProposition}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Fee Transparency
          </CardTitle>
          <Badge className="bg-green-100 text-green-800">
            ${feeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fee Split Visual */}
        <div className="space-y-2">
          <div className="h-6 rounded-full overflow-hidden flex">
            <div
              className="bg-green-600 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${breakdown.operationsFee.percentage}%` }}
            >
              ${breakdown.operationsFee.amount}
            </div>
            <div
              className="bg-emerald-400 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${breakdown.rewardsFunding.percentage}%` }}
            >
              ${breakdown.rewardsFunding.amount}
            </div>
            <div
              className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${breakdown.creditReporting.percentage}%` }}
            >
              ${breakdown.creditReporting.amount}
            </div>
          </div>

          <div className="flex justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-600" />
              <span>Platform ({breakdown.operationsFee.percentage}%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Rewards ({breakdown.rewardsFunding.percentage}%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Credit ({breakdown.creditReporting.percentage}%)</span>
            </div>
          </div>
        </div>

        {/* Key Values */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-white rounded-lg border border-blue-200 text-center">
            <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-1" />
            <p className="font-semibold text-blue-800 text-sm">Credit Reporting</p>
            <p className="text-xs text-blue-600">All 3 bureaus</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-green-200 text-center">
            <Gift className="h-6 w-6 text-green-600 mx-auto mb-1" />
            <p className="font-semibold text-green-800 text-sm">
              {breakdown.rewardsFunding.pointsValue} Points
            </p>
            <p className="text-xs text-green-600">Every payment</p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-2 gap-2">
          {benefits.map((benefit: Benefit, index: number) => {
            const iconMap: Record<string, typeof Gift> = {
              Gift,
              Shield,
              Clock,
              TrendingUp
            };
            const IconComponent = iconMap[benefit.icon] || Gift;

            return (
              <div
                key={index}
                className="flex items-start gap-2 p-2 bg-white rounded-lg border"
              >
                <IconComponent className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{benefit.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
