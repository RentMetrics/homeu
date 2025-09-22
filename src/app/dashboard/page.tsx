"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, InfoIcon, Home, Search, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useUser } from '@clerk/nextjs';
import { useVerification } from '@/hooks/useVerification';
import { useUserSync } from '@/hooks/useUserSync';
import VerificationModal from '@/components/verification/VerificationModal';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { Badge } from '@/components/ui/badge';

// Helper function to calculate profile completeness
function getProfileCompleteness(profile: any): number {
  const fields = [
    'firstName', 'lastName', 'email', 'phoneNumber',
    'dateOfBirth', 'street', 'city', 'state', 'zipCode',
    'employer', 'position'
  ];

  const completedFields = fields.filter(field =>
    profile[field] && profile[field].toString().trim() !== ''
  ).length;

  return (completedFields / fields.length) * 100;
}

export default function DashboardPage() {
  const { user, userProfile, isLoaded, isAuthenticated } = useUserSync();
  const {
    verificationStatus,
    showVerificationModal,
    setShowVerificationModal,
    markStepComplete,
    completeOnboarding
  } = useVerification();
  
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
            Welcome {userProfile?.firstName || user?.firstName || 'User'}
            {userProfile?.verified ? (
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
            {userProfile?.verified
              ? "You're all set! Explore properties and manage your rentals."
              : "Complete your verification to unlock all features and faster rental approvals."
            }
          </p>
          {userProfile && (
            <div className="text-sm text-gray-400 mt-2">
              Profile completeness: {Math.round(getProfileCompleteness(userProfile))}%
            </div>
          )}
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