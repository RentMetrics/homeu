'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Wallet,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Zap,
  Shield,
  Gift,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { supportedChains } from '@/lib/wagmi-config';
import CoinbaseCommerceService from '@/lib/coinbase-commerce';

// Format currency with thousand separators
const formatCurrency = (amount: number) =>
  amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Conditionally import wagmi hooks only on client
let useAccount: any;
let useConnect: any;
let useDisconnect: any;
let useSendTransaction: any;
let useWaitForTransactionReceipt: any;
let useBalance: any;
let useSwitchChain: any;
let parseEther: any;
let formatEther: any;

if (typeof window !== 'undefined') {
  import('wagmi').then((wagmi) => {
    useAccount = wagmi.useAccount;
    useConnect = wagmi.useConnect;
    useDisconnect = wagmi.useDisconnect;
    useSendTransaction = wagmi.useSendTransaction;
    useWaitForTransactionReceipt = wagmi.useWaitForTransactionReceipt;
    useBalance = wagmi.useBalance;
    useSwitchChain = wagmi.useSwitchChain;
  });
  import('viem').then((viem) => {
    parseEther = viem.parseEther;
    formatEther = viem.formatEther;
  });
}

interface CryptoRentPaymentProps {
  rentAmount: number;
  homeuFee?: number;
  propertyId: string;
  month: string;
  onPaymentSuccess?: (paymentId: string) => void;
}

type PaymentMethod = 'wallet' | 'coinbase';
type CryptoToken = 'ETH' | 'MATIC' | 'USDC' | 'USDT';

