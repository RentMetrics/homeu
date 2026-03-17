'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Loader2,
  Search,
  Building2,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react';

interface PropertyResult {
  _id: string;
  propertyId: string;
  propertyName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  totalUnits: number;
  pmCompanyName?: string;
}

type LinkResult = {
  success: boolean;
  status: string;
  message: string;
  propertyName?: string;
  pmCompanyName?: string;
};

export default function LinkPropertyPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<PropertyResult | null>(null);
  const [unitNumber, setUnitNumber] = useState('');

  // Manual entry state
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualForm, setManualForm] = useState({
    propertyName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    pmCompanyName: '',
    pmContactName: '',
    pmEmail: '',
    pmPhone: '',
  });

  // Result state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkResult, setLinkResult] = useState<LinkResult | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search query
  const searchResults = useQuery(
    api.multifamilyproperties.searchProperties,
    debouncedQuery.length >= 2 ? { searchQuery: debouncedQuery, limit: 10 } : 'skip'
  );

  // Mutations
  const linkToProperty = useMutation(api.renters.linkRenterToProperty);
  const submitManual = useMutation(api.renters.submitManualPropertyAndLink);
  const skipLink = useMutation(api.renters.skipPropertyLink);

  const handleSelectProperty = (property: PropertyResult) => {
    setSelectedProperty(property);
    setSearchQuery(property.propertyName);
  };

  const handleLinkProperty = async () => {
    if (!user || !selectedProperty) return;

    if (!unitNumber.trim()) {
      toast.error('Please enter your unit/apartment number');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await linkToProperty({
        userId: user.id,
        propertyId: selectedProperty.propertyId,
        unitNumber: unitNumber.trim(),
      });
      setLinkResult(result as LinkResult);
    } catch (error) {
      toast.error('Failed to link property. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!user) return;

    if (!unitNumber.trim()) {
      toast.error('Please enter your unit/apartment number');
      return;
    }
    if (!manualForm.propertyName || !manualForm.address || !manualForm.city || !manualForm.state || !manualForm.zipCode) {
      toast.error('Please fill in the property address');
      return;
    }
    if (!manualForm.pmEmail) {
      toast.error('Please provide your property management email');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await submitManual({
        userId: user.id,
        propertyName: manualForm.propertyName,
        address: manualForm.address,
        city: manualForm.city,
        state: manualForm.state,
        zipCode: manualForm.zipCode,
        unitNumber: unitNumber.trim(),
        pmCompanyName: manualForm.pmCompanyName || manualForm.propertyName,
        pmContactName: manualForm.pmContactName || undefined,
        pmEmail: manualForm.pmEmail,
        pmPhone: manualForm.pmPhone || undefined,
      });
      setLinkResult(result as LinkResult);
    } catch (error) {
      toast.error('Failed to save property. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    await skipLink({ userId: user.id });
    router.push('/dashboard');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  // Show result screen
  if (linkResult) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="p-8 text-center space-y-6">
            {linkResult.status === 'linked' ? (
              <>
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-800">You're Connected!</h2>
                <p className="text-gray-600">{linkResult.message}</p>
                {linkResult.propertyName && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="font-medium">{linkResult.propertyName}</p>
                    {linkResult.pmCompanyName && (
                      <p className="text-sm text-gray-600">Managed by {linkResult.pmCompanyName}</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                  <Clock className="h-8 w-8 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-amber-800">We're On It!</h2>
                <p className="text-gray-600">{linkResult.message}</p>
                {linkResult.propertyName && (
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <p className="font-medium">{linkResult.propertyName}</p>
                  </div>
                )}
              </>
            )}

            <Button onClick={() => router.push('/dashboard')} className="w-full" size="lg">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">
            <CheckCircle className="h-4 w-4" />
          </div>
          <span className="text-sm text-gray-500">Your Profile</span>
        </div>
        <div className="flex-1 h-px bg-gray-300" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">2</div>
          <span className="text-sm font-medium">Your Property</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Where Do You Live?
          </CardTitle>
          <CardDescription>
            Connect your property so we can set up rent payments, credit reporting, and rewards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Property Search */}
          {!showManualEntry && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedProperty(null);
                  }}
                  placeholder="Search by property name or address..."
                  className="pl-10"
                />
              </div>

              {/* Search Results */}
              {debouncedQuery.length >= 2 && !selectedProperty && (
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {searchResults === undefined ? (
                    <div className="p-4 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No properties found. Try a different search or add your property manually below.
                    </div>
                  ) : (
                    searchResults.map((property: any) => (
                      <button
                        key={property._id}
                        onClick={() => handleSelectProperty(property)}
                        className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-0 flex items-start gap-3 transition-colors"
                      >
                        <Building2 className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{property.propertyName}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {property.address}, {property.city}, {property.state} {property.zipCode}
                          </p>
                          {property.pmCompanyName && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Managed by {property.pmCompanyName}
                            </p>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Selected Property */}
              {selectedProperty && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">{selectedProperty.propertyName}</p>
                      <p className="text-sm text-gray-600">
                        {selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zipCode}
                      </p>
                      {selectedProperty.pmCompanyName && (
                        <p className="text-sm text-gray-500 mt-1">
                          Managed by {selectedProperty.pmCompanyName}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedProperty(null);
                        setSearchQuery('');
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              {/* Unit Number */}
              {selectedProperty && (
                <div>
                  <Label htmlFor="unitNumber">Unit / Apartment Number</Label>
                  <Input
                    id="unitNumber"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    placeholder="e.g., 4B, 201, etc."
                    className="mt-1"
                  />
                </div>
              )}

              {/* Submit button */}
              {selectedProperty && (
                <Button
                  onClick={handleLinkProperty}
                  disabled={isSubmitting || !unitNumber.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      Connect My Property
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Manual Entry Toggle */}
          <div className="border-t pt-4">
            <button
              onClick={() => {
                setShowManualEntry(!showManualEntry);
                setSelectedProperty(null);
              }}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors w-full justify-center"
            >
              {showManualEntry ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Search for my property instead
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Can't find your property? Add it manually
                </>
              )}
            </button>
          </div>

          {/* Manual Entry Form */}
          {showManualEntry && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-sm text-gray-700">Property Information</h3>

              <div>
                <Label>Property / Building Name</Label>
                <Input
                  value={manualForm.propertyName}
                  onChange={(e) => setManualForm({ ...manualForm, propertyName: e.target.value })}
                  placeholder="e.g., Sunset Apartments"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Unit / Apartment Number</Label>
                <Input
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  placeholder="e.g., 4B, 201, etc."
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Street Address</Label>
                <Input
                  value={manualForm.address}
                  onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })}
                  placeholder="123 Main Street"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>City</Label>
                  <Input
                    value={manualForm.city}
                    onChange={(e) => setManualForm({ ...manualForm, city: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={manualForm.state}
                    onChange={(e) => setManualForm({ ...manualForm, state: e.target.value })}
                    maxLength={2}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>ZIP</Label>
                  <Input
                    value={manualForm.zipCode}
                    onChange={(e) => setManualForm({ ...manualForm, zipCode: e.target.value })}
                    maxLength={5}
                    className="mt-1"
                  />
                </div>
              </div>

              <h3 className="font-medium text-sm text-gray-700 pt-2">Property Management Contact</h3>

              <div>
                <Label>Management Company Name</Label>
                <Input
                  value={manualForm.pmCompanyName}
                  onChange={(e) => setManualForm({ ...manualForm, pmCompanyName: e.target.value })}
                  placeholder="e.g., ABC Property Management"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Contact Name (optional)</Label>
                <Input
                  value={manualForm.pmContactName}
                  onChange={(e) => setManualForm({ ...manualForm, pmContactName: e.target.value })}
                  placeholder="e.g., John Smith"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Management Email</Label>
                <Input
                  type="email"
                  value={manualForm.pmEmail}
                  onChange={(e) => setManualForm({ ...manualForm, pmEmail: e.target.value })}
                  placeholder="manager@property.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Management Phone (optional)</Label>
                <Input
                  type="tel"
                  value={manualForm.pmPhone}
                  onChange={(e) => setManualForm({ ...manualForm, pmPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleManualSubmit}
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Property & Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Skip button */}
          <div className="text-center pt-2">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip for now — I'll do this later
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
