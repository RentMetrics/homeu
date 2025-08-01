import { Badge } from '@/components/ui/badge';
import { Home, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  isVerified: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function VerificationBadge({ 
  isVerified, 
  className,
  size = 'md' 
}: VerificationBadgeProps) {
  if (!isVerified) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-sm',
        'flex items-center gap-1.5 font-medium',
        sizeClasses[size],
        className
      )}
    >
      <div className="flex items-center gap-1">
        <Home className={cn('text-yellow-300', iconSizes[size])} />
        <Star className={cn('text-yellow-300', iconSizes[size])} />
      </div>
      <span>Verified Renter</span>
    </Badge>
  );
}

// Compact version for use in lists or small spaces
export function CompactVerificationBadge({ 
  isVerified, 
  className 
}: { 
  isVerified: boolean; 
  className?: string; 
}) {
  if (!isVerified) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Home className="h-4 w-4 text-blue-600" />
      <Star className="h-3 w-3 text-yellow-500" />
    </div>
  );
} 