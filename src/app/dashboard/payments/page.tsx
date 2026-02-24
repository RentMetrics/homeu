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
import {
  CreditCard,
  Wallet,
  FileText,
  History,
  DollarSign,
  CalendarDays,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUserSync } from "@/hooks/useUserSync";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const mockInvoice = {
  dueDate: "2025-03-01",
  baseRent: 1750.00,
  utilities: 150.00,
  parking: 100.00,
  lateFees: 0.00,
  totalDue: 2000.00,
};

const mockHistory = [
  { date: "2025-02-01", amount: 2000.00, status: "Paid", method: "Bank Transfer" },
  { date: "2025-01-01", amount: 2000.00, status: "Paid", method: "Credit Card" },
  { date: "2024-12-01", amount: 2000.00, status: "Paid", method: "Bank Transfer" },
  { date: "2024-11-01", amount: 2000.00, status: "Paid", method: "Bank Transfer" },
  { date: "2024-10-01", amount: 1950.00, status: "Paid", method: "Credit Card" },
];

export default function PaymentsPage() {
  const { user } = useUserSync();
  const [showHistory, setShowHistory] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [activeTab, setActiveTab] = useState("traditional");

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
  };

  const allPayments = [
    ...mockHistory.map(p => ({ ...p, type: 'traditional' as const })),
    ...(cryptoPayments || []).map((p: any) => ({
      date: new Date(p.createdAt).toISOString().split('T')[0],
      amount: parseFloat(p.amount),
      status: p.status === 'confirmed' ? 'Paid' :
              p.status === 'pending' ? 'Pending' : 'Failed',
      method: `${p.currency} (Crypto)`,
      type: 'crypto' as const,
      transactionHash: p.transactionHash
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalPaid = allPayments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-gray-500 mt-1">Manage your rent payments and documents</p>
        </div>
        <Button variant="outline" onClick={() => setShowHistory(true)} className="shrink-0">
          <History className="h-4 w-4 mr-2" />
          Payment History
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Amount Due</p>
                <p className="text-2xl font-bold text-blue-900">${fmt(mockInvoice.totalDue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Total Paid (YTD)</p>
                <p className="text-2xl font-bold text-green-900">${fmt(totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-amber-600 font-medium">Due Date</p>
                <p className="text-2xl font-bold text-amber-900">
                  {new Date(mockInvoice.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Invoice */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Monthly Rental Invoice</CardTitle>
              <CardDescription>
                Due {new Date(mockInvoice.dueDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Unpaid
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Line items */}
          <div className="rounded-lg border bg-gray-50/50 divide-y mb-6">
            <div className="flex justify-between px-4 py-3">
              <span className="text-gray-600">Base Rent</span>
              <span className="font-medium">${fmt(mockInvoice.baseRent)}</span>
            </div>
            <div className="flex justify-between px-4 py-3">
              <span className="text-gray-600">Utilities</span>
              <span className="font-medium">${fmt(mockInvoice.utilities)}</span>
            </div>
            <div className="flex justify-between px-4 py-3">
              <span className="text-gray-600">Parking</span>
              <span className="font-medium">${fmt(mockInvoice.parking)}</span>
            </div>
            {mockInvoice.lateFees > 0 && (
              <div className="flex justify-between px-4 py-3">
                <span className="text-red-600">Late Fees</span>
                <span className="font-medium text-red-600">${fmt(mockInvoice.lateFees)}</span>
              </div>
            )}
            <div className="flex justify-between px-4 py-4 bg-white rounded-b-lg">
              <span className="text-lg font-semibold">Total Due</span>
              <span className="text-lg font-bold text-blue-600">${fmt(mockInvoice.totalDue)}</span>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="traditional" className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4" />
                Bank / Card
              </TabsTrigger>
              <TabsTrigger value="crypto" className="flex items-center gap-2 text-sm">
                <Wallet className="h-4 w-4" />
                Cryptocurrency
              </TabsTrigger>
            </TabsList>

            <TabsContent value="traditional" className="mt-4">
              <Button
                className="w-full text-lg py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
                onClick={handleTraditionalPay}
                disabled={isPaying}
                size="lg"
              >
                {isPaying ? (
                  "Processing..."
                ) : (
                  <>
                    <DollarSign className="h-5 w-5 mr-1" />
                    Pay Now — ${fmt(mockInvoice.totalDue)}
                  </>
                )}
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

      {/* Recent Payments Quick View */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-400" />
              Recent Payments
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)} className="text-blue-600">
              View All
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {allPayments.slice(0, 3).map((p, i) => (
              <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    p.status === 'Paid' ? 'bg-green-100' : p.status === 'Pending' ? 'bg-amber-100' : 'bg-red-100'
                  }`}>
                    {p.status === 'Paid' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{p.method}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${fmt(p.amount)}</p>
                  <Badge
                    variant={p.status === 'Paid' ? 'default' : p.status === 'Pending' ? 'secondary' : 'destructive'}
                    className="text-xs"
                  >
                    {p.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Sharing Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" />
            Document Management
          </CardTitle>
          <CardDescription>
            Upload and share documents securely with your property manager
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentSharing onDocumentShared={(hash) => console.log('Document shared:', hash)} />
        </CardContent>
      </Card>

      {/* Full Payment History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Payment History</DialogTitle>
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
                  <TableCell className="font-medium">
                    {new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </TableCell>
                  <TableCell className="font-semibold">${fmt(p.amount)}</TableCell>
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
