"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Building2,
  MapPin,
  Star,
  Calendar,
  Users,
  Square,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  Home,
  Target,
  Lightbulb,
  ChevronRight
} from "lucide-react";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Helper function to calculate rent analysis
function calculateRentAnalysis(property: any) {
  const analysis = {
    marketCondition: "neutral",
    negotiationPower: 50, // 0-100 scale
    recommendedStrategy: "",
    dealScore: 70, // 0-100 scale
    insights: [] as string[],
    negotiationTips: [] as string[],
  };

  // Analyze occupancy rate
  const occupancy = property.occupancyRate || 85;
  if (occupancy < 80) {
    analysis.marketCondition = "favorable";
    analysis.negotiationPower = 75;
    analysis.insights.push("🟢 Low occupancy gives you strong negotiating power");
    analysis.negotiationTips.push("Ask for 1 month free rent or reduced security deposit");
    analysis.negotiationTips.push("Request flexible lease terms (6-month option)");
    analysis.dealScore += 15;
  } else if (occupancy > 95) {
    analysis.marketCondition = "competitive";
    analysis.negotiationPower = 25;
    analysis.insights.push("🔴 High demand limits negotiation room");
    analysis.negotiationTips.push("Act quickly - units are in high demand");
    analysis.negotiationTips.push("Be prepared to pay asking price");
    analysis.dealScore -= 10;
  } else {
    analysis.marketCondition = "balanced";
    analysis.negotiationPower = 50;
    analysis.insights.push("🟡 Moderate occupancy - some room to negotiate");
    analysis.negotiationTips.push("Try negotiating move-in costs or amenities");
    analysis.negotiationTips.push("Ask about seasonal promotions");
  }

  // Analyze property age
  const age = new Date().getFullYear() - (property.yearBuilt || 2000);
  if (age > 30) {
    analysis.insights.push("⚠️ Older property may have maintenance issues");
    analysis.negotiationTips.push("Request recent renovation history");
    analysis.dealScore -= 5;
  } else if (age < 5) {
    analysis.insights.push("✨ Recently built with modern amenities");
    analysis.dealScore += 10;
  }

  // Analyze rating
  const rating = property.googleRating || 0;
  if (rating && rating < 3.0) {
    analysis.insights.push("⚠️ Low resident satisfaction - investigate reviews");
    analysis.negotiationTips.push("Use negative reviews as leverage in negotiations");
    analysis.dealScore -= 15;
  } else if (rating >= 4.0) {
    analysis.insights.push("⭐ High resident satisfaction");
    analysis.dealScore += 5;
  }

  // Generate recommended strategy
  if (analysis.negotiationPower >= 70) {
    analysis.recommendedStrategy = "Strong Negotiator Position";
  } else if (analysis.negotiationPower >= 50) {
    analysis.recommendedStrategy = "Balanced Approach";
  } else {
    analysis.recommendedStrategy = "Quick Decision Required";
  }

  // Cap deal score
  analysis.dealScore = Math.max(0, Math.min(100, analysis.dealScore));

  return analysis;
}

