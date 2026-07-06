"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Gift,
  Flame,
  Clock,
  Repeat,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface PaymentConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  paymentDetails: {
    totalAmount: number;
    rentAmount: number;
    homeuFee: number;
    pointsBreakdown: {
      feeConversion: number;
      onTimeBonus: number;
      earlyBonus: number;
      autoPayBonus: number;
      total: number;
    };
    statementMonth?: string;
    currentStreak?: number;
  };
}

export function PaymentConfirmation({
  isOpen,
  onClose,
  paymentDetails
}: PaymentConfirmationProps) {
  const [animatedPoints, setAnimatedPoints] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7']
      });

      // Animate points counter
      const targetPoints = paymentDetails.pointsBreakdown.total;
      const duration = 1500;
      const stepTime = 30;
      const steps = duration / stepTime;
      const increment = targetPoints / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= targetPoints) {
          setAnimatedPoints(targetPoints);
          clearInterval(timer);
        } else {
          setAnimatedPoints(Math.floor(current));
        }
      }, stepTime);

      return () => clearInterval(timer);
    } else {
      setAnimatedPoints(0);
    }
  }, [isOpen, paymentDetails.pointsBreakdown.total]);

  const { pointsBreakdown, currentStreak } = paymentDetails;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center space-y-6 py-4">
          {/* Success Animation */}
          <div className="relative flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 animate-pulse" />
            </div>
            <div className="absolute -top-2 -right-2">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                <Gift className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>

          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-green-700">
              Payment Successful!
            </DialogTitle>
            <DialogDescription>
              Your rent payment has been processed
            </DialogDescription>
          </DialogHeader>

          {/* Payment Amount */}
          <div className="text-3xl font-bold">
            ${paymentDetails.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          {/* Points Earned Section */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-green-600 animate-pulse" />
              <span className="font-semibold text-green-800">Points Earned</span>
            </div>

            {/* Animated total points */}
            <div className="text-5xl font-bold text-green-600 mb-4">
              +{animatedPoints}
            </div>

            {/* Points Breakdown */}
            <div className="space-y-2 text-sm">
              {pointsBreakdown.feeConversion > 0 && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-green-600" />
                    <span>Fee Conversion</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    +{pointsBreakdown.feeConversion}
                  </Badge>
                </div>
              )}

              {pointsBreakdown.onTimeBonus > 0 && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span>On-Time Bonus</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    +{pointsBreakdown.onTimeBonus}
                  </Badge>
                </div>
              )}

              {pointsBreakdown.earlyBonus > 0 && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span>Early Payment Bonus</span>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">
                    +{pointsBreakdown.earlyBonus}
                  </Badge>
                </div>
              )}

              {pointsBreakdown.autoPayBonus > 0 && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-indigo-600" />
                    <span>Auto-Pay Bonus</span>
                  </div>
                  <Badge className="bg-indigo-100 text-indigo-800">
                    +{pointsBreakdown.autoPayBonus}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Streak Info */}
          {currentStreak && currentStreak > 0 && (
            <div className="flex items-center justify-center gap-2 p-3 bg-orange-50 rounded-lg">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="font-medium text-orange-700">
                {currentStreak} Month{currentStreak > 1 ? 's' : ''} Payment Streak!
              </span>
            </div>
          )}

          {/* Dollar Value */}
          <p className="text-sm text-muted-foreground">
            That's ${(pointsBreakdown.total / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in rewards value!
          </p>

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={onClose}
              size="lg"
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              Done
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // Navigate to rewards page
                window.location.href = "/dashboard/rewards";
              }}
            >
              View Rewards
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Simple inline confirmation for smaller UI
export function PaymentConfirmationInline({
  pointsEarned,
  onViewRewards
}: {
  pointsEarned: number;
  onViewRewards?: () => void;
}) {
  return (
    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-green-800">Payment Confirmed!</p>
          <p className="text-sm text-green-600">
            You earned <strong>+{pointsEarned} points</strong>
          </p>
        </div>
        {onViewRewards && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewRewards}
            className="text-green-700"
          >
            View <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
