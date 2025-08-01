'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function CryptoPaymentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('ETH');
  const [walletAddress, setWalletAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  useEffect(() => {
    // TODO: Implement real-time exchange rate fetching
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch(`/api/exchange-rate?currency=${currency}`);
        const data = await response.json();
        setExchangeRate(data.rate);
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
      }
    };

    fetchExchangeRate();
    const interval = setInterval(fetchExchangeRate, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [currency]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  const handlePayment = async () => {
    try {
      setIsProcessing(true);

      if (!window.ethereum) {
        throw new Error('Please install MetaMask or another Web3 wallet');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // TODO: Implement actual payment processing
      const tx = await signer.sendTransaction({
        to: walletAddress,
        value: ethers.parseEther(amount),
      });

      await tx.wait();

      // Record the payment in our system
      const response = await fetch('/api/payments/crypto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          txHash: tx.hash,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record payment');
      }

      toast.success('Payment processed successfully');
      router.push('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Payment failed');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Crypto Payment</CardTitle>
          <CardDescription>
            Pay your rent using cryptocurrency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount in USD"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Select Cryptocurrency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                  <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {exchangeRate && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  Exchange Rate: 1 {currency} = ${exchangeRate.toFixed(2)} USD
                </p>
                {amount && (
                  <p className="text-sm mt-2">
                    You will pay: {(Number(amount) / exchangeRate).toFixed(6)} {currency}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="wallet">Recipient Wallet Address</Label>
              <Input
                id="wallet"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter wallet address"
              />
            </div>

            <Button
              onClick={handlePayment}
              disabled={isProcessing || !amount || !walletAddress}
              className="w-full"
            >
              {isProcessing ? 'Processing...' : 'Pay with Crypto'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 