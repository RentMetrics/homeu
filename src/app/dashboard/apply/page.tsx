"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  MapPin,
  CheckCircle2,
  ArrowRight,
  FileText,
  AlertCircle,
  Home,
  User,
  DollarSign,
  Calendar
} from "lucide-react";
import { useUser } from "@clerk/nextjs";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function ApplyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const propertyId = searchParams.get('propertyId');

  // Query property details
  const property = useQuery(
    api.multifamilyproperties.getPropertyById,
    propertyId ? { propertyId: propertyId } : "skip"
  );

  // Query user's renter profile
  const renterProfile = useQuery(
    api.users.getUserProfile,
    isLoaded && user ? { userId: user.id } : "skip"
  );

  if (!propertyId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Property Selected</h3>
            <p className="text-muted-foreground mb-4">
              Please select a property to apply to.
            </p>
            <Button onClick={() => router.push('/dashboard/search')}>
              Browse Properties
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (property === undefined || renterProfile === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (property === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Property Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The property you're trying to apply to doesn't exist.
            </p>
            <Button onClick={() => router.push('/dashboard/search')}>
              Back to Search
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if profile is complete
  const profileComplete = renterProfile &&
    renterProfile.firstName &&
    renterProfile.lastName &&
    renterProfile.phoneNumber &&
    renterProfile.dateOfBirth &&
    renterProfile.street &&
    renterProfile.city &&
    renterProfile.state &&
    renterProfile.zipCode;

  const handleApply = () => {
    if (!profileComplete) {
      // Redirect to profile setup
      router.push('/setup?returnTo=/dashboard/apply&propertyId=' + propertyId);
    } else {
      // Redirect to full application
      router.push(`/dashboard/application?propertyId=${propertyId}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Apply to Property</h1>
        <p className="text-muted-foreground mt-2">
          Review the property details and complete your application
        </p>
      </div>

      {/* Property Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Property Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            {property.googleImageUrl ? (
              <img
                src={property.googleImageUrl}
                alt={property.propertyName}
                className="w-32 h-32 object-cover rounded-lg"
              />
            ) : (
              <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{property.propertyName}</h3>
              <div className="flex items-center text-muted-foreground mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{property.address}, {property.city}, {property.state} {property.zipCode}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Units:</span>
                  <span className="font-semibold ml-2">{property.totalUnits}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Avg Size:</span>
                  <span className="font-semibold ml-2">{property.averageUnitSize} sqft</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Status */}
      <Card className={profileComplete ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Your Profile Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profileComplete ? (
            <Alert className="bg-card border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Profile Complete!</strong> You're ready to submit your application.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-card border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Profile Incomplete.</strong> Please complete your profile before applying.
                <div className="mt-2 text-sm space-y-1">
                  {!renterProfile?.firstName && <div>• First Name</div>}
                  {!renterProfile?.lastName && <div>• Last Name</div>}
                  {!renterProfile?.phoneNumber && <div>• Phone Number</div>}
                  {!renterProfile?.dateOfBirth && <div>• Date of Birth</div>}
                  {!renterProfile?.street && <div>• Street Address</div>}
                  {!renterProfile?.city && <div>• City</div>}
                  {!renterProfile?.state && <div>• State</div>}
                  {!renterProfile?.zipCode && <div>• Zip Code</div>}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Application Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Application Process</CardTitle>
          <CardDescription>Here's what to expect when you apply</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <div className="font-semibold">Complete Your Profile</div>
                <div className="text-sm text-muted-foreground">
                  Provide your personal information, employment details, and income verification
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <div className="font-semibold">Submit Application</div>
                <div className="text-sm text-muted-foreground">
                  Review and submit your application to the property manager
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <div className="font-semibold">Background & Credit Check</div>
                <div className="text-sm text-muted-foreground">
                  Standard screening process (typically 24-48 hours)
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                4
              </div>
              <div>
                <div className="font-semibold">Get Approved & Sign Lease</div>
                <div className="text-sm text-muted-foreground">
                  Once approved, review and sign your lease agreement digitally
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/properties/${propertyId}`)}
          className="flex-1"
        >
          Back to Property
        </Button>
        <Button
          onClick={handleApply}
          className="flex-1"
          size="lg"
        >
          {profileComplete ? (
            <>
              Continue to Application
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Complete Profile First
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* Information Box */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Note:</strong> Your application will be securely stored and only shared with the property manager.
          You can track your application status in the "My Application" section of your dashboard.
        </AlertDescription>
      </Alert>
    </div>
  );
}
