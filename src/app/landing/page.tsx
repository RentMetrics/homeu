'use client';

import Banner from "@/components/landing/Banner";
import VerifiedRenter from "@/components/landing/VerifiedRenter";
import AITools from "@/components/landing/AITools";
import CTA from "@/components/landing/CTA";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";

export default function LandingPage() {
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