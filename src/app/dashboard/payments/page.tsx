"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  const [showHistory, setShowHistory] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const handlePay = () => {
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      alert("Payment successful!");
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <Button variant="outline" onClick={() => setShowHistory(true)}>Payment History</Button>
      </div>
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
          <Button className="w-full text-lg py-6" onClick={handlePay} disabled={isPaying}>
            {isPaying ? "Processing..." : `Pay Now $${mockInvoice.totalDue.toFixed(2)}`}
          </Button>
        </CardContent>
      </Card>
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-lg">
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockHistory.map((p, i) => (
                <TableRow key={i}>
                  <TableCell>{new Date(p.date).toLocaleDateString()}</TableCell>
                  <TableCell>${p.amount.toFixed(2)}</TableCell>
                  <TableCell>{p.status}</TableCell>
                  <TableCell>{p.method}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
} 