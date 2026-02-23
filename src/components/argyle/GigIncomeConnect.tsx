"use client";

import { useState, useCallback, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, CheckCircle, Loader2, DollarSign, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    Argyle?: {
      create: (config: any) => any;
    };
  }
}

const GIG_PLATFORMS = [
  { name: "Uber", icon: "🚗" },
  { name: "Lyft", icon: "🚙" },
  { name: "UberEats", icon: "🍔" },
];

export function GigIncomeConnect() {
  const { user } = useUser();
  const argyleStatus = useQuery(
    api.argyle.getArgyleStatus,
    user?.id ? { userId: user.id } : "skip"
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [sdkLoadError, setSdkLoadError] = useState(false);

  // Load Argyle Link SDK
  useEffect(() => {
    if (typeof window !== "undefined" && !window.Argyle) {
      const script = document.createElement("script");
      script.src = "https://plugin.argyle.com/argyle.web.v4.js";
      script.async = true;
      script.onload = () => {
        setIsSdkLoaded(true);
        setSdkLoadError(false);
      };
      script.onerror = () => {
        setSdkLoadError(true);
      };
      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    } else if (window.Argyle) {
      setIsSdkLoaded(true);
    }
  }, []);

  const handleConnect = useCallback(async () => {
    if (!window.Argyle) {
      toast.error("Gig income service not available");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/argyle/user", { method: "POST" });
      if (!response.ok) throw new Error("Failed to initialize connection");

      const { userToken, pluginKey } = await response.json();
      if (!userToken || !pluginKey) throw new Error("Missing credentials");

      const argyle = window.Argyle.create({
        pluginKey,
        userToken,
        sandbox: process.env.NODE_ENV !== "production",
        items: ["uber", "lyft", "uber_eats"],
        onAccountConnected: async () => {
          toast.success("Gig account connected!");
          try {
            await fetch("/api/argyle/employment");
          } catch (error) {
            console.error("Error fetching employment:", error);
          }
        },
        onAccountError: () => {
          toast.error("Error connecting gig account");
        },
        onClose: () => {
          setIsLoading(false);
        },
        onTokenExpired: async (updateToken: (token: string) => void) => {
          try {
            const refreshResponse = await fetch("/api/argyle/user", { method: "POST" });
            if (refreshResponse.ok) {
              const { userToken: newToken } = await refreshResponse.json();
              updateToken(newToken);
            }
          } catch (error) {
            console.error("Error refreshing token:", error);
          }
        },
      });

      argyle.open();
    } catch (error) {
      console.error("Argyle initialization error:", error);
      toast.error("Failed to start gig income connection");
      setIsLoading(false);
    }
  }, []);

  const isConnected = argyleStatus?.hasArgyleConnection && argyleStatus?.employmentVerified;

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Car className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">Gig Income Verification</CardTitle>
              <CardDescription className="text-sm">
                Connect your gig platform accounts to verify income
              </CardDescription>
            </div>
          </div>
          {isConnected && (
            <Badge className="bg-green-600 text-white">Connected</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Supported platforms */}
          <div className="flex gap-3">
            {GIG_PLATFORMS.map((platform) => (
              <div
                key={platform.name}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border rounded-full text-sm"
              >
                <span>{platform.icon}</span>
                <span>{platform.name}</span>
              </div>
            ))}
          </div>

          {/* Connected status */}
          {isConnected && argyleStatus ? (
            <div className="space-y-2 p-3 bg-white rounded-lg border">
              {argyleStatus.verifiedEmployer && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Platform</span>
                  <span className="font-medium">{argyleStatus.verifiedEmployer}</span>
                </div>
              )}
              {argyleStatus.verifiedIncome != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Verified Income</span>
                  <span className="font-medium flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {argyleStatus.verifiedIncome.toLocaleString()}/
                    {argyleStatus.verifiedPayFrequency || "mo"}
                  </span>
                </div>
              )}
              {argyleStatus.employmentVerificationDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Verified</span>
                  <span className="font-medium flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    {new Date(argyleStatus.employmentVerificationDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          ) : sdkLoadError ? (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">Unable to load gig verification service.</p>
              <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={isLoading || !isSdkLoaded}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : !isSdkLoaded ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Car className="mr-2 h-4 w-4" />
                  Connect Gig Income
                </>
              )}
            </Button>
          )}

          <p className="text-xs text-gray-400 text-center">
            Powered by Argyle. Your credentials are encrypted and never stored.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
