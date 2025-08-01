'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Loader2, 
  Building2, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { VerificationBadge } from '@/components/ui/verification-badge';

interface BankAccount {
  id: string;
  accountNumber: string;
  routingNumber: string;
  accountType: 'checking' | 'savings';
  bankName: string;
  status: 'active' | 'pending' | 'failed';
  paykey: string;
}

interface StraddleBankConnectionProps {
  onConnectionComplete?: (accounts: BankAccount[]) => void;
  className?: string;
}

export function StraddleBankConnection({ 
  onConnectionComplete,
  className 
}: StraddleBankConnectionProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [connectionUrl, setConnectionUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadBankAccounts();
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

  const handleConnectBank = async () => {
    try {
      setIsConnecting(true);

      const response = await fetch('/api/straddle/bank-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create bank connection');
      }

      const data = await response.json();
      setConnectionUrl(data.connectionUrl);

      // Open Straddle Bridge widget in a new window
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        data.connectionUrl,
        'straddle-bank-connection',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      // Poll for connection completion
      const checkConnection = setInterval(async () => {
        try {
          if (popup?.closed) {
            clearInterval(checkConnection);
            setIsConnecting(false);
            
            // Reload bank accounts
            await loadBankAccounts();
            
            if (onConnectionComplete) {
              onConnectionComplete(bankAccounts);
            }
            
            toast.success('Bank account connected successfully!');
          }
        } catch (error) {
          console.error('Error checking connection status:', error);
        }
      }, 2000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkConnection);
        setIsConnecting(false);
        if (popup && !popup.closed) {
          popup.close();
        }
        toast.error('Connection timed out. Please try again.');
      }, 300000);

    } catch (error) {
      console.error('Bank connection error:', error);
      toast.error('Failed to connect bank account');
      setIsConnecting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return null;
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
            <Building2 className="h-6 w-6 text-blue-600" />
            Bank Account Connection
          </CardTitle>
          <CardDescription>
            Connect your bank account to enable rent payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Verification Required</h3>
            <p className="text-muted-foreground mb-4">
              You must complete your verification before connecting a bank account.
            </p>
            <Button onClick={() => router.push('/dashboard/profile')}>
              Complete Verification
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
            <Building2 className="h-6 w-6 text-blue-600" />
            <span>Bank Account Connection</span>
            <VerificationBadge isVerified={user.publicMetadata.verified} size="sm" />
          </CardTitle>
          <CardDescription>
            Connect your bank account to enable secure rent payments through Straddle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Button */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-medium">Connect Bank Account</h3>
                <p className="text-sm text-muted-foreground">
                  Securely connect your bank account using Straddle's Bridge
                </p>
              </div>
            </div>
            <Button 
              onClick={handleConnectBank}
              disabled={isConnecting}
              className="flex items-center gap-2"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Connect Bank
                </>
              )}
            </Button>
          </div>

          {/* Connected Accounts */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : bankAccounts.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Connected Accounts</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadBankAccounts}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                {bankAccounts.map((account) => (
                  <div 
                    key={account.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(account.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{account.bankName}</span>
                          {getStatusBadge(account.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} • 
                          ****{account.accountNumber.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">PayKey</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {account.paykey.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No bank accounts connected yet.</p>
              <p className="text-sm">Click "Connect Bank" to get started.</p>
            </div>
          )}

          {/* Benefits */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Benefits of Bank Connection</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Secure rent payments directly from your bank account</li>
              <li>• No credit card fees or processing charges</li>
              <li>• Faster payment processing with real-time confirmation</li>
              <li>• Built-in fraud protection and balance verification</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 