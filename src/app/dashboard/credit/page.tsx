"use client";

import { TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CreditScorePage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Credit Score</h2>
        <p className="text-muted-foreground">
          Track and improve your credit score through rent reporting.
        </p>
      </div>

      {/* Credit Score Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Current Score</h3>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div className="mt-4">
            <div className="text-4xl font-bold">720</div>
            <p className="text-sm text-green-500 mt-1">+15 points this month</p>
          </div>
          <div className="mt-6">
            <div className="h-2 w-full bg-gray-100 rounded-full">
              <div className="h-2 w-[72%] bg-blue-600 rounded-full" />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>300</span>
              <span>850</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Rent Reporting Status</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Reporting Active</p>
                <p className="text-sm text-gray-500">Next report: March 1, 2024</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Last Payment Reported</p>
                <p className="text-sm text-gray-500">February 1, 2024</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Factors */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Credit Factors</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Payment History</span>
              <span className="text-sm text-green-500">Excellent</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full">
              <div className="h-2 w-[90%] bg-green-500 rounded-full" />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Credit Utilization</span>
              <span className="text-sm text-green-500">Good</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full">
              <div className="h-2 w-[75%] bg-blue-500 rounded-full" />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Credit History Length</span>
              <span className="text-sm text-yellow-500">Average</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full">
              <div className="h-2 w-[60%] bg-yellow-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Tips and Recommendations */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Tips to Improve Your Score</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium">Keep Rent Payments On Time</p>
              <p className="text-sm text-gray-500">
                Continue making rent payments on time to maintain a positive payment history.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium">Monitor Credit Utilization</p>
              <p className="text-sm text-gray-500">
                Keep your credit card balances below 30% of your available credit.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button>Download Credit Report</Button>
      </div>
    </div>
  );
} 