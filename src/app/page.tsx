'use client';

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import Banner from "@/components/landing/Banner";
import VerifiedRenter from "@/components/landing/VerifiedRenter";
import AITools from "@/components/landing/AITools";
import CTA from "@/components/landing/CTA";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Home() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isLoaded && user) {
      router.push('/dashboard');
    }
  }, [user, isLoaded, router]);

  const handleStartNow = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      // This will be handled by the SignUpButton
    }
  };

  // Show loading state while checking user authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Don't render landing page for authenticated users
  if (isLoaded && user) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="font-bilo">
      <LandingHeader />
      <Banner />
      <VerifiedRenter />
      <AITools />
      <CTA />
      <LandingFooter />
    </div>
  );
}
