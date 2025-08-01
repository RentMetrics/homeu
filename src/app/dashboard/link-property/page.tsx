"use client";

import { useState } from "react";
import { Search, MapPin, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

export default function LinkPropertyPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const router = useRouter();

  // Query properties from Convex
  const properties = useQuery(api.multifamilyproperties.searchProperties, {
    searchQuery: searchQuery || undefined,
  });

  const handlePropertySelect = (propertyId: string) => {
    setSelectedProperty(propertyId);
  };

  const handleContinue = () => {
    if (selectedProperty) {
      // Store the selected property in localStorage
      localStorage.setItem('selectedProperty', selectedProperty);
      // Redirect to pay rent page
      router.push('/dashboard/payments');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Link Your Property</h1>
        <p className="text-muted-foreground mt-2">
          Search for your property to link your account and start managing your rent payments.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          type="text"
          placeholder="Search by property name or address..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {properties?.map((property) => (
          <Card
            key={property._id}
            className={`cursor-pointer transition-colors ${
              selectedProperty === property.propertyId
                ? 'border-green-500 bg-green-50'
                : 'hover:border-gray-300'
            }`}
            onClick={() => handlePropertySelect(property.propertyId)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-gray-400" />
                    <h3 className="font-semibold">{property.propertyName}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span>{property.address}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {property.city}, {property.state} {property.zipCode}
                  </p>
                  <p className="text-sm text-gray-500">
                    {property.totalUnits} Units • Built {property.yearBuilt}
                  </p>
                </div>
                {selectedProperty === property.propertyId && (
                  <div className="text-green-500">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {properties && properties.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">No properties found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          className="bg-green-600 hover:bg-green-700"
          onClick={handleContinue}
          disabled={!selectedProperty}
        >
          Continue to Payment Setup
        </Button>
      </div>
    </div>
  );
} 