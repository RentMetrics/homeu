"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, CheckCircle, RefreshCw, Loader2, Gift, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ArgyleLinkProps {
  onConnected?: () => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    Argyle?: {
      create: (config: any) => any;
    };
  }
}

export function ArgyleLink({ onConnected, onError }: ArgyleLinkProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [sdkLoadError, setSdkLoadError] = useState(false);
  const [argyleInstance, setArgyleInstance] = useState<any>(null);

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
        console.error("Failed to load Argyle SDK - this may be due to network issues or browser extensions blocking the script");
        setSdkLoadError(true);
        // Don't show toast on initial load to avoid annoying users who don't need this feature
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

  const initializeArgyle = useCallback(async () => {
    if (!window.Argyle) {
      toast.error("Employment verification service not available");
      return;
    }

    setIsLoading(true);

    try {
      // Get user token from API
      const response = await fetch("/api/argyle/user", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to initialize connection");
      }

      const { userToken, pluginKey } = await response.json();

      if (!userToken || !pluginKey) {
        throw new Error("Missing Argyle credentials");
      }

      // Create Argyle Link instance
      // Note: pluginKey replaced deprecated linkKey in Argyle SDK v4
      const argyle = window.Argyle.create({
        pluginKey,
        userToken,
        sandbox: process.env.NODE_ENV !== "production",
        onAccountConnected: async ({ accountId, userId, linkItemId }: any) => {
          console.log("Account connected:", accountId);
          toast.success("Payroll account connected!");

          // Fetch employment data
          try {
            const empResponse = await fetch("/api/argyle/employment");
            if (empResponse.ok) {
              const data = await empResponse.json();
              if (data.pointsAwarded > 0) {
                toast.success(`+${data.pointsAwarded} points earned for employment verification!`);
              }
              onConnected?.();
            }
          } catch (error) {
            console.error("Error fetching employment:", error);
          }
        },
        onAccountRemoved: ({ accountId, userId }: any) => {
          console.log("Account removed:", accountId);
          toast.info("Payroll account disconnected");
        },
        onAccountError: ({ accountId, userId, linkItemId }: any) => {
          console.error("Account error:", accountId);
          toast.error("Error connecting payroll account");
          onError?.("Account connection error");
        },
        onClose: () => {
          setIsLoading(false);
        },
        onTokenExpired: async (updateToken: (token: string) => void) => {
          try {
            const refreshResponse = await fetch("/api/argyle/user", {
              method: "POST",
            });
            if (refreshResponse.ok) {
              const { userToken: newToken } = await refreshResponse.json();
              updateToken(newToken);
            }
          } catch (error) {
            console.error("Error refreshing token:", error);
          }
        },
      });

      setArgyleInstance(argyle);
      argyle.open();

    } catch (error) {
      console.error("Argyle initialization error:", error);
      toast.error("Failed to start employment verification");
      onError?.(error instanceof Error ? error.message : "Unknown error");
      setIsLoading(false);
    }
  }, [onConnected, onError]);

  return (
    <Card className="border-green-500/30 bg-gradient-to-br from-green-950/50 to-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Briefcase className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Verify Employment</CardTitle>
              <CardDescription>
                Connect your payroll account to verify your employment
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            <Gift className="h-3 w-3 mr-1" />
            +100 points
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Securely connect your payroll account</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Automatically verify employment history</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Streamline your rental application</span>
            </div>
          </div>

          {sdkLoadError ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm">
                  Unable to load employment verification. This may be due to browser extensions or network settings.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : (
            <Button
              onClick={initializeArgyle}
              disabled={isLoading || !isSdkLoaded}
              className="w-full bg-green-600 hover:bg-green-700"
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
                  <Briefcase className="mr-2 h-4 w-4" />
                  Connect Payroll Account
                </>
              )}
            </Button>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Powered by Argyle. Your credentials are encrypted and never stored.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface ArgyleLinkConnectedProps {
  employerName?: string;
  position?: string;
  verificationDate?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function ArgyleLinkConnected({
  employerName,
  position,
  verificationDate,
  onRefresh,
  isRefreshing = false,
}: ArgyleLinkConnectedProps) {
  return (
    <Card className="border-green-500/30 bg-gradient-to-br from-green-950/50 to-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Employment Verified</CardTitle>
              <CardDescription>
                Your employment has been verified through Argyle
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-green-600 text-white">
            Verified
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {employerName && (
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Employer</span>
              <span className="font-medium">{employerName}</span>
            </div>
          )}
          {position && (
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Position</span>
              <span className="font-medium">{position}</span>
            </div>
          )}
          {verificationDate && (
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Verified On</span>
              <span className="font-medium">
                {new Date(verificationDate).toLocaleDateString()}
              </span>
            </div>
          )}

          {onRefresh && (
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="w-full"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Employment Data
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
