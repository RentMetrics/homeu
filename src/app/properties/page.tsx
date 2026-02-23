'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Home, Building2, SlidersHorizontal, Star, MapPin, Calendar, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import Link from "next/link";

// Force dynamic rendering to prevent SSR issues with Convex
export const dynamic = 'force-dynamic';

// Helper function to get score color
const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 70) return 'text-yellow-600';
  return 'text-gray-600';
};

// Helper function to get score rating
const getScoreRating = (score: number) => {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Great';
  if (score >= 70) return 'Good';
  return 'Fair';
};

// Helper function to parse search query for city and state
const parseSearchQuery = (query: string) => {
  const trimmed = query.trim();

  // Check for "City, State" format
  const cityStateMatch = trimmed.match(/^(.+?),\s*([A-Za-z]{2})$/);
  if (cityStateMatch) {
    return {
      city: cityStateMatch[1].trim(),
      state: cityStateMatch[2].trim().toUpperCase()
    };
  }

  // Check for just state (2 letter code)
  const stateMatch = trimmed.match(/^[A-Za-z]{2}$/);
  if (stateMatch) {
    return {
      city: undefined,
      state: trimmed.toUpperCase()
    };
  }

  // Check for full state name
  const stateNames: { [key: string]: string } = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
    'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
    'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
    'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
    'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
    'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
    'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
    'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
  };

  const lowerQuery = trimmed.toLowerCase();
  if (stateNames[lowerQuery]) {
    return {
      city: undefined,
      state: stateNames[lowerQuery]
    };
  }

  // If no specific pattern, treat as city search
  return {
    city: trimmed,
    state: undefined
  };
};

