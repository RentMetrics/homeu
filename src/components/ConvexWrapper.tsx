'use client';

import { useState, useEffect } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

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
    return <div>Loading...</div>;
  }

  // If Convex is not available, render children without Convex
  if (!convex) {
    return <>{children}</>;
  }

  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  );
} 