'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Loader2, 
  Building2, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  Calendar,
  Receipt
} from 'lucide-react';
import { VerificationBadge } from '@/components/ui/verification-badge';

const paymentSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than $0'),
  currency: z.string().default('USD'),
  description: z.string().min(1, 'Description is required'),
  paykey: z.string().min(1, 'Please select a bank account'),
  propertyId: z.string().min(1, 'Please select a property'),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface BankAccount {
  id: string;
  accountNumber: string;
  routingNumber: string;
  accountType: 'checking' | 'savings';
  bankName: string;
  status: 'active' | 'pending' | 'failed';
  paykey: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
  unitNumber?: string;
}

interface StraddlePaymentFormProps {
  onPaymentComplete?: (paymentId: string) => void;
  className?: string;
  defaultAmount?: number;
  defaultPropertyId?: string;
}

export function StraddlePaymentForm({ 
  onPaymentComplete,
  className,
  defaultAmount,
  defaultPropertyId
}: StraddlePaymentFormProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed' | null>(null);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: defaultAmount || 0,
      currency: 'USD',
      description: '',
      paykey: '',
      propertyId: defaultPropertyId || '',
    },
  });

  useEffect(() => {
    if (user) {
      loadBankAccounts();
      loadProperties();
    }
  }, [user]);

  const loadBankAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/straddle/bank-connection');
      
      if (response.ok) {
        const data = await response.json();
        setBankAccounts(data.bankAccounts || []);
      }
    } catch (error) {
      console.error('Failed to load bank accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProperties = async () => {
    try {
      // This would typically come from your properties API
      // For now, using mock data
      setProperties([
        { id: '1', name: 'Sunset Apartments', address: '123 Main St', unitNumber: '4B' },
        { id: '2', name: 'Downtown Lofts', address: '456 Oak Ave', unitNumber: '12A' },
      ]);
    } catch (error) {
      console.error('Failed to load properties:', error);
    }
  };

  const onSubmit = async (data: PaymentFormValues) => {
    try {
      setIsSubmitting(true);
      setPaymentStatus('pending');

      const response = await fetch('/api/straddle/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          metadata: {
            paymentType: 'rent',
            timestamp: new Date().toISOString(),
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process payment');
      }

      const result = await response.json();
      setPaymentStatus(result.payment.status === 'COMPLETED' ? 'completed' : 'failed');
      
      if (result.payment.status === 'COMPLETED') {
        toast.success('Payment processed successfully!');
        if (onPaymentComplete) {
          onPaymentComplete(result.payment.id);
        }
      } else {
        toast.error('Payment failed. Please try again.');
      }

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
      setPaymentStatus('failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      case 'pending':
        return <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'completed':
        return 'Your payment has been processed successfully!';
      case 'failed':
        return 'Payment failed. Please check your bank account and try again.';
      case 'pending':
        return 'Processing your payment...';
      default:
        return '';
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  if (!user.publicMetadata.verified) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            Rent Payment
          </CardTitle>
          <CardDescription>
            Make secure rent payments through your connected bank account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Verification Required</h3>
            <p className="text-muted-foreground mb-4">
              You must complete your verification before making payments.
            </p>
            <Button onClick={() => router.push('/dashboard/profile')}>
              Complete Verification
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeBankAccounts = bankAccounts.filter(account => account.status === 'active');

  if (activeBankAccounts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            <span>Rent Payment</span>
            <VerificationBadge isVerified={user.publicMetadata.verified} size="sm" />
          </CardTitle>
          <CardDescription>
            Make secure rent payments through your connected bank account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Bank Account Required</h3>
            <p className="text-muted-foreground mb-4">
              You need to connect a bank account before making payments.
            </p>
            <Button onClick={() => router.push('/dashboard/payments')}>
              Connect Bank Account
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            <span>Rent Payment</span>
            <VerificationBadge isVerified={user.publicMetadata.verified} size="sm" />
          </CardTitle>
          <CardDescription>
            Make secure rent payments through your connected bank account using Straddle
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentStatus && (
            <div className="mb-6 p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon()}
                <span className="font-medium">
                  {paymentStatus === 'completed' && 'Payment Successful'}
                  {paymentStatus === 'failed' && 'Payment Failed'}
                  {paymentStatus === 'pending' && 'Processing Payment'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{getStatusMessage()}</p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Property Selection */}
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a property" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name} - {property.address}
                            {property.unitNumber && ` (${property.unitNumber})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-10"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bank Account Selection */}
              <FormField
                control={form.control}
                name="paykey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Account</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a bank account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeBankAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.paykey}>
                            {account.bankName} - {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} • 
                            ****{account.accountNumber.slice(-4)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., Rent payment for March 2024" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Summary */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Payment Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">
                      ${form.watch('amount').toFixed(2)} {form.watch('currency')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Fee:</span>
                    <span className="font-medium text-green-600">$0.00</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-medium">
                    <span>Total:</span>
                    <span>${form.watch('amount').toFixed(2)} {form.watch('currency')}</span>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Receipt className="mr-2 h-4 w-4" />
                    Pay Rent
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Secure Payment</p>
                <p className="text-blue-700">
                  Your payment is processed securely through Straddle with bank-level encryption 
                  and real-time fraud protection.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 