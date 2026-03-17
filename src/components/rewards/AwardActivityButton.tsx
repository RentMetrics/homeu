'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';

interface AwardActivityButtonProps {
  activityType: 'rent_payment' | 'referral' | 'profile_completion' | 'verification' | 'review' | 'maintenance_report';
  points: number;
  label: string;
  onSuccess?: () => void;
  disabled?: boolean;
  className?: string;
}

export function AwardActivityButton({
  activityType,
  points,
  label,
  onSuccess,
  disabled,
  className,
}: AwardActivityButtonProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const handleAwardPoints = async () => {
    if (!user?.emailAddresses[0]?.emailAddress) {
      toast.error('Please sign in to earn rewards');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/awardco/recognize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail: user.emailAddresses[0].emailAddress,
          activityType,
          points,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to award points');
      }

      const data = await response.json();

      if (data.success) {
        toast.success(`${points} points awarded! 🎉`);
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error awarding points:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to award points');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleAwardPoints}
      disabled={disabled || loading}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Awarding...
        </>
      ) : (
        label
      )}
    </Button>
  );
}
