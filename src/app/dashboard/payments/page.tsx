"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CryptoPayment } from "@/components/payments/CryptoPayment";
import { DocumentSharing } from "@/components/documents/DocumentSharing";
import { CreditCard, Wallet, FileText, History } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUserSync } from "@/hooks/useUserSync";

const mockInvoice = {
  dueDate: "2024-06-01",
  baseRent: 1750.00,
  utilities: 150.00,
  parking: 100.00,
  lateFees: 0.00,
  totalDue: 2000.00,
};

const mockHistory = [
  { date: "2024-05-01", amount: 2000.00, status: "Paid", method: "Bank Transfer" },
  { date: "2024-04-01", amount: 2000.00, status: "Paid", method: "Credit Card" },
  { date: "2024-03-01", amount: 2000.00, status: "Paid", method: "Bank Transfer" },
];

export default function PaymentsPage() {
  const { user } = useUserSync();
  const [showHistory, setShowHistory] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [activeTab, setActiveTab] = useState("traditional");

  // Get user's crypto payments
  const cryptoPayments = useQuery(
    api.blockchain.getUserCryptoPayments,
    user?.id ? { userId: user.id } : "skip"
  );

  const handleTraditionalPay = () => {
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      alert("Payment successful!");
    }, 1500);
  };

  const handleCryptoPaymentSuccess = (paymentId: string) => {
    console.log("Crypto payment successful:", paymentId);
    // Refresh the page or update UI as needed
  };

  // Combine traditional and crypto payment history
  const allPayments = [
    ...mockHistory.map(p => ({ ...p, type: 'traditional' })),
    ...(cryptoPayments || []).map((p: any) => ({
      date: new Date(p.createdAt).toISOString().split('T')[0],
      amount: parseFloat(p.amount),
      status: p.status === 'confirmed' ? 'Paid' :
              p.status === 'pending' ? 'Pending' : 'Failed',
      method: `${p.currency} (Crypto)`,
      type: 'crypto',
      transactionHash: p.transactionHash
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Payments & Documents</h1>
        <Button variant="outline" onClick={() => setShowHistory(true)}>
          <History className="h-4 w-4 mr-2" />
          Payment History
        </Button>
      </div>

      {/* Current Invoice */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Rental Invoice</CardTitle>
          <CardDescription>Due {new Date(mockInvoice.dueDate).toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-6">
            <div className="flex justify-between"><span>Base Rent</span><span>${mockInvoice.baseRent.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Utilities</span><span>${mockInvoice.utilities.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Parking</span><span>${mockInvoice.parking.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Late Fees</span><span>${mockInvoice.lateFees.toFixed(2)}</span></div>
            <div className="border-t pt-2 mt-2 flex justify-between font-semibold text-lg">
              <span>Total Due</span>
              <span>${mockInvoice.totalDue.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="traditional" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Traditional Payment
              </TabsTrigger>
              <TabsTrigger value="crypto" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Cryptocurrency
              </TabsTrigger>
            </TabsList>

            <TabsContent value="traditional" className="mt-4">
              <Button
                className="w-full text-lg py-6"
                onClick={handleTraditionalPay}
                disabled={isPaying}
              >
                {isPaying ? "Processing..." : `Pay Now $${mockInvoice.totalDue.toFixed(2)}`}
              </Button>
            </TabsContent>

            <TabsContent value="crypto" className="mt-4">
              <CryptoPayment
                propertyId="demo-property-123"
                rentAmount={mockInvoice.totalDue}
                dueDate={mockInvoice.dueDate}
                onPaymentSuccess={handleCryptoPaymentSuccess}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Document Sharing Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Blockchain Document Management
          </CardTitle>
          <CardDescription>
            Upload and share documents securely on IPFS with property managers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentSharing onDocumentShared={(hash) => console.log('Document shared:', hash)} />
        </CardContent>
      </Card>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Payment History</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPayments.map((p, i) => (
                <TableRow key={i}>
                  <TableCell>{new Date(p.date).toLocaleDateString()}</TableCell>
                  <TableCell>${p.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        p.status === 'Paid' ? 'default' :
                        p.status === 'Pending' ? 'secondary' : 'destructive'
                      }
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{p.method}</TableCell>
                  <TableCell>
                    <Badge variant={p.type === 'crypto' ? 'outline' : 'secondary'}>
                      {p.type === 'crypto' ? 'Blockchain' : 'Traditional'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(p as any).transactionHash && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`https://etherscan.io/tx/${(p as any).transactionHash}`, '_blank')}
                      >
                        View TX
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
} 