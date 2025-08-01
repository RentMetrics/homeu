'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Search, 
  Home, 
  MapPin, 
  Star, 
  Users, 
  Building2,
  Loader2,
  CheckCircle
} from 'lucide-react';

interface PropertySearchFormProps {
  onPropertyFound: (property: any) => void;
  className?: string;
}

interface Property {
  _id: string;
  propertyId: string;
  propertyName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  totalUnits: number;
  yearBuilt: number;
  averageUnitSize: number;
  googleRating?: number;
  googleImageUrl?: string;
  homeuScore?: number;
  scoreFactors?: string[];
  amenities?: string[];
  createdAt: number;
}

export function PropertySearchForm({ onPropertyFound, className }: PropertySearchFormProps) {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Property[]>([]);

  // Get all properties from Convex
  const allProperties = useQuery(api.multifamilyproperties.list) || [];

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      // Filter properties based on search query
      const filtered = allProperties.filter(property => 
        property.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.zipCode.includes(searchQuery)
      );

      setSearchResults(filtered);
      
      if (filtered.length === 0) {
        toast.info('No properties found. Try a different search term.');
      }
    } catch (error) {
      console.error('Error searching properties:', error);
      toast.error('Error searching properties. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    toast.success(`Selected: ${property.propertyName}`);
  };

  const handleConfirmProperty = () => {
    if (selectedProperty) {
      onPropertyFound(selectedProperty);
    }
  };

  const handleSkip = () => {
    // Allow users to skip property search for now
    toast.info('You can add your property later from the dashboard.');
    onPropertyFound(null);
  };

  useEffect(() => {
    // Auto-search when query changes (with debounce)
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-6 w-6 text-blue-600" />
            Find Your Property
          </CardTitle>
          <CardDescription>
            Search for your apartment complex to connect with your management company
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search by property name, address, or location</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Enter property name, address, city, or ZIP code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Search Results ({searchResults.length})</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {searchResults.map((property) => (
                  <div
                    key={property._id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedProperty?._id === property._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handlePropertySelect(property)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Property Image */}
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        {property.googleImageUrl ? (
                          <img
                            src={property.googleImageUrl}
                            alt={property.propertyName}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Building2 className="h-8 w-8 text-gray-400" />
                        )}
                      </div>

                      {/* Property Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-lg">{property.propertyName}</h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {property.address}, {property.city}, {property.state} {property.zipCode}
                            </p>
                          </div>
                          {selectedProperty?._id === property._id && (
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-2">
                          {property.googleRating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm">{property.googleRating}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{property.totalUnits} units</span>
                          </div>
                          {property.homeuScore && (
                            <Badge variant="secondary" className="text-xs">
                              HomeU Score: {property.homeuScore}
                            </Badge>
                          )}
                        </div>

                        {property.amenities && property.amenities.length > 0 && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {property.amenities.slice(0, 3).map((amenity, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {amenity}
                                </Badge>
                              ))}
                              {property.amenities.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{property.amenities.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Property */}
          {selectedProperty && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Property Selected</span>
              </div>
              <p className="text-green-700">{selectedProperty.propertyName}</p>
              <p className="text-sm text-green-600">{selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip for Now
            </Button>
            <Button
              onClick={handleConfirmProperty}
              disabled={!selectedProperty}
              className="flex-1"
            >
              Confirm Property
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-sm text-muted-foreground text-center">
            <p>Can't find your property? You can add it manually later or contact support for assistance.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 