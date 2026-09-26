'use client';

import { useState, useEffect } from 'react';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { useAuth } from '@clerk/nextjs';

interface ConvexWrapperProps {
  children: React.ReactNode;
}

export function ConvexWrapper({ children }: ConvexWrapperProps) {
  const [convex, setConvex] = useState<ConvexReactClient | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (process.env.NEXT_PUBLIC_CONVEX_URL) {
      const convexClient = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);
      setConvex(convexClient);
    }
  }, []);

  // Don't render anything until we're on the client
  if (!isClient) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>;
  }

  // If Convex is not available, render children without Convex
  if (!convex) {
    return <>{children}</>;
  }

  // Sends the Clerk session token with every Convex call so functions can
  // derive the caller from ctx.auth instead of trusting a userId arg.
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
