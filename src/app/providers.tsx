'use client';

import { ThemeProvider } from 'next-themes';
import { ConvexWrapper } from '@/components/ConvexWrapper';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexWrapper>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </ConvexWrapper>
  );
} 