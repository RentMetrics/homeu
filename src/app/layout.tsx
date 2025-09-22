import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import localFont from "next/font/local";
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({ subsets: ['latin'] });

const bilo = localFont({
  src: [
    {
      path: "../../public/fonts/bilo/fonnts.com-Bilo.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/bilo/fonnts.com-Bilo_Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/bilo/fonnts.com-Bilo_Black.otf",
      weight: "900",
      style: "normal",
    },
    {
      path: "../../public/fonts/bilo/fonnts.com-Bilo_ExtraBold.otf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-bilo",
});

export const metadata: Metadata = {
  title: 'HomeU - Your Home Management Platform',
  description: 'Manage your home, track expenses, and find your next home with HomeU.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${bilo.variable}`}>
        <ClerkProvider>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
