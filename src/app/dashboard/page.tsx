"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, InfoIcon, Home, Search, AlertCircle, MapPin, Building2, Loader2, Gift, CreditCard, FileText } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useUser } from '@clerk/nextjs';
import { useVerification } from '@/hooks/useVerification';
import { useUserSync } from '@/hooks/useUserSync';
import VerificationModal from '@/components/verification/VerificationModal';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { Badge } from '@/components/ui/badge';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

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
  const [userLocation, setUserLocation] = useState<{ city: string; state: string } | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);

  // Get user display name with robust fallbacks
  const displayName = userProfile?.firstName || user?.firstName || user?.fullName?.split(' ')[0] || 'there';

  // Check if user needs onboarding
  useEffect(() => {
    if (user && isLoaded) {
      const onboardingComplete = user.unsafeMetadata?.onboardingComplete;
      const onboardingSeen = user.unsafeMetadata?.onboardingSeen;
      const localSeen = typeof window !== 'undefined' && localStorage.getItem('homeu_onboarding_seen');

      if (!onboardingComplete && !onboardingSeen && !localSeen) {
        setShowOnboardingModal(true);
      }
    }
  }, [user, isLoaded]);

  // Detect user location via browser geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(
            `/api/geocode?lat=${position.coords.latitude}&lng=${position.coords.longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.city && data.state) {
              setUserLocation({ city: data.city, state: data.state });
            }
          }
        } catch (error) {
          console.error("Geocoding error:", error);
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoLoading(false);
      },
      { timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  // Fallback: use user's profile address when geolocation fails or is denied
  useEffect(() => {
    if (!geoLoading && !userLocation && userProfile?.city?.trim() && userProfile?.state?.trim()) {
      setUserLocation({ city: userProfile.city, state: userProfile.state });
    }
  }, [geoLoading, userLocation, userProfile]);

  // Query nearby properties from Convex based on detected location
  const nearbyProperties = useQuery(
    api.multifamilyproperties.searchPropertiesByLocation,
    userLocation
      ? { city: userLocation.city, state: userLocation.state, limit: 6 }
      : "skip"
  );

  // State-level fallback when city search returns empty
  const stateProperties = useQuery(
    api.multifamilyproperties.searchPropertiesByLocation,
    userLocation && nearbyProperties !== undefined && nearbyProperties.length === 0
      ? { state: userLocation.state, limit: 6 }
      : "skip"
  );

  // Fallback: get some properties if location isn't available
  const fallbackProperties = useQuery(
    api.multifamilyproperties.getAllProperties,
    !userLocation && !geoLoading ? { limit: 6 } : "skip"
  );

  const displayProperties =
    (nearbyProperties && nearbyProperties.length > 0) ? nearbyProperties :
    (stateProperties && stateProperties.length > 0) ? stateProperties :
    fallbackProperties || [];

  // Fetch uploaded images for displayed properties (prioritize over Google)
  const displayPropertyIds = useMemo(
    () => displayProperties.map((p: any) => p.propertyId).filter(Boolean),
    [displayProperties]
  );
  const uploadedImagesArr = useQuery(
    api.propertyImages.getPrimaryImagesForProperties,
    displayPropertyIds.length > 0 ? { propertyIds: displayPropertyIds } : "skip"
  );
  const uploadedImages = useMemo(() => {
    const map: Record<string, string> = {};
    if (uploadedImagesArr) {
      for (const item of uploadedImagesArr) {
        if (item.url) map[item.propertyId] = item.url;
      }
    }
    return map;
  }, [uploadedImagesArr]);

  const isPropertiesLoading = geoLoading ||
    (userLocation && nearbyProperties === undefined) ||
    (userLocation && nearbyProperties !== undefined && nearbyProperties.length === 0 && stateProperties === undefined) ||
    (!userLocation && !geoLoading && fallbackProperties === undefined);

  // Get user's reward points for dashboard tile
  const userPoints = useQuery(
    api.rewards.getUserPoints,
    user?.id ? { userId: user.id } : "skip"
  );

  // Placeholder for lease data until Convex integration
  const leaseData = null;

  return (
    <div className="space-y-8">
      {/* Verification Status Banner */}
      {!verificationStatus.isVerified && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium text-orange-800">Complete Your Profile</h3>
                <p className="text-sm text-orange-700">
                  Become a verified renter to unlock all HomeU features and faster rental approvals.
                </p>
              </div>
              <Button
                onClick={() => setShowOnboardingModal(true)}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 shrink-0"
              >
                Complete Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Welcome Section */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200 relative">
            <Image
              src={user?.imageUrl || "/default-avatar.png"}
              alt="Profile"
              fill
              className="object-cover"
            />
          </div>
          <div className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
            verificationStatus.isVerified ? 'bg-green-500' : 'bg-orange-500'
          }`}></div>
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold flex items-center gap-2 flex-wrap">
            Welcome, {displayName}
            {userProfile?.verified ? (
              <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                <svg className="h-3.5 w-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="border-orange-200 text-orange-700 text-xs">
                <AlertCircle className="h-3.5 w-3.5 mr-1" />
                Unverified
              </Badge>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {userProfile?.verified
              ? "You're all set! Explore properties and manage your rentals."
              : "Complete your verification to unlock all features."
            }
          </p>
          {userProfile && (
            <div className="mt-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 max-w-[200px] h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${Math.round(getProfileCompleteness(userProfile))}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{Math.round(getProfileCompleteness(userProfile))}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Rewards Card */}
        <Link href="/dashboard/rewards" className="block">
          <div className="p-6 bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100">
                <Gift className="h-6 w-6 text-blue-600" />
              </div>
              {userPoints && (
                <span className="text-2xl font-bold text-blue-600">{userPoints.points} pts</span>
              )}
            </div>
            <h3 className="text-lg font-bold mb-1">Rewards</h3>
            <p className="text-gray-500 text-sm mb-4">
              {userPoints
                ? `You have ${userPoints.points} points. Redeem for rewards!`
                : "Earn points for rent payments and referrals"}
            </p>
            <span className="flex items-center text-blue-600 font-medium text-sm">
              {userPoints && userPoints.points > 0 ? "View Rewards" : "Get More Points"} <ArrowRight className="h-4 w-4 ml-1" />
            </span>
          </div>
        </Link>

        {/* Payments Card */}
        <Link href="/dashboard/payments" className="block">
          <div className="p-6 bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow h-full">
            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-100 mb-4">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold mb-1">Payments</h3>
            <p className="text-gray-500 text-sm mb-4">Total Due: $2,000.00</p>
            <span className="flex items-center text-green-600 font-medium text-sm">
              View Statement <ArrowRight className="h-4 w-4 ml-1" />
            </span>
          </div>
        </Link>

        {/* Lease Card */}
        <Link href="/lease" className="block">
          <div className="p-6 bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow h-full">
            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-purple-100 mb-4">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold mb-1">Lease</h3>
            <p className="text-gray-500 text-sm mb-4">
              {!leaseData ? "Submit your lease to manage and view highlights." : "View your lease details."}
            </p>
            <span className="flex items-center text-purple-600 font-medium text-sm">
              {!leaseData ? "Get Started" : "Manage Lease"} <ArrowRight className="h-4 w-4 ml-1" />
            </span>
          </div>
        </Link>
      </div>

      {/* Nearby Property Listings Section */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold">Properties Near You</h3>
            {userLocation && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {nearbyProperties && nearbyProperties.length > 0
                  ? `${userLocation.city}, ${userLocation.state}`
                  : userLocation.state}
              </p>
            )}
          </div>
          <Link
            href="/properties"
            className="flex items-center text-blue-600 font-medium text-sm"
          >
            View all <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {isPropertiesLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            {geoLoading ? 'Detecting your location...' : 'Loading properties...'}
          </div>
        ) : displayProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayProperties.slice(0, 6).map((property: any) => {
              // Prioritize uploaded images over Google Places photos
              const uploadedImg = uploadedImages[property.propertyId];
              const googleImg = (property.propertyName && property.city && property.state)
                ? `/api/places-photo?query=${encodeURIComponent(`${property.propertyName} apartments ${property.city} ${property.state}`)}&maxwidth=600`
                : null;
              const imgSrc = uploadedImg || googleImg;

              return (
                <div key={property._id} className="rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative h-44">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={property.propertyName || "Property"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const placeholder = target.nextElementSibling as HTMLElement;
                          if (placeholder) placeholder.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center ${imgSrc ? 'hidden' : ''}`}>
                      <Building2 className="h-10 w-10 text-blue-300 mb-2" />
                      <span className="text-xs text-blue-400 font-medium">{property.totalUnits} Units</span>
                    </div>
                    {property.googleRating && (
                      <div className="absolute top-2 left-2 bg-white/90 rounded-full px-2 py-0.5 text-xs font-medium flex items-center gap-1">
                        <span className="text-yellow-500">★</span> {property.googleRating}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-sm truncate">{property.propertyName || "Property"}</h4>
                    <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {property.city}, {property.state}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {property.totalUnits} units · Built {property.yearBuilt}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Building2 className="h-10 w-10 mx-auto mb-2" />
            <p className="text-sm">No properties found nearby. Try browsing all properties.</p>
          </div>
        )}

        <div className="flex justify-center mt-8">
          <Link href="/properties">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full">
              <Home className="w-5 h-5 mr-2" /> Find Your Next Home
            </Button>
          </Link>
        </div>
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
