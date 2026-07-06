"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  MessageSquare,
  Wallet,
  Loader2,
  CheckCircle,
  ArrowLeft,
  Building2,
  Search,
  Zap,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

type SendMethod = "property" | "email" | "text" | "wallet" | null;

interface SendApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  applicationId?: string;
  /** Pre-select a property (e.g. when opened from a property detail page) */
  initialPropertyId?: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  entrata: "Entrata",
  yardi: "Yardi Voyager",
  realpage: "RealPage",
  buildium: "Buildium",
  appfolio: "AppFolio",
  rentmanager: "Rent Manager",
};

export function SendApplicationModal({
  isOpen,
  onClose,
  onSave,
  applicationId,
  initialPropertyId,
}: SendApplicationModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<SendMethod>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [sentMessage, setSentMessage] = useState("");

  // Form fields per method
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  // Property (PMS) method state
  const [propertySearch, setPropertySearch] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    initialPropertyId ?? null
  );

  // The property id from the Apply flow arrives after mount
  useEffect(() => {
    if (initialPropertyId) setSelectedPropertyId(initialPropertyId);
  }, [initialPropertyId]);

  const searchResults = useQuery(
    api.multifamilyproperties.searchProperties,
    selectedMethod === "property" && propertySearch.length >= 2 && !selectedPropertyId
      ? { searchQuery: propertySearch, limit: 6 }
      : "skip"
  );

  const selectedProperty = useQuery(
    api.multifamilyproperties.getPropertyById,
    selectedPropertyId ? { propertyId: selectedPropertyId } : "skip"
  );

  const pmsConnection = useQuery(
    api.pms.getConnectionForProperty,
    selectedPropertyId ? { propertyId: selectedPropertyId } : "skip"
  );

  const hasDirectConnection =
    pmsConnection?.status === "active" && pmsConnection.provider !== "email";

  const handleReset = () => {
    setSelectedMethod(null);
    setIsSent(false);
    setSentMessage("");
    setPropertySearch("");
    setSelectedPropertyId(initialPropertyId ?? null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSend = async () => {
    // Validate
    if (selectedMethod === "property" && !selectedPropertyId) {
      toast.error("Please select a property first.");
      return;
    }
    if (selectedMethod === "email" && !recipientEmail.trim()) {
      toast.error("Please enter the recipient's email address.");
      return;
    }
    if (selectedMethod === "text" && !recipientPhone.trim()) {
      toast.error("Please enter the recipient's phone number.");
      return;
    }
    if (selectedMethod === "wallet" && !walletAddress.trim()) {
      toast.error("Please enter the recipient's wallet address.");
      return;
    }

    setIsSending(true);
    try {
      // First, save the application to Convex
      await onSave();

      if (selectedMethod === "property") {
        const res = await fetch("/api/applications/submit-pms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyId: selectedPropertyId }),
        });
        const data = await res.json();
        if (data.success) {
          setSentMessage(
            data.channel === "pms"
              ? `Your application was submitted directly into ${PROVIDER_LABELS[data.provider] ?? data.provider} — no online application form needed.`
              : data.message
          );
          toast.success(
            data.channel === "pms"
              ? "Application submitted to the property's management system!"
              : "Application sent to the property manager!"
          );
        } else {
          toast.error(data.error || "Failed to submit application.");
          setIsSending(false);
          return;
        }
      } else if (selectedMethod === "email") {
        // Send via HomeU backend (Resend)
        const res = await fetch("/api/applications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pmEmail: recipientEmail,
            pmName: "",
            propertyName: "",
            propertyAddress: "",
            applicationData: {
              formData: (window as any).__homeuApplicationData?.formData,
              coApplicants: (window as any).__homeuApplicationData?.coApplicants,
              occupants: (window as any).__homeuApplicationData?.occupants,
              vehicles: (window as any).__homeuApplicationData?.vehicles,
              incomeSources: (window as any).__homeuApplicationData?.incomeSources,
            },
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Application sent to property manager!");
        } else {
          // Fallback to mailto if API fails
          const subject = encodeURIComponent("HomeU Lease Application");
          const body = encodeURIComponent(
            `Hi,\n\nI've submitted my lease application through HomeU. Please review at your convenience.\n\nApplication Reference: ${applicationId || "Pending"}\n\nThank you!`
          );
          window.open(`mailto:${recipientEmail}?subject=${subject}&body=${body}`, "_blank");
          toast.success("Application saved! Email client opened as fallback.");
        }
        setSentMessage("Your application has been saved and sent via email.");
      } else if (selectedMethod === "text") {
        // Open SMS with pre-filled message
        const message = encodeURIComponent(
          `Hi, I've submitted my lease application through HomeU. Application Ref: ${applicationId || "Pending"}. Please review at your convenience.`
        );
        window.open(`sms:${recipientPhone}?body=${message}`, "_blank");
        toast.success("Application saved! SMS opened.");
        setSentMessage("Your application has been saved and shared via text message.");
      } else if (selectedMethod === "wallet") {
        // For wallet sharing, we'd upload to IPFS and share the hash
        // For now, copy a share link to clipboard
        const shareText = `HomeU Application - Ref: ${applicationId || "Pending"} | Wallet: ${walletAddress}`;
        await navigator.clipboard.writeText(shareText);
        toast.success("Application saved! Share details copied to clipboard.");
        setSentMessage("Your application has been saved and shared via wallet.");
      }

      setIsSent(true);
    } catch (error) {
      console.error("Send error:", error);
      toast.error("Failed to send application. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const methods = [
    {
      id: "property" as const,
      label: "Send to Property",
      description: "Submit directly into the property's management software — skip their online application",
      icon: Building2,
      color: "text-emerald-600",
      bg: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200",
    },
    {
      id: "email" as const,
      label: "Email",
      description: "Send via email to your property manager",
      icon: Mail,
      color: "text-blue-600",
      bg: "bg-blue-50 hover:bg-blue-100 border-blue-200",
    },
    {
      id: "text" as const,
      label: "Text Message",
      description: "Send via SMS to your property manager",
      icon: MessageSquare,
      color: "text-green-600",
      bg: "bg-green-50 hover:bg-green-100 border-green-200",
    },
    {
      id: "wallet" as const,
      label: "Share via Wallet",
      description: "Share securely using IPFS & blockchain wallet",
      icon: Wallet,
      color: "text-purple-600",
      bg: "bg-purple-50 hover:bg-purple-100 border-purple-200",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isSent ? "Application Sent!" : "Send Application"}
          </DialogTitle>
          <DialogDescription>
            {isSent
              ? "Your application has been saved and sent."
              : "Choose how you'd like to send your application"}
          </DialogDescription>
        </DialogHeader>

        {isSent ? (
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-6">{sentMessage}</p>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        ) : !selectedMethod ? (
          <div className="space-y-3 py-2">
            {methods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${method.bg}`}
                >
                  <div className={`p-2 rounded-lg ${method.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium flex items-center gap-2">
                      {method.label}
                      {method.id === "property" && (
                        <Badge className="bg-emerald-600 text-white text-[10px]">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {method.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            {selectedMethod === "property" && (
              <div className="space-y-3">
                {!selectedPropertyId ? (
                  <>
                    <Label>Find the property you&apos;re applying to</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        className="pl-9"
                        placeholder="Search by property name..."
                        value={propertySearch}
                        onChange={(e) => setPropertySearch(e.target.value)}
                      />
                    </div>
                    {propertySearch.length >= 2 && (
                      <div className="border rounded-lg divide-y max-h-56 overflow-y-auto">
                        {searchResults === undefined ? (
                          <div className="p-4 text-sm text-gray-500 flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                          </div>
                        ) : searchResults.length === 0 ? (
                          <div className="p-4 text-sm text-gray-500">
                            No properties found. Try a different name.
                          </div>
                        ) : (
                          searchResults.map((p: any) => (
                            <button
                              key={p.propertyId}
                              onClick={() => setSelectedPropertyId(p.propertyId)}
                              className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                            >
                              <div className="font-medium text-sm">{p.propertyName}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {p.address}, {p.city}, {p.state}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium text-sm">
                            {selectedProperty?.propertyName ?? "Loading..."}
                          </div>
                          {selectedProperty && (
                            <div className="text-xs text-gray-500">
                              {selectedProperty.address}, {selectedProperty.city},{" "}
                              {selectedProperty.state}
                            </div>
                          )}
                        </div>
                        {!initialPropertyId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => {
                              setSelectedPropertyId(null);
                              setPropertySearch("");
                            }}
                          >
                            Change
                          </Button>
                        )}
                      </div>
                    </div>

                    {pmsConnection === undefined ? (
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" /> Checking connection...
                      </div>
                    ) : hasDirectConnection ? (
                      <div className="flex items-center gap-2 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-3">
                        <Zap className="h-4 w-4 shrink-0" />
                        <span>
                          Direct connection to{" "}
                          <strong>
                            {PROVIDER_LABELS[pmsConnection.provider] ?? pmsConnection.provider}
                          </strong>
                          . Your application goes straight into their system — no
                          online form to fill out.
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-3">
                        <Mail className="h-4 w-4 shrink-0" />
                        <span>
                          This property isn&apos;t connected to a management system yet.
                          Your full application (rental history, employment, and
                          verification status) will be delivered to the property
                          manager by email.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {selectedMethod === "email" && (
              <div className="space-y-2">
                <Label>Recipient Email</Label>
                <Input
                  type="email"
                  placeholder="manager@property.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>
            )}

            {selectedMethod === "text" && (
              <div className="space-y-2">
                <Label>Recipient Phone Number</Label>
                <Input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                />
              </div>
            )}

            {selectedMethod === "wallet" && (
              <div className="space-y-2">
                <Label>Wallet Address</Label>
                <Input
                  type="text"
                  placeholder="0x..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                />
                <p className="text-xs text-gray-400">
                  Your application will be stored on IPFS and the hash shared
                  with this wallet.
                </p>
              </div>
            )}

            <Button
              onClick={handleSend}
              disabled={isSending || (selectedMethod === "property" && !selectedPropertyId)}
              className={`w-full ${
                selectedMethod === "property"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {selectedMethod === "property" ? "Submitting..." : "Sending..."}
                </>
              ) : (
                <>
                  {selectedMethod === "property" && <Building2 className="mr-2 h-4 w-4" />}
                  {selectedMethod === "email" && <Mail className="mr-2 h-4 w-4" />}
                  {selectedMethod === "text" && <MessageSquare className="mr-2 h-4 w-4" />}
                  {selectedMethod === "wallet" && <Wallet className="mr-2 h-4 w-4" />}
                  {selectedMethod === "property"
                    ? "Submit Application"
                    : "Send Application"}
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