// Inner component that uses wagmi hooks
function WalletPaymentSection({
  selectedChainId,
  setSelectedChainId,
  selectedToken,
  setSelectedToken,
  cryptoAmount,
  totalAmount,
  propertyId,
  onPaymentSuccess,
}: {
  selectedChainId: number;
  setSelectedChainId: (id: number) => void;
  selectedToken: CryptoToken;
  setSelectedToken: (token: CryptoToken) => void;
  cryptoAmount: string;
  totalAmount: number;
  propertyId: string;
  onPaymentSuccess?: (paymentId: string) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const storeCryptoPayment = useMutation(api.blockchain.storeCryptoPayment);

  // Get current chain config
  const selectedChain = supportedChains.find(c => c.id === selectedChainId);

  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  // Dynamic import of wagmi hooks at render time
  const WagmiWalletContent = () => {
    const { useAccount, useConnect, useDisconnect, useSendTransaction, useWaitForTransactionReceipt, useBalance, useSwitchChain } = require('wagmi');
    const { parseEther, formatEther } = require('viem');

    const { address, isConnected, chain } = useAccount();
    const { connect, connectors, isPending: isConnecting } = useConnect();
    const { disconnect } = useDisconnect();
    const { switchChain, isPending: isSwitching } = useSwitchChain();
    const { data: hash, sendTransaction, isPending: isSending, error: sendError } = useSendTransaction();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
    const { data: balance } = useBalance({ address, chainId: selectedChainId });

    const needsChainSwitch = isConnected && chain?.id !== selectedChainId;

    // Handle chain switch
    const handleChainSwitch = async () => {
      if (needsChainSwitch && switchChain) {
        try {
          await switchChain({ chainId: selectedChainId });
        } catch (error) {
          toast.error('Failed to switch network');
        }
      }
    };

    // Handle wallet payment
    const handleWalletPayment = async () => {
      if (!address) {
        toast.error('Please connect your wallet');
        return;
      }

      if (needsChainSwitch) {
        await handleChainSwitch();
        return;
      }

      try {
        if (selectedToken === 'ETH' || selectedToken === 'MATIC') {
          const value = parseEther(cryptoAmount);
          const recipientAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f86789';

          sendTransaction({
            to: recipientAddress,
            value,
          });
        } else {
          toast.info('Stablecoin transfers require contract interaction. Use Coinbase Commerce for easier payment.');
        }
      } catch (error) {
        console.error('Payment error:', error);
        toast.error('Payment failed');
      }
    };

    // Handle successful transaction
    useEffect(() => {
      if (isConfirmed && hash) {
        toast.success('Payment confirmed on blockchain!');

        storeCryptoPayment({
          userId: address || '',
          propertyId,
          amount: cryptoAmount,
          currency: selectedToken,
          transactionHash: hash,
          recipientAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f86789',
        });

        onPaymentSuccess?.(hash);
      }
    }, [isConfirmed, hash]);

    // Handle send error
    useEffect(() => {
      if (sendError) {
        toast.error(sendError.message.slice(0, 100));
      }
    }, [sendError]);

    if (!isConnected) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Connect your crypto wallet to pay directly from your balance.
          </p>
          <div className="grid grid-cols-1 gap-2">
            {connectors.map((connector: any) => (
              <Button
                key={connector.id}
                variant="outline"
                onClick={() => connect({ connector })}
                disabled={isConnecting}
                className="justify-start gap-3"
              >
                {connector.name === 'MetaMask' && '🦊'}
                {connector.name === 'Coinbase Wallet' && '💙'}
                {connector.name === 'WalletConnect' && '🔗'}
                {connector.name}
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Connected Wallet Info */}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium">Wallet Connected</p>
              <p className="text-xs text-gray-500 font-mono">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => disconnect()}>
            Disconnect
          </Button>
        </div>

        {/* Network Selection */}
        <div className="space-y-2">
          <Label>Network</Label>
          <Select
            value={selectedChainId.toString()}
            onValueChange={(v) => setSelectedChainId(parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {supportedChains.filter(c => !c.isTestnet).map((chain) => (
                <SelectItem key={chain.id} value={chain.id.toString()}>
                  <div className="flex items-center justify-between gap-4">
                    <span>{chain.name}</span>
                    <span className="text-xs text-gray-500">{chain.gasEstimate}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedChain && (
            <p className="text-xs text-green-600">
              Gas fees: {selectedChain.gasEstimate}
            </p>
          )}
        </div>

        {/* Token Selection */}
        <div className="space-y-2">
          <Label>Pay With</Label>
          <Select
            value={selectedToken}
            onValueChange={(v) => setSelectedToken(v as CryptoToken)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USDC">
                <div className="flex items-center gap-2">
                  <span>💵</span>
                  <span>USDC (Recommended)</span>
                </div>
              </SelectItem>
              <SelectItem value="USDT">
                <div className="flex items-center gap-2">
                  <span>💲</span>
                  <span>USDT</span>
                </div>
              </SelectItem>
              <SelectItem value={selectedChainId === 137 ? 'MATIC' : 'ETH'}>
                <div className="flex items-center gap-2">
                  <span>{selectedChainId === 137 ? '🟣' : '⟠'}</span>
                  <span>{selectedChainId === 137 ? 'MATIC' : 'ETH'}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Amount Display */}
        <div className="p-4 border rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">You Pay</span>
            <span className="text-xl font-bold">
              {cryptoAmount} {selectedToken}
            </span>
          </div>
          {balance && (
            <p className="text-xs text-gray-500 mt-1">
              Balance: {formatEther(balance.value).slice(0, 8)} {balance.symbol}
            </p>
          )}
        </div>

        {/* Chain Switch Warning */}
        {needsChainSwitch && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Please switch to {selectedChain?.name}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={handleChainSwitch}
              disabled={isSwitching}
            >
              {isSwitching ? 'Switching...' : `Switch to ${selectedChain?.name}`}
            </Button>
          </div>
        )}

        {/* Pay Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleWalletPayment}
          disabled={isSending || isConfirming || needsChainSwitch}
        >
          {isSending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isConfirming && <Clock className="h-4 w-4 mr-2 animate-spin" />}
          {isSending ? 'Confirm in Wallet...' :
            isConfirming ? 'Confirming...' :
            `Pay ${cryptoAmount} ${selectedToken}`}
        </Button>

        {/* Transaction Status */}
        {hash && (
          <div className={`p-3 rounded-lg ${isConfirmed ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} border`}>
            <div className="flex items-center gap-2">
              {isConfirmed ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-blue-600 animate-spin" />
              )}
              <span className={isConfirmed ? 'text-green-800' : 'text-blue-800'}>
                {isConfirmed ? 'Payment Confirmed!' : 'Confirming on blockchain...'}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <code className="text-xs bg-white/50 px-2 py-1 rounded">
                {hash.slice(0, 10)}...{hash.slice(-8)}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open(
                  `${selectedChainId === 137 ? 'https://polygonscan.com' :
                    selectedChainId === 8453 ? 'https://basescan.org' :
                    'https://etherscan.io'}/tx/${hash}`,
                  '_blank'
                )}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return <WagmiWalletContent />;
}

export function CryptoRentPayment({
  rentAmount,
  homeuFee = 5,
  propertyId,
  month,
  onPaymentSuccess
}: CryptoRentPaymentProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('coinbase'); // Default to Coinbase for easier UX
  const [selectedToken, setSelectedToken] = useState<CryptoToken>('USDC');
  const [selectedChainId, setSelectedChainId] = useState<number>(137); // Polygon default
  const [coinbaseChargeUrl, setCoinbaseChargeUrl] = useState<string | null>(null);
  const [isCreatingCharge, setIsCreatingCharge] = useState(false);

  // Calculate amounts
  const totalAmount = rentAmount + homeuFee;
  const cryptoAmount = selectedToken === 'ETH' || selectedToken === 'MATIC'
    ? (totalAmount / 2500).toFixed(6) // Mock ETH price
    : totalAmount.toFixed(2);

  // Handle Coinbase Commerce payment
  const handleCoinbasePayment = async () => {
    setIsCreatingCharge(true);
    try {
      const commerce = new CoinbaseCommerceService();
      const result = await commerce.createRentCharge({
        renterId: 'guest',
        propertyId,
        propertyManagerId: 'pm_demo',
        rentAmount,
        homeuFee,
        month,
        description: `Rent payment for ${month}`,
      });

      if (result.success && result.charge) {
        setCoinbaseChargeUrl(result.charge.hosted_url);
        toast.success('Payment page ready!');
      } else {
        toast.error(result.error || 'Failed to create payment');
      }
    } catch (error) {
      console.error('Coinbase Commerce error:', error);
      toast.error('Failed to create payment');
    } finally {
      setIsCreatingCharge(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-purple-600" />
          Pay Rent with Crypto
        </CardTitle>
        <CardDescription>
          Fast, secure blockchain payments with instant confirmation
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Payment Summary */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Rent Amount</span>
            <span className="font-medium">${formatCurrency(rentAmount)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <Gift className="h-3 w-3 text-green-600" />
              HomeU Fee (100 pts back)
            </span>
            <span className="font-medium">${formatCurrency(homeuFee)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold text-purple-700">${formatCurrency(totalAmount)}</span>
          </div>
        </div>

        {/* Payment Method Tabs */}
        <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="coinbase" className="gap-2">
              <Zap className="h-4 w-4" />
              Easy Pay
            </TabsTrigger>
            <TabsTrigger value="wallet" className="gap-2">
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </TabsTrigger>
          </TabsList>

          {/* Coinbase Commerce Method */}
          <TabsContent value="coinbase" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Easy Pay with Coinbase
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• No wallet setup required</li>
                  <li>• Pay with any crypto: BTC, ETH, USDC, & more</li>
                  <li>• Automatic conversion to USD for your landlord</li>
                  <li>• Secure hosted checkout</li>
                </ul>
              </div>

              {!coinbaseChargeUrl ? (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCoinbasePayment}
                  disabled={isCreatingCharge}
                >
                  {isCreatingCharge && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isCreatingCharge ? 'Creating Payment...' : `Pay $${formatCurrency(totalAmount)} with Crypto`}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-900">Payment Ready!</span>
                    </div>
                    <p className="text-sm text-green-800">
                      Click below to complete your payment securely with Coinbase.
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => window.open(coinbaseChargeUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Complete Payment
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setCoinbaseChargeUrl(null)}
                  >
                    Create New Payment
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Wallet Connection Method */}
          <TabsContent value="wallet" className="space-y-4 mt-4">
            <WalletPaymentSection
              selectedChainId={selectedChainId}
              setSelectedChainId={setSelectedChainId}
              selectedToken={selectedToken}
              setSelectedToken={setSelectedToken}
              cryptoAmount={cryptoAmount}
              totalAmount={totalAmount}
              propertyId={propertyId}
              onPaymentSuccess={onPaymentSuccess}
            />
          </TabsContent>
        </Tabs>

        {/* Benefits Footer */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t">
          <div className="text-center">
            <Zap className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
            <p className="text-xs text-gray-500">Instant</p>
          </div>
          <div className="text-center">
            <Shield className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-xs text-gray-500">Secure</p>
          </div>
          <div className="text-center">
            <Gift className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-xs text-gray-500">+100 pts</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
