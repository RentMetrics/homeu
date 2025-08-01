"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, InfoIcon, Home, Search, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useUser } from '@clerk/nextjs';
import { useVerification } from '@/hooks/useVerification';
import VerificationModal from '@/components/verification/VerificationModal';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { Badge } from '@/components/ui/badge';

// Type definitions for credit bureau data
type BureauKey = 'transunion' | 'equifax' | 'experian' | 'allbureaus';

interface BureauData {
  score?: number;
  rating?: string;
  chartColor?: string;
  chartPath?: string;
  popupScore?: number;
  popupRating?: string;
  yAxisMin?: number;
  yAxisMax?: number;
  markerPosition?: { right: string; top: string };
  scores?: { transunion: number; equifax: number; experian: number };
  ratings?: { transunion: string; equifax: string; experian: string };
  isAll?: boolean;
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { 
    verificationStatus, 
    showVerificationModal, 
    setShowVerificationModal, 
    markStepComplete, 
    completeOnboarding 
  } = useVerification();
  
  const [selectedBureau, setSelectedBureau] = useState<BureauKey>('transunion');
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // Check if user needs onboarding
  useEffect(() => {
    if (user && isLoaded) {
      // Check if user has completed onboarding
      const onboardingComplete = user.unsafeMetadata?.onboardingComplete;
      const isNewUser = !onboardingComplete;
      
      if (isNewUser) {
        // Show onboarding modal for new users
        setShowOnboardingModal(true);
      }
    }
  }, [user, isLoaded]);

  // Placeholder for lease data until Convex integration
  const leaseData = null;

  // Credit score data for each bureau
  const bureauData: Record<BureauKey, BureauData> = {
    transunion: {
      score: 775,
      rating: "Great", 
      chartColor: "#10b981", // green
      chartPath: "M0,40 L10,20 L20,50 L30,70 L40,60 L50,50 L60,30 L70,20 L80,30 L90,20 L100,30",
      popupScore: 842,
      popupRating: "Excellent",
      yAxisMin: 750,
      yAxisMax: 850,
      markerPosition: { right: "1/4", top: "1/4" }
    },
    equifax: {
      score: 609,
      rating: "Fair",
      chartColor: "#f97316", // orange
      chartPath: "M0,30 L10,20 L20,25 L30,15 L40,20 L50,30 L60,25 L70,30 L80,25 L90,20 L100,25",
      popupScore: 609,
      popupRating: "Fair",
      yAxisMin: 600,
      yAxisMax: 650,
      markerPosition: { right: "3/5", top: "2/5" }
    },
    experian: {
      score: 688,
      rating: "Good",
      chartColor: "#eab308", // yellow
      chartPath: "M0,20 L10,25 L20,35 L30,15 L40,25 L50,20 L60,30 L70,15 L80,20 L90,10 L100,15",
      popupScore: 688,
      popupRating: "Good",
      yAxisMin: 650,
      yAxisMax: 700,
      markerPosition: { right: "1/3", top: "1/2" }
    },
    allbureaus: {
      scores: { transunion: 775, equifax: 609, experian: 688 },
      ratings: { transunion: "Great", equifax: "Fair", experian: "Good" },
      isAll: true
    }
  };

  // Get the active bureau data
  const activeBureau = bureauData[selectedBureau];
  
