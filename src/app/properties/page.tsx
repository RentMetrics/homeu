'use client';

import { useState } from 'react';
import { Search, Home, Building2, SlidersHorizontal, Star, MapPin, Calendar } from 'lucide-react';
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
  const [yearBuiltFilter, setYearBuiltFilter] = useState('all');
  const [minUnitsFilter, setMinUnitsFilter] = useState('all');

  // Parse the search query
  const { city, state } = parseSearchQuery(searchQuery);

  // Get properties from Convex using the efficient location-based search
  const searchResult = useQuery(api.multifamilyproperties.searchPropertiesByLocation, {
    city: city,
    state: state,
    limit: 100
  });

  // Get all properties for filters (limited to avoid hitting limits)
  const allProperties = useQuery(api.multifamilyproperties.getAllProperties, {
    limit: 1000
  });

  // Debug: Get sample properties to see data format
  const sampleProperties = useQuery(api.multifamilyproperties.getSampleProperties);
  
  // Debug: Get unique locations
  const uniqueLocations = useQuery(api.multifamilyproperties.getUniqueLocations);

  // Filter properties based on additional criteria
  const filteredProperties = searchResult?.filter(property => {
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

  // Get unique cities and states for display
  const cities = [...new Set(allProperties?.map(p => p.city) || [])].sort();
  const states = [...new Set(allProperties?.map(p => p.state) || [])].sort();

  if (!searchResult && !allProperties) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading properties...</p>
        </div>
      </div>
    );
  }

  // Debug output
  console.log("Search query:", searchQuery);
  console.log("Parsed city:", city);
  console.log("Parsed state:", state);
  console.log("Search result count:", searchResult?.length);
  console.log("Sample properties:", sampleProperties);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold mb-2">Properties</h1>
        <Link href="/dashboard">
          <Button variant="outline" className="ml-4">Back to Dashboard</Button>
        </Link>
      </div>
      {/* Search Section */}
      <div className="mb-8 space-y-4">
        

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by city, state, property name, or address (e.g., 'Salt Lake City, UT' or 'Texas')"
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
        {filteredProperties.map((property) => (
          <Card key={property._id} className="overflow-hidden">
            <div className="relative h-48">
              {property.googleImageUrl ? (
                <img
                  src={property.googleImageUrl}
                  alt={property.propertyName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Building2 className="h-12 w-12 text-gray-400" />
                </div>
              )}
              <Badge className="absolute top-2 right-2">
                {property.totalUnits} units
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
                  <CardTitle className="text-xl">{property.propertyName}</CardTitle>
                  <CardDescription className="flex items-center gap-1 text-sm">
                    <MapPin className="h-4 w-4" />
                    {property.city}, {property.state}
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
                    <span>{property.totalUnits} units</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{property.yearBuilt}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>{property.averageUnitSize} sqft avg</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{property.address}</p>
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
              <Button className="w-full">View Details</Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">No properties found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria. You can search by:
          </p>
          <ul className="mt-2 text-sm text-gray-500 list-disc list-inside">
            <li>City name (e.g., "Salt Lake City")</li>
            <li>State name (e.g., "Utah" or "UT")</li>
            <li>City and state (e.g., "Salt Lake City, UT")</li>
            <li>Property name or address</li>
          </ul>
          {uniqueLocations && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">Available locations in database:</p>
              <p className="text-sm text-blue-700">Cities: {uniqueLocations.cities.join(', ')}</p>
              <p className="text-sm text-blue-700">States: {uniqueLocations.states.join(', ')}</p>
              <p className="text-sm text-blue-600 mt-2">Try searching for one of these locations!</p>
            </div>
          )}
          {searchQuery && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Search attempted:</strong> "{searchQuery}"
              </p>
              {city && <p className="text-sm text-gray-600">City: {city}</p>}
              {state && <p className="text-sm text-gray-600">State: {state}</p>}
            </div>
          )}
        </div>
      )}

      {filteredProperties.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-500">
          Showing {filteredProperties.length} properties
          {searchQuery && (
            <span className="ml-2">
              for "{searchQuery}"
            </span>
          )}
        </div>
      )}
    </div>
  );
} 