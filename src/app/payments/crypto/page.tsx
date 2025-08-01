'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Bitcoin, Loader2, CheckCircle } from 'lucide-react';

export default function CryptoPaymentsPage() {
  const { user, isLoaded } = useUser();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('ETH');
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState('');

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/payments/crypto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency,
          txHash: txHash || 'mock-tx-hash-' + Date.now(),
        }),
      });

      if (response.ok) {
        toast.success('Crypto payment submitted successfully!');
        setAmount('');
        setTxHash('');
      } else {
        toast.error('Failed to submit payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access crypto payments.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Crypto Rent Payments</h1>
          <p className="text-muted-foreground">
            Pay your rent using cryptocurrency
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bitcoin className="h-6 w-6" />
              Submit Crypto Payment
            </CardTitle>
            <CardDescription>
              Enter your payment details and transaction hash
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePayment} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                      <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                      <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                      <SelectItem value="USDT">Tether (USDT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="txHash">Transaction Hash (Optional)</Label>
                <Input
                  id="txHash"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="0x..."
                />
                <p className="text-sm text-muted-foreground">
                  If you've already made the transaction, provide the hash for verification
                </p>
              </div>

              <Button 
                type="submit" 
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Bitcoin className="mr-2 h-4 w-4" />
                    Submit Payment
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">How to pay with crypto:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Enter the amount you want to pay</li>
                <li>Select your preferred cryptocurrency</li>
                <li>Make the payment to our wallet address</li>
                <li>Submit the transaction hash for verification</li>
                <li>We'll confirm your payment within 24 hours</li>
              </ol>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Our Wallet Address:</p>
              <p className="text-sm font-mono bg-background p-2 rounded">
                0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 