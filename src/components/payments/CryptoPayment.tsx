'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Copy,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  QrCode,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';
import { useUserSync } from '@/hooks/useUserSync';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import CryptoPaymentService from '@/lib/crypto-payments';

interface CryptoPaymentProps {
  propertyId: string;
  rentAmount: number;
  dueDate: string;
  onPaymentSuccess?: (paymentId: string) => void;
}

export function CryptoPayment({
  propertyId,
  rentAmount,
  dueDate,
  onPaymentSuccess
}: CryptoPaymentProps) {
  const { user } = useUserSync();
  const [selectedCurrency, setSelectedCurrency] = useState<'ETH' | 'USDC' | 'USDT'>('ETH');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'confirming' | 'confirmed' | 'failed'>('idle');
  const [estimatedCost, setEstimatedCost] = useState<any>(null);

  const storeCryptoPayment = useMutation(api.blockchain.storeCryptoPayment);
  const updatePaymentStatus = useMutation(api.blockchain.updateCryptoPaymentStatus);

  const supportedCurrencies = CryptoPaymentService.getSupportedCurrencies();

  // Convert rent amount to crypto when currency changes
  useEffect(() => {
    const convertAmount = async () => {
      try {
        const amount = await CryptoPaymentService.convertFiatToCrypto(rentAmount, selectedCurrency);
        setCryptoAmount(amount);
      } catch (error) {
        console.error('Conversion error:', error);
        toast.error('Failed to convert currency');
      }
    };

    if (rentAmount > 0) {
      convertAmount();
    }
  }, [rentAmount, selectedCurrency]);

  // Get gas estimation when currency changes
  useEffect(() => {
    const getEstimation = async () => {
      if (!paymentRequest) return;

      try {
        const service = new CryptoPaymentService();
        const cost = await service.estimateTransactionCost(
          paymentRequest.paymentAddress,
          cryptoAmount,
          selectedCurrency
        );
        setEstimatedCost(cost);
      } catch (error) {
        console.error('Gas estimation error:', error);
      }
    };

    getEstimation();
  }, [paymentRequest, cryptoAmount, selectedCurrency]);

  const generatePaymentRequest = () => {
    if (!user?.id) {
      toast.error('Please sign in to make a payment');
      return;
    }

    // Demo recipient address - in production, get from property management
    const recipientAddress = '0x742d35Cc4472c4F3a4c3F1a8e9dC7c4C1F123456';

    const request = CryptoPaymentService.createPaymentRequest({
      userId: user.id,
      propertyId,
      amount: cryptoAmount,
      currency: selectedCurrency,
      recipientAddress,
      description: `Rent payment for property ${propertyId}`
    });

    setPaymentRequest(request);
    setPaymentStatus('pending');
  };

  const submitTransactionHash = async () => {
    if (!transactionHash || !user?.id || !paymentRequest) {
      toast.error('Please enter a valid transaction hash');
      return;
    }

    try {
      setPaymentStatus('confirming');

      // Store payment in Convex
      await storeCryptoPayment({
        userId: user.id,
        propertyId,
        amount: cryptoAmount,
        currency: selectedCurrency,
        transactionHash,
        recipientAddress: paymentRequest.paymentAddress,
      });

      // Start verification process (in production, this would be a background job)
      setTimeout(async () => {
        try {
          const service = new CryptoPaymentService();
          const verification = await service.verifyTransaction(transactionHash);

          if (verification.isValid) {
            await updatePaymentStatus({
              transactionHash,
              status: 'confirmed',
              blockNumber: verification.blockNumber,
              gasUsed: verification.gasUsed,
            });

            setPaymentStatus('confirmed');
            toast.success('Payment confirmed successfully!');
            onPaymentSuccess?.(transactionHash);
          } else {
            await updatePaymentStatus({
              transactionHash,
              status: 'failed',
            });

            setPaymentStatus('failed');
            toast.error('Payment verification failed');
          }
        } catch (error) {
          console.error('Verification error:', error);
          setPaymentStatus('failed');
          toast.error('Payment verification failed');
        }
      }, 5000); // Mock 5-second verification delay

      toast.success('Transaction submitted for verification');
    } catch (error) {
      console.error('Payment submission error:', error);
      setPaymentStatus('failed');
      toast.error('Failed to submit payment');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'confirming':
        return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Wallet className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusText = () => {
    switch (paymentStatus) {
      case 'pending':
        return 'Payment request generated';
      case 'confirming':
        return 'Verifying transaction...';
      case 'confirmed':
        return 'Payment confirmed';
      case 'failed':
        return 'Payment failed';
      default:
        return 'Ready to pay';
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'confirming':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Pay with Cryptocurrency
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Status */}
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <Badge className={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </div>

        {/* Currency Selection */}
        <div className="space-y-2">
          <Label>Select Cryptocurrency</Label>
          <Select value={selectedCurrency} onValueChange={(value) => setSelectedCurrency(value as 'ETH' | 'USDC' | 'USDT')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {supportedCurrencies.map((currency) => (
                <SelectItem key={currency.symbol} value={currency.symbol}>
                  <div className="flex items-center gap-2">
                    <span>{currency.icon}</span>
                    <span>{currency.name} ({currency.symbol})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount Display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Rent Amount (USD)</Label>
            <Input value={`$${rentAmount.toFixed(2)}`} disabled />
          </div>
          <div className="space-y-2">
            <Label>Amount in {selectedCurrency}</Label>
            <Input value={cryptoAmount} disabled />
          </div>
        </div>

        {/* Gas Estimation */}
        {estimatedCost && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Transaction Cost Estimate</h4>
            <div className="text-xs space-y-1">
              <div>Gas Limit: {estimatedCost.gasLimit}</div>
              <div>Gas Price: {estimatedCost.gasPrice} wei</div>
              <div>Estimated Fee: ~{estimatedCost.estimatedCost} ETH</div>
            </div>
          </div>
        )}

        {/* Generate Payment Request */}
        {paymentStatus === 'idle' && (
          <Button onClick={generatePaymentRequest} className="w-full">
            Generate Payment Request
          </Button>
        )}

        {/* Payment Request Details */}
        {paymentRequest && paymentStatus !== 'confirmed' && (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium">Payment Details</h4>

              <div className="space-y-2">
                <Label>Recipient Address</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={paymentRequest.paymentAddress}
                    disabled
                    className="text-xs font-mono"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(paymentRequest.paymentAddress, 'Address')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>QR Code URL</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={paymentRequest.qrCode}
                    disabled
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(paymentRequest.qrCode, 'Payment URL')}
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Payment Instructions</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Copy the recipient address or scan the QR code</li>
                <li>2. Send exactly {cryptoAmount} {selectedCurrency} to the address</li>
                <li>3. Copy the transaction hash and paste it below</li>
                <li>4. Click &quot;Submit Transaction&quot; to verify payment</li>
              </ol>
            </div>

            {/* Transaction Hash Input */}
            <div className="space-y-2">
              <Label>Transaction Hash</Label>
              <Input
                value={transactionHash}
                onChange={(e) => setTransactionHash(e.target.value)}
                placeholder="Paste your transaction hash here"
                disabled={paymentStatus === 'confirming'}
              />
            </div>

            <Button
              onClick={submitTransactionHash}
              disabled={!transactionHash || paymentStatus === 'confirming'}
              className="w-full"
            >
              {paymentStatus === 'confirming' ? 'Verifying...' : 'Submit Transaction'}
            </Button>
          </div>
        )}

        {/* Success State */}
        {paymentStatus === 'confirmed' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium text-green-900">Payment Confirmed!</span>
            </div>
            <p className="text-sm text-green-800 mb-3">
              Your rent payment has been successfully confirmed on the blockchain.
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-green-300"
                onClick={() => window.open(`https://etherscan.io/tx/${transactionHash}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View on Etherscan
              </Button>
            </div>
          </div>
        )}

        {/* Due Date Reminder */}
        <div className="text-xs text-gray-500 text-center">
          Due date: {new Date(dueDate).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}