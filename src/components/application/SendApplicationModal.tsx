"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare, Wallet, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type SendMethod = "email" | "text" | "wallet" | null;

interface SendApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  applicationId?: string;
}

export function SendApplicationModal({
  isOpen,
  onClose,
  onSave,
  applicationId,
}: SendApplicationModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<SendMethod>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // Form fields per method
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  const handleReset = () => {
    setSelectedMethod(null);
    setIsSent(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSend = async () => {
    // Validate
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

      // Then handle the send method
      if (selectedMethod === "email") {
        // For now, open the user's email client with a pre-filled email
        const subject = encodeURIComponent("HomeU Lease Application");
        const body = encodeURIComponent(
          `Hi,\n\nI've submitted my lease application through HomeU. Please review at your convenience.\n\nApplication Reference: ${applicationId || "Pending"}\n\nThank you!`
        );
        window.open(`mailto:${recipientEmail}?subject=${subject}&body=${body}`, "_blank");
        toast.success("Application saved! Email client opened.");
      } else if (selectedMethod === "text") {
        // Open SMS with pre-filled message
        const message = encodeURIComponent(
          `Hi, I've submitted my lease application through HomeU. Application Ref: ${applicationId || "Pending"}. Please review at your convenience.`
        );
        window.open(`sms:${recipientPhone}?body=${message}`, "_blank");
        toast.success("Application saved! SMS opened.");
      } else if (selectedMethod === "wallet") {
        // For wallet sharing, we'd upload to IPFS and share the hash
        // For now, copy a share link to clipboard
        const shareText = `HomeU Application - Ref: ${applicationId || "Pending"} | Wallet: ${walletAddress}`;
        await navigator.clipboard.writeText(shareText);
        toast.success("Application saved! Share details copied to clipboard.");
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
      id: "email" as const,
      label: "Email",
      description: "Send via email to your property manager",
      icon: Mail,
      color: "text-blue-600",
      bg: "bg-blue-50 hover:bg-blue-100 border-blue-200",
      activeBg: "bg-blue-100 border-blue-500 ring-2 ring-blue-200",
    },
    {
      id: "text" as const,
      label: "Text Message",
      description: "Send via SMS to your property manager",
      icon: MessageSquare,
      color: "text-green-600",
      bg: "bg-green-50 hover:bg-green-100 border-green-200",
      activeBg: "bg-green-100 border-green-500 ring-2 ring-green-200",
    },
    {
      id: "wallet" as const,
      label: "Share via Wallet",
      description: "Share securely using IPFS & blockchain wallet",
      icon: Wallet,
      color: "text-purple-600",
      bg: "bg-purple-50 hover:bg-purple-100 border-purple-200",
      activeBg: "bg-purple-100 border-purple-500 ring-2 ring-purple-200",
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
            <p className="text-gray-600 mb-6">
              Your application has been saved and shared via{" "}
              {selectedMethod === "email"
                ? "email"
                : selectedMethod === "text"
                ? "text message"
                : "wallet"}
              .
            </p>
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
                    <div className="font-medium">{method.label}</div>
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
              disabled={isSending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  {selectedMethod === "email" && (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  {selectedMethod === "text" && (
                    <MessageSquare className="mr-2 h-4 w-4" />
                  )}
                  {selectedMethod === "wallet" && (
                    <Wallet className="mr-2 h-4 w-4" />
                  )}
                  Send Application
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
