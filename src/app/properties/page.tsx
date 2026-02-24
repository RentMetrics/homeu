'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Building2, SlidersHorizontal, Star, MapPin, Calendar, Loader2, ChevronDown } from 'lucide-react';
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
import { usePaginatedQuery, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import Link from "next/link";
import { useUserSync } from '@/hooks/useUserSync';
import { DealScoreBadge } from '@/components/market/DealScoreBadge';
import { LeverageBadge } from '@/components/market/LeverageBadge';

// Force dynamic rendering to prevent SSR issues with Convex
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 12;

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

// Title-case a string: "salt lake city" → "Salt Lake City"
const titleCase = (str: string) =>
  str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// Helper function to parse search query for city and state
const parseSearchQuery = (query: string) => {
  const trimmed = query.trim();

  // Check for "City, State" format
  const cityStateMatch = trimmed.match(/^(.+?),\s*([A-Za-z]{2})$/);
  if (cityStateMatch) {
    return {
      city: titleCase(cityStateMatch[1].trim()),
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
    city: titleCase(trimmed),
    state: undefined
  };
};

// Color palette for property card placeholders
const PLACEHOLDER_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-pink-500",
  "from-emerald-500 to-teal-600",
  "from-orange-400 to-rose-500",
  "from-cyan-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-teal-400 to-emerald-500",
  "from-rose-400 to-pink-600",
];

// Concurrency limiter: max 3 photo fetches at once
let activeRequests = 0;
const pendingQueue: (() => void)[] = [];
const MAX_CONCURRENT = 3;

function acquireSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT) {
    activeRequests++;
    return Promise.resolve();
  }
  return new Promise((resolve) => pendingQueue.push(resolve));
}

function releaseSlot() {
  activeRequests--;
  const next = pendingQueue.shift();
  if (next) { activeRequests++; next(); }
}

