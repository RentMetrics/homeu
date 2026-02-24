"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
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

export const dynamic = 'force-dynamic';

function getScoreColor(score: number) {
  if (score >= 90) return "bg-green-100 text-green-800 border-green-300";
  if (score >= 80) return "bg-blue-100 text-blue-800 border-blue-300";
  if (score >= 70) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-muted text-foreground border-gray-300";
}

function HeroImage({ property, primaryImageUrl }: { property: any; primaryImageUrl?: string }) {
  const [placesUrl, setPlacesUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (primaryImageUrl || property.googleImageUrl) return;
    if (!property.propertyName && !property.city) return;
    const query = `${property.propertyName || ''} apartments ${property.city || ''} ${property.state || ''}`.trim();
    let cancelled = false;
    fetch(`/api/places-photo?query=${encodeURIComponent(query)}&maxwidth=800`)
      .then((res) => {
        if (!res.ok || !res.headers.get('content-type')?.startsWith('image')) throw new Error();
        return res.blob();
      })
      .then((blob) => { if (!cancelled) setPlacesUrl(URL.createObjectURL(blob)); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [property.propertyName, property.city, property.state, property.googleImageUrl, primaryImageUrl]);

  const imgSrc = primaryImageUrl || property.googleImageUrl || placesUrl;
  if (!imgSrc || failed) {
    return (
      <div className="h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
        <Building2 className="h-24 w-24 text-muted-foreground" />
      </div>
    );
  }
  return (
    <img src={imgSrc} alt={property.propertyName} className="h-full w-full object-cover" onError={() => setFailed(true)} />
  );
}

export default function PublicPropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.propertyId as string;

  const property = useQuery(api.multifamilyproperties.getPropertyById, {
    propertyId,
  });

  const propertyImages = useQuery(
    api.propertyImages.getImagesByProperty,
    propertyId ? { propertyId } : "skip"
  );
  const primaryImage = propertyImages?.find((img: any) => img.isPrimary) || propertyImages?.[0];

  if (property === undefined) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-96 w-full rounded-xl" />
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
              The property you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button onClick={() => router.push('/properties')}>
              Back to Properties
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Properties
      </Button>

      {/* Hero Section */}
      <Card className="overflow-hidden">
        <div className="relative h-96">
          <HeroImage property={property} primaryImageUrl={primaryImage?.url} />

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