export default function PropertiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [yearBuiltFilter, setYearBuiltFilter] = useState('all');
  const [minUnitsFilter, setMinUnitsFilter] = useState('all');
  const [geoLoaded, setGeoLoaded] = useState(false);

  // Debounce search query to prevent re-querying on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-detect user location and pre-fill search
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoLoaded(true);
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
              const loc = `${data.city}, ${data.state}`;
              setSearchQuery(loc);
              setDebouncedQuery(loc);
            }
          }
        } catch (error) {
          console.error("Geocoding error:", error);
        } finally {
          setGeoLoaded(true);
        }
      },
      () => setGeoLoaded(true),
      { timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  // Parse the debounced search query (not the live input)
  const { city, state } = parseSearchQuery(debouncedQuery);

  // Get properties from Convex using the efficient location-based search
  const searchResult = useQuery(api.multifamilyproperties.searchPropertiesByLocation, {
    city: city || undefined,
    state: state || undefined,
    limit: 100
  });

  // State-level fallback when city+state search returns empty
  const stateResult = useQuery(
    api.multifamilyproperties.searchPropertiesByLocation,
    city && state && searchResult !== undefined && searchResult.length === 0
      ? { state: state, limit: 100 }
      : "skip"
  );

  // Use state results as fallback
  const effectiveResult = (searchResult && searchResult.length > 0) ? searchResult :
    (stateResult && stateResult.length > 0) ? stateResult : searchResult;

  // Filter properties based on additional criteria
  const filteredProperties = effectiveResult?.filter((property: any) => {
    if (!property) return false;

    const matchesYearBuilt = yearBuiltFilter === 'all' ||
      (yearBuiltFilter === 'new' && property.yearBuilt >= 2020) ||
      (yearBuiltFilter === 'recent' && property.yearBuilt >= 2010 && property.yearBuilt < 2020) ||
      (yearBuiltFilter === 'older' && property.yearBuilt < 2010);

    const matchesMinUnits = minUnitsFilter === 'all' ||
      (minUnitsFilter === 'small' && property.totalUnits < 50) ||
      (minUnitsFilter === 'medium' && property.totalUnits >= 50 && property.totalUnits < 200) ||
      (minUnitsFilter === 'large' && property.totalUnits >= 200);

    return matchesYearBuilt && matchesMinUnits;
  }) || [];

  // Fetch uploaded images for displayed properties (prioritize over Google)
  const filteredPropertyIds = useMemo(
    () => filteredProperties.map((p: any) => p.propertyId).filter(Boolean),
    [filteredProperties]
  );
  const uploadedImagesArr = useQuery(
    api.propertyImages.getPrimaryImagesForProperties,
    filteredPropertyIds.length > 0 ? { propertyIds: filteredPropertyIds } : "skip"
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

  // Show loading state while data is being fetched or geo is detecting
  const isLoading = !geoLoaded || searchResult === undefined ||
    (city && state && searchResult !== undefined && searchResult.length === 0 && stateResult === undefined);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-500">{!geoLoaded ? 'Detecting your location...' : 'Loading properties...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Properties</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} found
            {searchQuery && <span> for &quot;{searchQuery}&quot;</span>}
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      {/* Search Section */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by city, state, or property name (e.g., 'Salt Lake City, UT')"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <Select value={yearBuiltFilter} onValueChange={setYearBuiltFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Year Built" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="new">2020+ (New)</SelectItem>
              <SelectItem value="recent">2010-2019 (Recent)</SelectItem>
              <SelectItem value="older">Pre-2010 (Older)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={minUnitsFilter} onValueChange={setMinUnitsFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Property Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sizes</SelectItem>
              <SelectItem value="small">Small (&lt;50 units)</SelectItem>
              <SelectItem value="medium">Medium (50-199 units)</SelectItem>
              <SelectItem value="large">Large (200+ units)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Property Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property: any) => {
          // Prioritize uploaded images over Google Places photos
          const uploadedImg = uploadedImages[property.propertyId];
          const googleImg = (property.propertyName && property.city && property.state)
            ? `/api/places-photo?query=${encodeURIComponent(`${property.propertyName} apartments ${property.city} ${property.state}`)}&maxwidth=600`
            : null;
          const imgSrc = uploadedImg || googleImg;

          return (
            <Card key={property._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48">
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={property.propertyName || 'Property'}
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
                  <span className="text-xs text-blue-400 font-medium">{property.totalUnits || 0} Units</span>
                </div>
                <Badge className="absolute top-2 right-2">
                  {property.totalUnits || 0} units
                </Badge>
                {property.googleRating && (
                  <div className="absolute top-2 left-2 bg-white/90 rounded-full px-2 py-1 flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{property.googleRating}</span>
                  </div>
                )}
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{property.propertyName || 'Unnamed Property'}</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-sm">
                      <MapPin className="h-4 w-4" />
                      {property.city || 'Unknown City'}, {property.state || 'Unknown State'}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1">
                      <Star className={`h-5 w-5 ${getScoreColor(property.homeuScore || 0)}`} />
                      <span className={`text-lg font-bold ${getScoreColor(property.homeuScore || 0)}`}>
                        {property.homeuScore || 'N/A'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {property.homeuScore ? getScoreRating(property.homeuScore) : 'Not rated'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      <span>{property.totalUnits || 0} units</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{property.yearBuilt || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <SlidersHorizontal className="h-4 w-4" />
                      <span>{property.averageUnitSize || 0} sqft avg</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{property.address || 'Address not available'}</p>
                  {property.amenities && property.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.slice(0, 3).map((amenity: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {amenity}
                        </Badge>
                      ))}
                      {property.amenities.length > 3 && (
                        <Badge variant="secondary">+{property.amenities.length - 3} more</Badge>
                      )}
                    </div>
                  )}
                  {property.scoreFactors && property.scoreFactors.length > 0 && (
                    <div className="mt-2 text-sm text-gray-500">
                      <p className="font-medium">HomeU AI Score Factors:</p>
                      <ul className="list-disc list-inside">
                        {property.scoreFactors.slice(0, 2).map((factor: string, index: number) => (
                          <li key={index}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/dashboard/properties/${property.propertyId}`} className="w-full">
                  <Button className="w-full">View Details</Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {filteredProperties.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No properties found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search. You can search by city, state, or property name.
          </p>
          {searchQuery && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setSearchQuery('')}
            >
              Clear Search
            </Button>
          )}
        </div>
      )}

      {filteredProperties.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-500">
          Showing {filteredProperties.length} properties
          {searchQuery && <span> for &quot;{searchQuery}&quot;</span>}
        </div>
      )}
    </div>
  );
}
