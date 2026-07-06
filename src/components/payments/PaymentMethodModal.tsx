"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Wallet,
  CheckCircle2,
  ArrowRight,
  Shield,
  Zap,
  Clock,
  Gift
} from "lucide-react";

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBank: () => void;
  onSelectCrypto: () => void;
  amount: number;
  hasBankConnected?: boolean;
}

export function PaymentMethodModal({
  isOpen,
  onClose,
  onSelectBank,
  onSelectCrypto,
  amount,
  hasBankConnected = false,
}: PaymentMethodModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<"bank" | "crypto" | null>(null);

  const handleContinue = () => {
    if (selectedMethod === "bank") {
      onSelectBank();
    } else if (selectedMethod === "crypto") {
      onSelectCrypto();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Pay Rent</DialogTitle>
          <DialogDescription>
            Select your preferred payment method for ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Bank Account Option */}
          <Card
            className={`cursor-pointer transition-all ${
              selectedMethod === "bank"
                ? "border-2 border-blue-500 bg-blue-50/50"
                : "hover:border-blue-200 hover:bg-blue-50/30"
            }`}
            onClick={() => setSelectedMethod("bank")}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${selectedMethod === "bank" ? "bg-blue-100" : "bg-muted"}`}>
                  <Building2 className={`h-6 w-6 ${selectedMethod === "bank" ? "text-blue-600" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">Connected Bank Account</h3>
                    {hasBankConnected && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Pay securely via ACH transfer from your linked bank account
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Shield className="h-3 w-3 text-green-600" />
                      <span>Bank-level security</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 text-blue-600" />
                      <span>1-2 business days</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Gift className="h-3 w-3 text-purple-600" />
                      <span>+200 points</span>
                    </div>
                  </div>
                </div>
                {selectedMethod === "bank" && (
                  <CheckCircle2 className="h-6 w-6 text-blue-600 flex-shrink-0" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Crypto Option */}
          <Card
            className={`cursor-pointer transition-all ${
              selectedMethod === "crypto"
                ? "border-2 border-purple-500 bg-purple-50/50"
                : "hover:border-purple-200 hover:bg-purple-50/30"
            }`}
            onClick={() => setSelectedMethod("crypto")}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${selectedMethod === "crypto" ? "bg-purple-100" : "bg-muted"}`}>
                  <Wallet className={`h-6 w-6 ${selectedMethod === "crypto" ? "text-purple-600" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">Pay with Crypto</h3>
                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                      USDC / ETH
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Pay with stablecoins or ETH from your crypto wallet
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3 text-yellow-600" />
                      <span>Instant confirmation</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Shield className="h-3 w-3 text-green-600" />
                      <span>On-chain security</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Gift className="h-3 w-3 text-purple-600" />
                      <span>+200 points</span>
                    </div>
                  </div>
                </div>
                {selectedMethod === "crypto" && (
                  <CheckCircle2 className="h-6 w-6 text-purple-600 flex-shrink-0" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!selectedMethod}
            className={`flex-1 ${
              selectedMethod === "crypto"
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