// Helper function to get score color
function getScoreColor(score: number) {
  if (score >= 90) return "bg-green-100 text-green-800 border-green-300";
  if (score >= 80) return "bg-blue-100 text-blue-800 border-blue-300";
  if (score >= 70) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-muted text-foreground border-gray-300";
}

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.propertyId as string;

  // Query property details
  const property = useQuery(api.multifamilyproperties.getPropertyById, {
    propertyId: propertyId,
  });

  // Query uploaded images for this property (prioritize over Google)
  const propertyImages = useQuery(
    api.propertyImages.getImagesByProperty,
    propertyId ? { propertyId } : "skip"
  );
  const primaryImage = propertyImages?.find((img: any) => img.isPrimary) || propertyImages?.[0];

  // Calculate rent analysis
  const rentAnalysis = property ? calculateRentAnalysis(property) : null;

  if (property === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-96 w-full" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
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
              The property you're looking for doesn't exist.
            </p>
            <Button onClick={() => router.push('/dashboard/search')}>
              Back to Search
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Search
      </Button>

      {/* Hero Section */}
      <Card className="overflow-hidden">
        <div className="relative h-96">
          {primaryImage?.url ? (
            <img
              src={primaryImage.url}
              alt={property.propertyName}
              className="h-full w-full object-cover"
            />
          ) : property.googleImageUrl ? (
            <>
              <img
                src={property.googleImageUrl}
                alt={property.propertyName}
                className="h-full w-full object-cover"
              />
              {property.googleAttributionRequired && (
                <div className="absolute bottom-4 right-4 bg-card/90 px-3 py-1.5 rounded text-sm flex items-center gap-2 shadow-lg">
                  <span className="text-muted-foreground">Photo:</span>
                  <span className="font-semibold text-blue-600">Google</span>
                </div>
              )}
            </>
          ) : (property.propertyName && property.city && property.state) ? (
            <img
              src={`/api/places-photo?query=${encodeURIComponent(`${property.propertyName} apartments ${property.city} ${property.state}`)}&maxwidth=800`}
              alt={property.propertyName}
              className="h-full w-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const placeholder = target.nextElementSibling as HTMLElement;
                if (placeholder) placeholder.style.display = 'flex';
              }}
            />
          ) : null}
          <div className={`h-full bg-gradient-to-br from-blue-100 to-purple-100 items-center justify-center ${primaryImage?.url || property.googleImageUrl || (property.propertyName && property.city && property.state) ? 'hidden' : 'flex'}`}>
            <Building2 className="h-24 w-24 text-muted-foreground" />
          </div>

          {/* Badges Overlay */}
          <div className="absolute top-4 right-4 flex gap-2">
            {property.googleRating && (
              <Badge className="bg-card/90 text-foreground flex items-center gap-1 text-base py-1 px-3">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {property.googleRating.toFixed(1)}
              </Badge>
            )}
            {property.homeuScore && (
              <Badge className={`${getScoreColor(property.homeuScore)} border text-base py-1 px-3`}>
                <Home className="h-4 w-4 mr-1" />
                {property.homeuScore}
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold">{property.propertyName}</h1>
              <div className="flex items-center text-muted-foreground mt-2">
                <MapPin className="h-5 w-5 mr-2" />
                <span className="text-lg">
                  {property.address}, {property.city}, {property.state} {property.zipCode}
                </span>
              </div>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{property.totalUnits}</div>
                  <div className="text-sm text-muted-foreground">Units</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{property.yearBuilt}</div>
                  <div className="text-sm text-muted-foreground">Built</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Square className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{property.averageUnitSize}</div>
                  <div className="text-sm text-muted-foreground">Avg Sqft</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{property.occupancyRate || 85}%</div>
                  <div className="text-sm text-muted-foreground">Occupied</div>
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <div className="pt-4">
              <Button size="lg" className="w-full md:w-auto" onClick={() => router.push(`/dashboard/apply?propertyId=${propertyId}`)}>
                <ExternalLink className="h-5 w-5 mr-2" />
                Apply to This Property
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Rent Analysis */}
      {rentAnalysis && (
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              AI Rent Analysis & Negotiation Strategy
            </CardTitle>
            <CardDescription>
              Powered by HomeU's proprietary algorithm analyzing market conditions, occupancy, and property data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Deal Score */}
            <div className="flex items-center justify-between p-4 bg-card rounded-lg border-2 border-purple-300">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-sm text-muted-foreground">Deal Score</div>
                  <div className="text-3xl font-bold text-purple-600">{rentAnalysis.dealScore}/100</div>
                </div>
              </div>
              <Badge className={getScoreColor(rentAnalysis.dealScore)} variant="outline">
                {rentAnalysis.dealScore >= 80 ? "Excellent Deal" : rentAnalysis.dealScore >= 70 ? "Good Deal" : "Fair Deal"}
              </Badge>
            </div>

            {/* Market Condition */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <div className="font-semibold mb-1">Market Condition</div>
                      <div className="text-2xl font-bold capitalize">{rentAnalysis.marketCondition}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Based on {property.occupancyRate || 85}% occupancy rate
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-green-600 mt-1" />
                    <div>
                      <div className="font-semibold mb-1">Your Negotiation Power</div>
                      <div className="text-2xl font-bold">{rentAnalysis.negotiationPower}%</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {rentAnalysis.recommendedStrategy}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Insights */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <h3 className="font-semibold">Key Insights</h3>
              </div>
              <div className="space-y-2">
                {rentAnalysis.insights.map((insight, index) => (
                  <Alert key={index}>
                    <AlertDescription className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{insight}</span>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>

            {/* Negotiation Tips */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Recommended Negotiation Tactics</h3>
              </div>
              <div className="space-y-2">
                {rentAnalysis.negotiationTips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-card rounded-lg border">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <span className="text-sm">{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                This analysis is generated by AI based on available data and should be used as guidance only.
                Actual negotiation outcomes may vary based on specific circumstances and market conditions.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Amenities */}
      {property.amenities && property.amenities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((amenity: string) => (
                <Badge key={amenity} variant="secondary" className="text-sm py-1 px-3">
                  {amenity}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Property Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Property ID</div>
              <div className="font-mono">{property.propertyId}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Year Built</div>
              <div>{property.yearBuilt}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Units</div>
              <div>{property.totalUnits} units</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Average Unit Size</div>
              <div>{property.averageUnitSize} sqft</div>
            </div>
          </div>

          {property.googleFormattedAddress && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">Full Address</div>
              <div>{property.googleFormattedAddress}</div>
            </div>
          )}

          {property.googleUserRatingsTotal && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">Google Reviews</div>
              <div>{property.googleUserRatingsTotal} reviews</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
