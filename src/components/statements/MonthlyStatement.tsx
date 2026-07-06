"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays,
  DollarSign,
  FileText,
  Gift,
  Info,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { HomeUFeeExplainer } from "./HomeUFeeExplainer";
import { format } from "date-fns";

// Format currency with thousand separators
const formatCurrency = (amount: number) =>
  amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface LineItem {
  type: string;
  description: string;
  amount: number;
}

interface MonthlyStatementProps {
  userId: string;
  onPayNow?: (statementId: string) => void;
}

export function MonthlyStatement({ userId, onPayNow }: MonthlyStatementProps) {
  const [showFeeDetails, setShowFeeDetails] = useState(false);

  const statementData = useQuery(api.statements.getCurrentStatement, {
    renterId: userId
  });

  // Sample statement for demo when no real statement exists
  const sampleStatement = {
    _id: 'sample',
    month: format(new Date(), "MMMM yyyy"),
    statementNumber: `STMT-${format(new Date(), "yyyyMM")}-001`,
    status: 'sent',
    lineItems: [
      { type: 'base_rent', description: 'Monthly Rent', amount: 1750.00 },
      { type: 'utilities', description: 'Utilities', amount: 150.00 },
      { type: 'parking', description: 'Parking', amount: 100.00 },
    ],
    subtotal: 2000.00,
    homeuConvenienceFee: 5.00,
    totalDue: 2005.00,
    amountPaid: 0,
    dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getTime(),
    feeExplainer: { pointsYouEarn: 100 }
  };

  const statement = statementData || sampleStatement;
  const isDemo = !statementData;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Paid</Badge>;
      case "sent":
      case "viewed":
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Due</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>;
      case "partial":
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isOverdue = statement.status === "overdue";
  const isPaid = statement.status === "paid";
  const remainingBalance = statement.totalDue - (statement.amountPaid ?? 0);

  return (
    <Card className={isOverdue ? "border-red-200" : ""}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Monthly Statement
              {isDemo && (
                <Badge variant="outline" className="ml-2 text-xs">Sample</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {statement.month} - {statement.statementNumber}
            </CardDescription>
          </div>
          {getStatusBadge(statement.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Line Items */}
        <div className="space-y-3">
          {statement.lineItems
            .filter((item: LineItem) => item.type !== "homeu_fee")
            .map((item: LineItem, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{item.description}</span>
                  {item.type === "late_fee" && (
                    <Badge variant="destructive" className="ml-2 text-xs">Late</Badge>
                  )}
                </div>
                <span>${formatCurrency(item.amount)}</span>
              </div>
            ))}

          <Separator />

          {/* Subtotal */}
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>${formatCurrency(statement.subtotal)}</span>
          </div>

          {/* HomeU Fee - Standard line item */}
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Processing Fee</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setShowFeeDetails(!showFeeDetails)}
              >
                <Info className="h-3 w-3" />
              </Button>
            </div>
            <span>${formatCurrency(statement.homeuConvenienceFee ?? 0)}</span>
          </div>

          {/* Fee Explainer - only shows when clicked */}
          {showFeeDetails && (
            <HomeUFeeExplainer
              feeAmount={statement.homeuConvenienceFee ?? 0}
              pointsAwarded={statement.feeExplainer?.pointsYouEarn || 100}
            />
          )}

          <Separator />

          {/* Total */}
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total Due</span>
            <span>${formatCurrency(statement.totalDue)}</span>
          </div>

          {/* Remaining balance if partial payment */}
          {(statement.amountPaid ?? 0) > 0 && statement.status !== "paid" && (
            <>
              <div className="flex justify-between items-center text-sm text-green-600">
                <span>Amount Paid</span>
                <span>-${formatCurrency(statement.amountPaid ?? 0)}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold text-orange-600">
                <span>Remaining Balance</span>
                <span>${formatCurrency(remainingBalance)}</span>
              </div>
            </>
          )}
        </div>

        {/* Due Date */}
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <CalendarDays className={`h-5 w-5 ${isOverdue ? "text-red-600" : "text-muted-foreground"}`} />
          <div>
            <p className="text-sm text-muted-foreground">Payment Due</p>
            <p className={`font-semibold ${isOverdue ? "text-red-600" : ""}`}>
              {format(new Date(statement.dueDate), "MMMM d, yyyy")}
            </p>
          </div>
        </div>

        {/* Points Preview */}
        {!isPaid && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800">Points You'll Earn</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Fee Conversion</span>
                <span className="font-medium text-green-800">+100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">On-Time Bonus</span>
                <span className="font-medium text-green-800">+100</span>
              </div>
            </div>
            <Separator className="my-2 bg-green-200" />
            <div className="flex justify-between font-semibold text-green-800">
              <span>Total Points</span>
              <span>+200 minimum</span>
            </div>
          </div>
        )}
      </CardContent>

      {!isPaid && onPayNow && !isDemo && (
        <CardFooter>
          <Button
            className="w-full"
            size="lg"
            onClick={() => onPayNow(statement._id)}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Pay Now - ${formatCurrency(remainingBalance)}
          </Button>
        </CardFooter>
      )}

      {isDemo && (
        <CardFooter className="bg-muted/50">
          <p className="text-sm text-muted-foreground text-center w-full">
            This is a sample statement. Your actual statement will appear once your property manager generates it.
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
