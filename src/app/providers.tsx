'use client';

import { ThemeProvider } from 'next-themes';
import { ConvexWrapper } from '@/components/ConvexWrapper';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexWrapper>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        forcedTheme="light"
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </ConvexWrapper>
  );
} 