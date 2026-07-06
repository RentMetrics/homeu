"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  MapPin,
  Star,
  Calendar,
  Users,
  Square,
  TrendingUp,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Home,
} from "lucide-react";
import { MarketAnalysisPanel } from "@/components/market/MarketAnalysisPanel";
import { PropertyScoreCard, PropertyScoreBadge } from "@/components/scores/PropertyScoreCard";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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
            <PropertyScoreBadge propertyId={propertyId} />
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
                  <div className="text-2xl font-bold">{(property as { occupancyRate?: number }).occupancyRate || 85}%</div>
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

      {/* Market Intelligence Analysis */}
      <PropertyScoreCard propertyId={propertyId} />

      <MarketAnalysisPanel propertyId={propertyId} />

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