  return (
    <div className="space-y-8">
      {/* Verification Status Banner */}
      {!verificationStatus.isVerified && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <h3 className="font-medium text-orange-800">Complete Your Profile</h3>
                <p className="text-sm text-orange-700">
                  Become a verified renter to unlock all HomeU features and faster rental approvals.
                </p>
              </div>
              <Button 
                onClick={() => setShowVerificationModal(true)}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700"
              >
                Complete Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Welcome Section */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200 relative">
            <Image
              src={user?.imageUrl || "https://randomuser.me/api/portraits/men/32.jpg"}
              alt="Profile"
              fill
              className="object-cover"
            />
          </div>
          <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
            verificationStatus.isVerified ? 'bg-green-500' : 'bg-orange-500'
          }`}></div>
        </div>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Welcome {user?.firstName || 'User'}
            {verificationStatus.isVerified ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="border-orange-200 text-orange-700">
                <AlertCircle className="h-4 w-4 mr-1" />
                Unverified
              </Badge>
            )}
          </h1>
          <p className="text-gray-500">
            {verificationStatus.isVerified 
              ? "You're all set! Explore properties and manage your rentals."
              : "Complete your verification to unlock all features and faster rental approvals."
            }
          </p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Rewards Card */}
        <div className="p-6 bg-white rounded-lg border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100">
              <svg className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="7" />
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-1">Rewards</h3>
          <p className="text-gray-600 mb-4">Your Current Points 120</p>
          <Link 
            href="/dashboard/rewards" 
            className="flex items-center text-blue-600 font-medium"
          >
            Get More Points <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {/* Pay Rent Card */}
        <div className="p-6 bg-white rounded-lg border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-100">
              <svg className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-1">Pay Rent</h3>
          <p className="text-gray-600 mb-4">Amount Due: $1,750.00</p>
          <Link 
            href="/dashboard/rent" 
            className="flex items-center text-green-600 font-medium"
          >
            View Statement <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {/* Lease Card */}
        <div className="p-6 bg-white rounded-lg border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100">
              <svg className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-1">Lease</h3>
          {/* Lease highlights section (conditionally rendered) */}
          {/* TODO: Fetch lease data from Convex and display if available */}
          {/* Example: */}
          {/*
          {leaseData ? (
            <div className="mb-2">
              <div className="text-gray-700 text-sm mb-1">Term: {leaseData.term}</div>
              <div className="text-gray-700 text-sm mb-1">Rental Amount: {leaseData.rentalAmount}</div>
              <div className="text-gray-700 text-xs italic mb-2">{leaseData.abstract}</div>
            </div>
          ) : null}
          */}
          <p className="text-gray-600 mb-4">{!leaseData ? "Submit your lease to manage and view highlights." : "View your lease details and highlights."}</p>
          <Link 
            href="/lease" 
            className="flex items-center text-blue-600 font-medium"
          >
            {!leaseData ? "Get Started" : "Manage Lease"} <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>

      {/* Credit Score Section */}
      <div className="bg-white rounded-lg border shadow p-6 mt-8">
        <div className="flex flex-col space-y-4">
          {/* Credit Score Header with Tabs */}
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h3 className="text-xl font-bold">Credit Score</h3>
              <span className="ml-2 text-sm text-gray-500">
                {selectedBureau === "allbureaus" ? "Your credit overview" : `Your credit is ${activeBureau?.rating?.toLowerCase?.() ?? ''}`}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center border rounded-lg px-3 py-1 gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Apr 24, 2013</span>
                <svg className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              
              {/* Credit Bureau Tabs */}
              <div className="flex border rounded-md overflow-hidden">
                <button 
                  className={`py-1 px-4 ${selectedBureau === 'transunion' ? 'bg-blue-500 text-white' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
                  onClick={() => setSelectedBureau('transunion')}
                >
                  TransUnion
                </button>
                <button 
                  className={`py-1 px-4 ${selectedBureau === 'equifax' ? 'bg-blue-500 text-white' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
                  onClick={() => setSelectedBureau('equifax')}
                >
                  Equifax
                </button>
                <button 
                  className={`py-1 px-4 ${selectedBureau === 'experian' ? 'bg-blue-500 text-white' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
                  onClick={() => setSelectedBureau('experian')}
                >
                  Experian
                </button>
                <button 
                  className={`py-1 px-4 ${selectedBureau === 'allbureaus' ? 'bg-blue-500 text-white' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
                  onClick={() => setSelectedBureau('allbureaus')}
                >
                  All bureaus
                </button>
              </div>
            </div>
          </div>

          {/* Credit Score Chart and Gauge */}
          {selectedBureau !== 'allbureaus' ? (
            <div className="flex mt-4">
              <div className="w-2/3 pr-6">
                {/* Credit Score Chart */}
                <div className="h-64 bg-white relative">
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gray-200"></div>
                  <div className="absolute inset-y-0 left-0 w-px bg-gray-200"></div>
                  
                  {/* Credit Score Line */}
                  <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path 
                      d={activeBureau.chartPath}
                      fill="none" 
                      stroke={activeBureau.chartColor}
                      strokeWidth="2"
                    />
                    <path 
                      d={activeBureau.chartPath}
                      fill={`${activeBureau.chartColor}15`}
                      strokeWidth="0"
                    />
                  </svg>
                  
                  {/* X-axis (months) */}
                  <div className="flex justify-between absolute bottom-0 inset-x-0 transform translate-y-4 px-2">
                    <span className="text-xs text-gray-500">October 02</span>
                    <span className="text-xs text-gray-500">October 03</span>
                    <span className="text-xs text-gray-500">October 04</span>
                    <span className="text-xs text-gray-500">October 05</span>
                    <span className="text-xs text-gray-500">October 06</span>
                    <span className="text-xs text-gray-500">October 07</span>
                  </div>
                  
                  {/* Score Marker */}
                  <div className={`absolute ${activeBureau.markerPosition.right} ${activeBureau.markerPosition.top} h-3 w-3 bg-${
                    selectedBureau === 'transunion' ? 'green' : 
                    selectedBureau === 'equifax' ? 'orange' : 
                    'yellow'
                  }-500 rounded-full`}></div>
                  
                  {/* Simplified Y-axis values */}
                  <div className="absolute left-2 top-0 text-xs text-gray-500">{activeBureau.yAxisMax}</div>
                  <div className="absolute left-2 top-1/4 text-xs text-gray-500">{Math.round(activeBureau.yAxisMax - (activeBureau.yAxisMax - activeBureau.yAxisMin) * 0.25)}</div>
                  <div className="absolute left-2 top-1/2 text-xs text-gray-500">{Math.round(activeBureau.yAxisMax - (activeBureau.yAxisMax - activeBureau.yAxisMin) * 0.5)}</div>
                  <div className="absolute left-2 top-3/4 text-xs text-gray-500">{Math.round(activeBureau.yAxisMax - (activeBureau.yAxisMax - activeBureau.yAxisMin) * 0.75)}</div>
                  <div className="absolute left-2 bottom-0 text-xs text-gray-500">{activeBureau.yAxisMin}</div>
                  
                  {/* Score indicator */}
                  <div className="absolute top-0 right-1/3 bg-white p-2 rounded shadow-md border text-center">
                    <div className="text-sm font-bold">{activeBureau.popupScore}</div>
                    <div className="text-xs text-gray-500">{activeBureau.popupRating}</div>
                  </div>
                </div>
              </div>
              
              <div className="w-1/3">
                {/* Credit Score Gauge */}
                <div className="flex flex-col items-center">
                  <div className="relative w-48 h-48">
                    {/* Simplified gauge visualization */}
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="50%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                      {/* Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="10"
                        strokeDasharray="280"
                        strokeDashoffset="0"
                      />
                      {/* Score indicator */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="10"
                        strokeDasharray="280"
                        strokeDashoffset={280 * (1 - ((activeBureau?.score ?? 300 - 300) / 550))} // Calculate offset based on score (300-850 range)
                        strokeLinecap="round"
                      />
                    </svg>
                    
                    {/* Score display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-4xl font-bold">{activeBureau?.score ?? ''}</div>
                      <div className="text-sm text-gray-600">Your credit rating</div>
                      <div className="text-sm font-medium">{activeBureau?.rating ?? ''}</div>
                    </div>
                  </div>
                  <div className="flex justify-between w-full mt-2 text-xs text-gray-500">
                    <span>300</span>
                    <span className="flex items-center">
                      VantageScore® 3.0
                      <InfoIcon className="h-3 w-3 ml-1" />
                    </span>
                    <span>850</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <div className="mb-4">
                <h4 className="text-lg font-semibold mb-2">Bureau Comparison</h4>
                <div className="grid grid-cols-3 gap-6">
                  {/* TransUnion Score */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium">TransUnion</div>
                      <div className="text-sm text-gray-600">Apr 24, 2013</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold">775</div>
                      <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Great</div>
                    </div>
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                  
                  {/* Equifax Score */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium">Equifax</div>
                      <div className="text-sm text-gray-600">Nov 1, 2024</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold">609</div>
                      <div className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">Fair</div>
                    </div>
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: '56%' }}></div>
                    </div>
                  </div>
                  
                  {/* Experian Score */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium">Experian</div>
                      <div className="text-sm text-gray-600">Oct 31, 2024</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold">688</div>
                      <div className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Good</div>
                    </div>
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '70%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                {/* TransUnion Mini Chart */}
                <div className="bg-white border rounded-lg p-3">
                  <div className="h-32 relative">
                    <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path 
                        d="M0,40 L10,20 L20,50 L30,70 L40,60 L50,50 L60,30 L70,20 L80,30 L90,20 L100,30" 
                        fill="none" 
                        stroke="#10b981" 
                        strokeWidth="2"
                      />
                      <path 
                        d="M0,40 L10,20 L20,50 L30,70 L40,60 L50,50 L60,30 L70,20 L80,30 L90,20 L100,30" 
                        fill="rgba(16, 185, 129, 0.1)"
                        strokeWidth="0"
                      />
                    </svg>
                    <div className="absolute top-0 right-0 bg-white p-1 rounded shadow-sm border text-xs">
                      842 <span className="text-gray-500">Excellent</span>
                    </div>
                  </div>
                </div>
                
                {/* Equifax Mini Chart */}
                <div className="bg-white border rounded-lg p-3">
                  <div className="h-32 relative">
                    <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path 
                        d="M0,30 L10,20 L20,25 L30,15 L40,20 L50,30 L60,25 L70,30 L80,25 L90,20 L100,25" 
                        fill="none" 
                        stroke="#f97316" 
                        strokeWidth="2"
                      />
                      <path 
                        d="M0,30 L10,20 L20,25 L30,15 L40,20 L50,30 L60,25 L70,30 L80,25 L90,20 L100,25" 
                        fill="rgba(249, 115, 22, 0.1)"
                        strokeWidth="0"
                      />
                    </svg>
                    <div className="absolute top-0 right-0 bg-white p-1 rounded shadow-sm border text-xs">
                      609 <span className="text-gray-500">Fair</span>
                    </div>
                  </div>
                </div>
                
                {/* Experian Mini Chart */}
                <div className="bg-white border rounded-lg p-3">
                  <div className="h-32 relative">
                    <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path 
                        d="M0,20 L10,25 L20,35 L30,15 L40,25 L50,20 L60,30 L70,15 L80,20 L90,10 L100,15" 
                        fill="none" 
                        stroke="#eab308" 
                        strokeWidth="2"
                      />
                      <path 
                        d="M0,20 L10,25 L20,35 L30,15 L40,25 L50,20 L60,30 L70,15 L80,20 L90,10 L100,15" 
                        fill="rgba(234, 179, 8, 0.1)"
                        strokeWidth="0"
                      />
                    </svg>
                    <div className="absolute top-0 right-0 bg-white p-1 rounded shadow-sm border text-xs">
                      688 <span className="text-gray-500">Good</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center mt-6">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md">
                  View Summary
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Property Listings Section */}
      <div className="bg-white rounded-lg border shadow p-6 mt-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Find Properties to Lease</h3>
          <Link 
            href="/dashboard/properties" 
            className="flex items-center text-blue-600 font-medium"
          >
            View all properties
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Property Card 1 */}
          <div className="rounded-lg overflow-hidden border shadow-sm">
            <div className="relative h-48">
              <Image 
                src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80" 
                alt="Apartment Building" 
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold">Modern Downtown Loft</h4>
                  <p className="text-gray-600 text-sm">$1,850/month • 2 beds • 2 baths</p>
                  <p className="text-gray-600 text-sm">Available: Immediately</p>
                </div>
                <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">New</div>
              </div>
            </div>
          </div>
          
          {/* Property Card 2 */}
          <div className="rounded-lg overflow-hidden border shadow-sm">
            <div className="relative h-48">
              <Image 
                src="https://images.unsplash.com/photo-1510784722466-f2aa9c52fff6?auto=format&fit=crop&q=80" 
                alt="Apartment Building" 
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold">Spacious Garden Apartment</h4>
                  <p className="text-gray-600 text-sm">$2,100/month • 3 beds • 1 bath</p>
                  <p className="text-gray-600 text-sm">Available: Nov 15, 2024</p>
                </div>
                <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Popular</div>
              </div>
            </div>
          </div>
          
          {/* Property Card 3 */}
          <div className="rounded-lg overflow-hidden border shadow-sm">
            <div className="relative h-48">
              <Image 
                src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80" 
                alt="Apartment Building" 
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold">Luxury High-Rise Condo</h4>
                  <p className="text-gray-600 text-sm">$2,850/month • 1 bed • 1.5 baths</p>
                  <p className="text-gray-600 text-sm">Available: Dec 1, 2024</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center mt-8">
          <Button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full">
            <Home className="w-5 h-5 mr-2" /> Find Your Next Home
          </Button>
        </div>
      </div>

      {/* Find Your Next Home Section */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Find Your Next Home</CardTitle>
            <CardDescription>
              Browse available properties and find your perfect place
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">
                  Explore our curated selection of houses and apartments
                </p>
              </div>
              <Link href="/properties">
                <Button>
                  <Search className="mr-2 h-4 w-4" />
                  Browse Properties
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification Modal */}
      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onComplete={completeOnboarding}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
      />
    </div>
  );
} 