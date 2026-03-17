'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2, Gift } from 'lucide-react';
import { toast } from 'sonner';

interface AwardcoSSOButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function AwardcoSSOButton({
  className,
  variant = 'default',
  size = 'default',
  showIcon = true,
  children,
}: AwardcoSSOButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSSO = async () => {
    try {
      setLoading(true);

      // Open SSO in new window to maintain HomeU session
      const ssoWindow = window.open(
        '/api/awardco/sso',
        'homeu_rewards_sso',
        'width=1100,height=750,menubar=no,toolbar=no,location=no,status=no'
      );

      if (!ssoWindow) {
        // Popup blocked - fall back to redirect
        toast.info('Opening HomeU Rewards Store...');
        window.location.href = '/api/awardco/sso';
        return;
      }

      // Monitor the popup window
      const checkWindow = setInterval(() => {
        if (ssoWindow.closed) {
          clearInterval(checkWindow);
          setLoading(false);
        }
      }, 1000);

      // Auto-clear after 30 seconds
      setTimeout(() => {
        clearInterval(checkWindow);
        setLoading(false);
      }, 30000);

    } catch (error) {
      console.error('SSO Error:', error);
      toast.error('Failed to open Rewards Store. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSSO}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Connecting...
        </>
      ) : (
        <>
          {showIcon && <Gift className="h-4 w-4 mr-2" />}
          {children || 'Open Rewards Store'}
          {showIcon && <ExternalLink className="h-3 w-3 ml-1 opacity-70" />}
        </>
      )}
    </Button>
  );
}

/**
 * Card variant of the SSO button for dashboard display
 */
export function HomeURewardsCard({ className }: { className?: string }) {
  return (
    <div className={`bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
            <Gift className="h-5 w-5" />
            HomeU Rewards Store
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Redeem your points for gift cards, merchandise, and more!
          </p>
        </div>
      </div>
      <AwardcoSSOButton
        variant="default"
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      />
    </div>
  );
}

// Keep backward compatibility alias
export const AwardcoRewardsCard = HomeURewardsCard;
