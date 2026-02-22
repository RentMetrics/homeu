'use client';

import { useState, useEffect } from 'react';
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
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface PropertySearchFormProps {
  onPropertyFound: (property: any, pmConfirmed?: boolean) => void;
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
  pmCompanyName?: string;
  pmEmail?: string;
  pmPhone?: string;
  pmContactName?: string;
  createdAt: number;
}

export function PropertySearchForm({ onPropertyFound, className }: PropertySearchFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [pmConfirmed, setPmConfirmed] = useState<boolean | null>(null);

  // Debounce the search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Use the search index query (searches all 47K+ properties)
  const searchResults = useQuery(
    api.multifamilyproperties.searchProperties,
    debouncedQuery.length >= 2
      ? { searchQuery: debouncedQuery, limit: 20 }
      : "skip"
  );

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    setPmConfirmed(null);
  };

  const handleConfirmProperty = () => {
    if (selectedProperty) {
      onPropertyFound(selectedProperty, pmConfirmed === true);
    }
  };

  const handleSkip = () => {
    toast.info('You can add your property later from the dashboard.');
    onPropertyFound(null);
  };

  const isLoading = debouncedQuery.length >= 2 && searchResults === undefined;

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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Enter property name, address, city, or ZIP code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Searching...
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchResults && searchResults.length > 0 && !selectedProperty && (
            <div className="space-y-4">
              <h3 className="font-medium">Search Results ({searchResults.length})</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {searchResults.map((property: Property) => (
                  <div
                    key={property._id}
                    className="p-4 border rounded-lg cursor-pointer transition-colors border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                    onClick={() => handlePropertySelect(property)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
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
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-lg">{property.propertyName}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {property.address}, {property.city}, {property.state} {property.zipCode}
                        </p>
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
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
                          {property.pmCompanyName && (
                            <Badge variant="secondary" className="text-xs">
                              {property.pmCompanyName}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {searchResults && searchResults.length === 0 && debouncedQuery.length >= 2 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No properties found. Try a different search term.
            </p>
          )}

          {/* Selected Property + PM Confirmation */}
          {selectedProperty && (
            <div className="space-y-4">
              {/* Property Summary */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Property Selected</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedProperty(null);
                      setPmConfirmed(null);
                    }}
                    className="text-green-700 hover:text-green-900"
                  >
                    Change
                  </Button>
                </div>
                <p className="text-green-700 font-medium">{selectedProperty.propertyName}</p>
                <p className="text-sm text-green-600">
                  {selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zipCode}
                </p>
              </div>

              {/* PM Confirmation */}
              {selectedProperty.pmCompanyName ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                  <h4 className="font-medium text-blue-800 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Management Company on File
                  </h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p className="font-medium">{selectedProperty.pmCompanyName}</p>
                    {selectedProperty.pmPhone && <p>Phone: {selectedProperty.pmPhone}</p>}
                    {selectedProperty.pmEmail && <p>Email: {selectedProperty.pmEmail}</p>}
                    {selectedProperty.pmContactName && <p>Contact: {selectedProperty.pmContactName}</p>}
                  </div>
                  <p className="text-sm text-blue-800 font-medium">Is this your management company?</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={pmConfirmed === true ? "default" : "outline"}
                      onClick={() => setPmConfirmed(true)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Yes, that's correct
                    </Button>
                    <Button
                      size="sm"
                      variant={pmConfirmed === false ? "default" : "outline"}
                      onClick={() => setPmConfirmed(false)}
                    >
                      No, it's different
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      No management company on file for this property. You can enter it in the next step.
                    </span>
                  </div>
                </div>
              )}
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
