"use client";

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { CreditCard, Building2, Bitcoin, AlertCircle } from 'lucide-react';
import { StraddlePaymentForm } from '@/components/straddle/StraddlePaymentForm';
import { StraddleBankConnection } from '@/components/straddle/StraddleBankConnection';

export default function RentalStatementPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('bank');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  // Mock data - replace with actual data from your API
  const rentDetails = {
    baseRent: 1500.00,
    utilities: 150.00,
    parking: 100.00,
    lateFees: 0.00,
    totalDue: 1750.00,
    dueDate: '2024-05-01',
    paymentHistory: [
      {
        date: '2024-04-01',
        amount: 1750.00,
        status: 'Paid',
        method: 'Bank Transfer'
      },
      {
        date: '2024-03-01',
        amount: 1750.00,
        status: 'Paid',
        method: 'Credit Card'
      }
    ]
  };

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Rent Payment</h1>
          <p className="text-muted-foreground">
            Pay your rent securely and conveniently using Straddle
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Straddle Payment Form */}
          <div>
            <StraddlePaymentForm 
              defaultAmount={rentDetails.totalDue}
              onPaymentComplete={(paymentId) => {
                toast.success('Payment completed successfully!');
                // Refresh payment history or redirect
              }}
            />
          </div>

          {/* Bank Connection */}
          <div>
            <StraddleBankConnection 
              onConnectionComplete={(accounts) => {
                toast.success(`${accounts.length} bank account(s) connected!`);
              }}
            />
          </div>
        </div>

        {/* Rent Statement */}
        <Card>
          <CardHeader>
            <CardTitle>Rent Statement</CardTitle>
            <CardDescription>
              Your current rent balance and payment history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Current Balance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Base Rent:</span>
                    <span>${rentDetails.baseRent.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Utilities:</span>
                    <span>${rentDetails.utilities.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parking:</span>
                    <span>${rentDetails.parking.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Late Fees:</span>
                    <span>${rentDetails.lateFees.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                    <span>Total Due:</span>
                    <span>${rentDetails.totalDue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Payment Due</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="text-2xl font-bold">{rentDetails.dueDate}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {rentDetails.totalDue > 0 ? 'Payment required' : 'No payment due'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              Your recent rent payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rentDetails.paymentHistory.map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{payment.date}</p>
                    <p className="text-sm text-muted-foreground">{payment.method}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${payment.amount.toFixed(2)}</p>
                    <p className="text-sm text-green-600">{payment.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 