// Lazy property image: only fetches when card scrolls into view
function LazyPropertyImage({ property, index }: { property: any; index: number }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasFetched.current) {
          hasFetched.current = true;
          observer.disconnect();
          fetchImage();
        }
      },
      { rootMargin: "200px" } // start fetching 200px before visible
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fetchImage = async () => {
    if (!property.propertyName && !property.city) { setFailed(true); return; }
    setLoading(true);
    const q = `${property.propertyName || ''} apartments ${property.city || ''} ${property.state || ''}`.trim();
    try {
      await acquireSlot();
      const res = await fetch(`/api/places-photo?query=${encodeURIComponent(q)}&maxwidth=600`);
      releaseSlot();
      if (!res.ok || !res.headers.get('content-type')?.startsWith('image')) { setFailed(true); return; }
      const blob = await res.blob();
      setImgUrl(URL.createObjectURL(blob));
    } catch {
      releaseSlot();
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const gradient = PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length];
  const initials = (property.propertyName || "AP")
    .split(" ")
    .filter((w: string) => w.length > 0)
    .slice(0, 2)
    .map((w: string) => w[0].toUpperCase())
    .join("");

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {imgUrl ? (
        <img
          src={imgUrl}
          alt={property.propertyName || 'Property'}
          className="w-full h-full object-cover"
          onError={() => { setImgUrl(null); setFailed(true); }}
        />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center`}>
          {loading ? (
            <Loader2 className="h-8 w-8 text-white/70 animate-spin" />
          ) : (
            <>
              <div className="text-white/90 text-3xl font-bold tracking-wider">{initials}</div>
              <span className="text-white/70 text-xs font-medium mt-1">{property.totalUnits || 0} Units</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function PropertiesPage() {
  const { userProfile } = useUserSync();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [yearBuiltFilter, setYearBuiltFilter] = useState('all');
  const [minUnitsFilter, setMinUnitsFilter] = useState('all');
  const [geoLoaded, setGeoLoaded] = useState(false);
  const [profileFallbackApplied, setProfileFallbackApplied] = useState(false);

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
      { timeout: 3000, maximumAge: 300000 }
    );
  }, []);

  // Fallback: use user's profile city/state when geolocation fails
  useEffect(() => {
    if (geoLoaded && !searchQuery && !profileFallbackApplied && userProfile?.city?.trim() && userProfile?.state?.trim()) {
      const loc = `${userProfile.city}, ${userProfile.state}`;
      setSearchQuery(loc);
      setDebouncedQuery(loc);
      setProfileFallbackApplied(true);
    }
  }, [geoLoaded, searchQuery, profileFallbackApplied, userProfile]);

  // Parse the debounced search query (not the live input)
  const { city, state } = parseSearchQuery(debouncedQuery);

  // Paginated query — loads PAGE_SIZE at a time
  // When no search criteria, shows all properties
  const { results, status, loadMore } = usePaginatedQuery(
    api.multifamilyproperties.searchPropertiesPaginated,
    { city: city || undefined, state: state || undefined },
    { initialNumItems: PAGE_SIZE }
  );

  // Filter properties based on additional criteria
  const filteredProperties = (results ?? []).filter((property: any) => {
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
  });

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

  // Fetch market stats once for the searched location (avoids N+1 per badge)
  const currentMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);
  const cityMarketStats = useQuery(
    api.marketStats.getMarketStats,
    city && state ? { city, state, month: currentMonth } : "skip"
  );
  const stateMarketStats = useQuery(
    api.marketStats.getStateMarketStats,
    state && !cityMarketStats ? { state, month: currentMonth } : "skip"
  );
  const marketStats = cityMarketStats ?? stateMarketStats ?? null;

  // Loading states
  const isSearching = status === "LoadingFirstPage";
  const isLoadingMore = status === "LoadingMore";
  const canLoadMore = status === "CanLoadMore";

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Properties</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isSearching
              ? 'Searching...'
              : <>{filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} found
                {searchQuery && <span> for &quot;{searchQuery}&quot;</span>}
                {canLoadMore && <span className="text-blue-500"> (more available)</span>}</>
            }
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
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
              )}
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
      {isSearching && filteredProperties.length === 0 && (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Loading properties...</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property: any, index: number) => {
          const uploadedImg = uploadedImages[property.propertyId];

          return (
            <Card key={property._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48">
                {uploadedImg ? (
                  <img
                    src={uploadedImg}
                    alt={property.propertyName || 'Property'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <LazyPropertyImage property={property} index={index} />
                )}
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
              <CardFooter className="flex flex-col gap-2">
                <div className="w-full flex justify-start gap-2 flex-wrap">
                  <DealScoreBadge propertyId={property.propertyId} property={property} marketStats={marketStats} />
                  <LeverageBadge propertyId={property.propertyId} property={property} marketStats={marketStats} />
                </div>
                <a
                  href={`/properties/${property.propertyId}`}
                  className="w-full inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-9 px-4 py-2 text-sm font-medium transition-all"
                >
                  View Details
                </a>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Load More Button */}
      {(canLoadMore || isLoadingMore) && (
        <div className="mt-10 mb-4 flex flex-col items-center gap-3">
          <div className="w-full max-w-md border-t border-gray-200" />
          <p className="text-sm text-gray-400">
            Showing {filteredProperties.length} properties
          </p>
          <Button
            onClick={() => loadMore(PAGE_SIZE)}
            disabled={isLoadingMore}
            size="lg"
            className="min-w-[280px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading more...
              </>
            ) : (
              <>
                Load More Properties
                <ChevronDown className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}

      {filteredProperties.length === 0 && !isSearching && status === "Exhausted" && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No properties found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No properties found for &quot;{searchQuery}&quot;. Try a different city or state.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearchQuery('');
              setDebouncedQuery('');
            }}
          >
            Clear Search
          </Button>
        </div>
      )}

      {filteredProperties.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-500">
          Showing {filteredProperties.length} properties
          {searchQuery && <span> for &quot;{searchQuery}&quot;</span>}
          {status === "Exhausted" && <span> (all loaded)</span>}
        </div>
      )}
    </div>
  );
}
