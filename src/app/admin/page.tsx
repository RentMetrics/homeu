'use client';

import { useState } from 'react';
import { Upload, Building2, TrendingUp, DollarSign, Users, Sparkles, Database, UserCheck, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useMutation, useQuery, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';

// Force dynamic rendering to prevent SSR issues with Convex
export const dynamic = 'force-dynamic';

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEnriching, setIsEnriching] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Existing Convex queries
  const enrichAllProperties = useMutation(api.enrich_properties.enrichAllProperties);
  const enrichPropertiesByLocation = useAction(api.google_places.enrichPropertiesByLocation);
  const testGooglePlacesSearch = useAction(api.google_places.testGooglePlacesSearch);
  const testGooglePlacesAPI = useAction(api.google_places.testGooglePlacesAPI);
  const allProperties = useQuery(api.multifamilyproperties.getAllProperties, { limit: 100 });
  const propertiesCount = useQuery(api.multifamilyproperties.getPropertiesCount);
  const propertiesNeedingEnrichment = useQuery(api.google_places.getPropertiesNeedingEnrichment, { city: "Dallas", state: "TX", limit: 50 });

  // New admin queries for customers and property managers
  const allUsers = useQuery(api.users.getAllUsers, { limit: 100 });
  const verifiedUsers = useQuery(api.users.getVerifiedUsers, { limit: 50 });
  const recentSignups = useQuery(api.users.getRecentSignups, { limit: 20 });

  const handleEnrichAll = async () => {
    setIsEnriching(true);
    try {
      await enrichAllProperties();
      toast.success('Properties enriched successfully!');
    } catch (error) {
      toast.error('Failed to enrich properties. Please try again.');
      console.error('Enrichment error:', error);
    } finally {
      setIsEnriching(false);
    }
  };

  const handleEnrichDallas = async () => {
    setIsEnriching(true);
    try {
      const result = await enrichPropertiesByLocation({ city: "Dallas", state: "TX", limit: 20 });
      toast.success(`Dallas enrichment complete! Success: ${result.successCount}, Errors: ${result.errorCount}`);
      console.log('Dallas enrichment result:', result);
    } catch (error) {
      toast.error('Failed to enrich Dallas properties. Please try again.');
      console.error('Dallas enrichment error:', error);
    } finally {
      setIsEnriching(false);
    }
  };

  const handleTestGooglePlaces = async () => {
    if (!allProperties || allProperties.length === 0) {
      toast.error('No properties available for testing');
      return;
    }
    
    const testProperty = allProperties[0];
    try {
      const result = await testGooglePlacesSearch({ propertyId: testProperty.propertyId });
      setTestResult(result);
      
      if (result.enrichmentResult?.success) {
        toast.success(`Test successful! Property enriched with rating: ${result.enrichmentResult.googleRating || 'N/A'}`);
      } else {
        toast.error(`Test failed: ${result.enrichmentResult?.message || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error('Test failed: ' + (error as Error).message);
    }
  };

  const handleTestGooglePlacesAPI = async () => {
    try {
      const result = await testGooglePlacesAPI({});
      setTestResult(result);
      
      if (result.success && result.results) {
        const successCount = result.results.filter((r: any) => r.status === 'success').length;
        toast.success(`API test complete! ${successCount}/${result.results.length} queries successful`);
      } else {
        toast.error(`API test failed: ${result.error}`);
      }
    } catch (error) {
      toast.error('API test failed: ' + (error as Error).message);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage customers, properties, and property management companies</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="property-managers">Property Managers</TabsTrigger>
          <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{allUsers?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Registered renters</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{verifiedUsers?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Identity verified</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{propertiesCount || 0}</div>
                <p className="text-xs text-muted-foreground">Properties in database</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Signups</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recentSignups?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/admin/bulk-upload">
                  <Button className="w-full justify-start" variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Upload Properties
                  </Button>
                </Link>
                <Link href="/admin/customers">
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Customers
                  </Button>
                </Link>
                <Link href="/admin/property-managers">
                  <Button className="w-full justify-start" variant="outline">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Manage Property Managers
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentSignups?.slice(0, 5).map((user, index) => (
                    <div key={user._id} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Badge variant={user.verified ? "default" : "secondary"}>
                        {user.verified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                  )) || (
                    <p className="text-sm text-gray-500">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allUsers?.map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-medium">{user.firstName} {user.lastName}</h3>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          {user.phoneNumber && (
                            <p className="text-sm text-gray-500">{user.phoneNumber}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.verified ? "default" : "secondary"}>
                        {user.verified ? "Verified" : "Pending"}
                      </Badge>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                )) || (
                  <p className="text-center text-gray-500 py-8">No customers found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{propertiesCount || 'Loading...'}</div>
                <p className="text-xs text-muted-foreground">Properties in database</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enriched Properties</CardTitle>
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {allProperties?.filter(p => p.googleRating || p.googleImageUrl).length || 0}
                </div>
                <p className="text-xs text-muted-foreground">With Google data</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {allProperties?.length ? 
                    (allProperties.filter(p => p.googleRating).reduce((sum, p) => sum + (p.googleRating || 0), 0) / 
                     allProperties.filter(p => p.googleRating).length).toFixed(1) : '0.0'}
                </div>
                <p className="text-xs text-muted-foreground">Google rating average</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Units</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {allProperties?.reduce((sum, p) => sum + (p.totalUnits || 0), 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">Across all properties</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-4">
            <Link href="/admin/bulk-upload">
              <Button className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Bulk Upload Properties
              </Button>
            </Link>
            <Button 
              onClick={handleEnrichAll} 
              disabled={isEnriching}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {isEnriching ? 'Enriching...' : 'Enrich All Properties'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="occupancy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Occupancy Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Upload monthly occupancy data for your properties.
              </p>
              <Link href="/admin/occupancy-upload">
                <Button className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Occupancy Data
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="concessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Concessions Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Upload monthly concessions data for your properties.
              </p>
              <Link href="/admin/concessions-upload">
                <Button className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Concessions Data
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Rent Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Upload monthly rent data for your properties.
              </p>
              <Link href="/admin/rent-upload">
                <Button className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Rent Data
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="google" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Google Places Enrichment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Enrich properties with Google Places data including images and ratings.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dallas, TX Test</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Test Google Places enrichment with Dallas properties.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div>Total Properties: {propertiesNeedingEnrichment?.total || 0}</div>
                      <div>Need Enrichment: {propertiesNeedingEnrichment?.needEnrichment || 0}</div>
                    </div>
                    <Button 
                      onClick={handleEnrichDallas} 
                      disabled={isEnriching}
                      className="mt-4 w-full"
                    >
                      {isEnriching ? 'Enriching Dallas...' : 'Enrich Dallas Properties'}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Test Google Places API</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Test the Google Places API with various search queries.
                    </p>
                    <div className="space-y-2">
                      <Button 
                        onClick={handleTestGooglePlaces} 
                        className="w-full"
                      >
                        Test Property Enrichment
                      </Button>
                      <Button 
                        onClick={handleTestGooglePlacesAPI} 
                        variant="outline"
                        className="w-full"
                      >
                        Test API Connectivity
                      </Button>
                    </div>
                    
                    {testResult && (
                      <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                        <h4 className="font-medium mb-2">Test Results:</h4>
                        
                        {/* API Test Results */}
                        {testResult.results && (
                          <div className="space-y-2">
                            <div><strong>API Key Configured:</strong> {testResult.apiKeyConfigured ? 'Yes' : 'No'}</div>
                            <div><strong>Test Results:</strong></div>
                            <div className="max-h-40 overflow-y-auto space-y-1">
                              {testResult.results.map((result: any, i: number) => (
                                <div key={i} className={`p-2 rounded text-xs ${result.status === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                  <div className="font-medium">"{result.query}"</div>
                                  {result.status === 'success' ? (
                                    <div className="text-green-700">
                                      <div>✅ {result.placeName}</div>
                                      <div>Address: {result.address}</div>
                                      <div>Rating: {result.rating || 'N/A'}</div>
                                      <div>Photos: {result.hasPhotos ? 'Yes' : 'No'}</div>
                                    </div>
                                  ) : (
                                    <div className="text-red-700">
                                      <div>❌ {result.apiStatus || result.error}</div>
                                      {result.errorMessage && <div>Error: {result.errorMessage}</div>}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Property Enrichment Results */}
                        {testResult.property && (
                          <div className="space-y-2">
                            <div><strong>Property:</strong> {testResult.property?.propertyName}</div>
                            <div><strong>Address:</strong> {testResult.property?.address}</div>
                            <div><strong>Location:</strong> {testResult.property?.city}, {testResult.property?.state}</div>
                            
                            {testResult.enrichmentResult?.success ? (
                              <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                                <div className="text-green-800 font-medium">✅ Enrichment Successful!</div>
                                <div><strong>Google Rating:</strong> {testResult.enrichmentResult.googleRating || 'N/A'}</div>
                                <div><strong>Has Image:</strong> {testResult.enrichmentResult.googleImageUrl ? 'Yes' : 'No'}</div>
                                <div><strong>Place Name:</strong> {testResult.enrichmentResult.placeName}</div>
                                <div><strong>Successful Query:</strong> "{testResult.enrichmentResult.successfulQuery}"</div>
                              </div>
                            ) : (
                              <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                                <div className="text-red-800 font-medium">❌ Enrichment Failed</div>
                                <div><strong>Error:</strong> {testResult.enrichmentResult?.message || 'Unknown error'}</div>
                                {testResult.enrichmentResult?.triedQueries && (
                                  <div className="mt-1">
                                    <strong>Tried Queries:</strong>
                                    <div className="text-xs text-gray-600 mt-1">
                                      {testResult.enrichmentResult.triedQueries.slice(0, 3).map((query: string, i: number) => (
                                        <div key={i}>• "{query}"</div>
                                      ))}
                                      {testResult.enrichmentResult.triedQueries.length > 3 && (
                                        <div>• ... and {testResult.enrichmentResult.triedQueries.length - 3} more</div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debug" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Debug Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Database Statistics</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Properties:</span> {propertiesCount || 'Loading...'}
                  </div>
                  <div>
                    <span className="font-medium">Properties with Google Data:</span> {allProperties?.filter(p => p.googleRating || p.googleImageUrl).length || 0}
                  </div>
                </div>
              </div>

              {allProperties && allProperties.length > 0 && (
                <>
                  <div>
                    <h3 className="font-semibold mb-2">Sample Properties (First 10)</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {allProperties.slice(0, 10).map((property, index) => (
                        <div key={property._id} className="p-3 border rounded text-sm">
                          <div className="font-medium">{property.propertyName}</div>
                          <div className="text-gray-600">{property.address}</div>
                          <div className="text-gray-500">
                            {property.city}, {property.state} • {property.totalUnits} units • Built {property.yearBuilt}
                          </div>
                          {property.googleRating && (
                            <div className="text-green-600">Google Rating: {property.googleRating}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Available Cities & States</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm">Cities ({getUniqueCitiesAndStates(allProperties).cities.length}):</h4>
                        <div className="text-sm text-gray-600 max-h-32 overflow-y-auto">
                          {getUniqueCitiesAndStates(allProperties).cities.join(', ')}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">States ({getUniqueCitiesAndStates(allProperties).states.length}):</h4>
                        <div className="text-sm text-gray-600">
                          {getUniqueCitiesAndStates(allProperties).states.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function to get unique cities and states
function getUniqueCitiesAndStates(properties: any[]) {
  const cities = [...new Set(properties.map(p => p.city))].sort();
  const states = [...new Set(properties.map(p => p.state))].sort();
  return { cities, states };
} 