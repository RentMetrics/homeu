"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Search, Home, Building2, Star, MapPin, DollarSign, Bed, Bath, Square, Users, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// Force dynamic rendering to prevent SSR issues with Convex
export const dynamic = 'force-dynamic';

// US States for dropdown
const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

export default function SearchPage() {
  const [searchCity, setSearchCity] = useState("");
  const [searchState, setSearchState] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [minUnits, setMinUnits] = useState<number | null>(null);
  const [yearBuiltRange, setYearBuiltRange] = useState<[number, number]>([1900, new Date().getFullYear()]);

  // Query properties from Convex
  const properties = useQuery(api.multifamilyproperties.searchPropertiesByLocation, {
    city: searchCity || undefined,
    state: searchState === "all" ? undefined : searchState || undefined,
    limit: 100
  });

  // Filter properties based on additional criteria
  const filteredProperties = properties?.filter((property: any) => {
    // Filter by year built
    if (property.yearBuilt < yearBuiltRange[0] || property.yearBuilt > yearBuiltRange[1]) {
      return false;
    }
    
    // Filter by minimum units
    if (minUnits && property.totalUnits < minUnits) {
      return false;
    }
    
    return true;
  }) || [];

  const handleSearch = () => {
    // The search is already reactive to the state changes
    // This function can be used for additional search logic if needed
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800";
    if (score >= 80) return "bg-blue-100 text-blue-800";
    if (score >= 70) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Find Your Next Apartment</h2>
        <p className="text-muted-foreground mt-2">
          Search through our database of multifamily properties across the United States.
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Properties
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Search */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <Input
                placeholder="Enter city name..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">State</label>
                             <Select value={searchState} onValueChange={setSearchState}>
                 <SelectTrigger>
                   <SelectValue placeholder="Select state..." />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All States</SelectItem>
                   {US_STATES.map((state) => (
                     <SelectItem key={state.value} value={state.value}>
                       {state.label}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Year Built Range</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="From"
                  value={yearBuiltRange[0]}
                  onChange={(e) => setYearBuiltRange([Number(e.target.value), yearBuiltRange[1]])}
                />
                <Input
                  type="number"
                  placeholder="To"
                  value={yearBuiltRange[1]}
                  onChange={(e) => setYearBuiltRange([yearBuiltRange[0], Number(e.target.value)])}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Minimum Units</label>
              <Input
                type="number"
                placeholder="Any"
                value={minUnits || ""}
                onChange={(e) => setMinUnits(e.target.value ? Number(e.target.value) : null)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {filteredProperties.length} Properties Found
          </h3>
                     {searchCity || (searchState && searchState !== "all") ? (
             <p className="text-sm text-muted-foreground">
               Showing results for {searchCity && searchState && searchState !== "all" ? `${searchCity}, ${searchState}` : searchCity || (searchState !== "all" ? searchState : "")}
             </p>
           ) : (
             <p className="text-sm text-muted-foreground">
               Showing all available properties
             </p>
           )}
        </div>
      </div>

      {/* Property Listings */}
      {properties === undefined ? (
        // Loading state
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        // No results
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No properties found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or browse all available properties.
            </p>
          </CardContent>
        </Card>
      ) : (
                 // Results
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           {filteredProperties.map((property: any) => (
            <Card key={property._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  {property.googleImageUrl ? (
                    <img
                      src={property.googleImageUrl}
                      alt={property.propertyName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-16 w-16 text-muted-foreground" />
                  )}
                </div>
                <div className="absolute top-4 right-4">
                  <Badge className={getScoreColor(property.score)}>
                    <Star className="h-3 w-3 mr-1" />
                    {property.score}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1">
                      {property.propertyName}
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="line-clamp-1">
                        {property.address}, {property.city}, {property.state} {property.zipCode}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{property.totalUnits} units</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Built {property.yearBuilt}</span>
                    </div>
                    <div className="flex items-center">
                      <Square className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{property.averageUnitSize} sqft avg</span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{property.occupancyRate}% occupied</span>
                    </div>
                  </div>

                                     {property.amenities && property.amenities.length > 0 && (
                     <div className="flex flex-wrap gap-1">
                       {property.amenities.slice(0, 3).map((amenity: string) => (
                         <Badge key={amenity} variant="secondary" className="text-xs">
                           {amenity}
                         </Badge>
                       ))}
                       {property.amenities.length > 3 && (
                         <Badge variant="secondary" className="text-xs">
                           +{property.amenities.length - 3} more
                         </Badge>
                       )}
                     </div>
                   )}

                  <Button className="w-full">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 