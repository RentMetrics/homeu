'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AwardcoBalanceProps {
  className?: string;
}

export function AwardcoBalance({ className }: AwardcoBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/awardco/balance');

      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      const data = await response.json();

      if (data.success) {
        setBalance(data.balance);
        setIsNewUser(data.newUser || false);
      }
    } catch (error) {
      console.error('Error fetching rewards balance:', error);
      toast.error('Unable to load your rewards balance');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-green-500" />
            HomeU Rewards Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-green-500" />
          HomeU Rewards Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-4xl font-bold text-green-600 mb-2">
            {balance !== null ? `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
          </div>
          <p className="text-sm text-gray-600">
            {isNewUser
              ? 'Welcome! Start earning rewards!'
              : 'Available to redeem'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Alias for backward compatibility
export const HomeUBalance = AwardcoBalance;
