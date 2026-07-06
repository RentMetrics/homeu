'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAction, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { toast } from 'sonner';
import { Image as ImageIcon, MapPin, Star, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function EnrichPropertiesPage() {
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentResults, setEnrichmentResults] = useState<any>(null);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [maxProperties, setMaxProperties] = useState(50);

  // Convex actions
  const enrichAllProperties = useAction(api.google_places_enrichment.enrichAllProperties);
  const enrichByLocation = useAction(api.google_places_enrichment.enrichPropertiesByLocation);
  const getPropertiesNeedingEnrichment = useAction(api.google_places_enrichment.getPropertiesNeedingEnrichment);

  // Get properties count
  const propertiesCount = useQuery(api.multifamilyproperties.getPropertiesCount);

  const handleEnrichAll = async () => {
    setIsEnriching(true);
    setEnrichmentResults(null);

    try {
      toast.info(`Starting enrichment for up to ${maxProperties} properties...`);

      const results = await enrichAllProperties({
        maxProperties: maxProperties,
        force: false,
      });

      setEnrichmentResults(results);

      toast.success(`Enrichment complete! ${results.successful} properties enriched successfully.`);
    } catch (error) {
      toast.error('Failed to enrich properties. Check console for details.');
      console.error('Enrichment error:', error);
    } finally {
      setIsEnriching(false);
    }
  };

  const handleEnrichByLocation = async () => {
    if (!selectedCity || !selectedState) {
      toast.error('Please enter both city and state');
      return;
    }

    setIsEnriching(true);
    setEnrichmentResults(null);

    try {
      toast.info(`Enriching properties in ${selectedCity}, ${selectedState}...`);

      const results = await enrichByLocation({
        city: selectedCity,
        state: selectedState,
        limit: maxProperties,
        force: false,
      });

      setEnrichmentResults(results);

      toast.success(`Enrichment complete! ${results.successful} properties enriched.`);
    } catch (error) {
      toast.error('Failed to enrich properties. Check console for details.');
      console.error('Enrichment error:', error);
    } finally {
      setIsEnriching(false);
    }
  };

  const handleCheckNeedingEnrichment = async () => {
    try {
      const results = await getPropertiesNeedingEnrichment({ limit: 1000 });

      toast.info(`${results.needingEnrichment} of ${results.total} properties need enrichment (${results.percentage}%)`);

      setEnrichmentResults({
        ...results,
        isCheckOnly: true,
      });
    } catch (error) {
      toast.error('Failed to check properties');
      console.error('Check error:', error);
    }
  };

  const getStatusIcon = (result: any) => {
    if (result.success && !result.skipped) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (result.skipped) {
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = (result: any) => {
    if (result.success && !result.skipped) {
      return <Badge className="bg-green-500/20 text-green-400">Success</Badge>;
    }
    if (result.skipped) {
      return <Badge className="bg-yellow-500/20 text-yellow-400">Skipped</Badge>;
    }
    return <Badge className="bg-red-500/20 text-red-400">Failed</Badge>;
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Property Photo Enrichment</h1>
        <p className="text-muted-foreground">
          Automatically fetch property photos from Google Places API
        </p>
      </div>

      {/* API Key Warning */}
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Setup Required:</strong> Make sure <code>GOOGLE_PLACES_API_KEY</code> is set in your Convex environment.
          <br />
          Run: <code className="bg-muted px-2 py-1 rounded">npx convex env set GOOGLE_PLACES_API_KEY your_api_key_here</code>
        </AlertDescription>
      </Alert>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{propertiesCount || 0}</div>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              In database
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Enrichment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckNeedingEnrichment}
              className="w-full"
            >
              Check Status
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cost Estimate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Text Search: ~$32/1,000
              <br />
              Place Details: ~$17/1,000
              <br />
              Photos: Free
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrichment Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Enrich by Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Enrich by Location
            </CardTitle>
            <CardDescription>
              Fetch photos for all properties in a specific city
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="e.g., Dallas"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="e.g., TX"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                maxLength={2}
              />
            </div>
            <div>
              <Label htmlFor="limit">Max Properties</Label>
              <Input
                id="limit"
                type="number"
                value={maxProperties}
                onChange={(e) => setMaxProperties(parseInt(e.target.value) || 50)}
                min={1}
                max={500}
              />
            </div>
            <Button
              onClick={handleEnrichByLocation}
              disabled={isEnriching || !selectedCity || !selectedState}
              className="w-full"
            >
              {isEnriching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enriching...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Enrich Properties
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Enrich All */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Enrich All Properties
            </CardTitle>
            <CardDescription>
              Fetch photos for all properties in the database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Warning:</strong> This will make API calls for many properties.
                Cost: ~$50 per 1,000 properties.
              </AlertDescription>
            </Alert>
            <div>
              <Label htmlFor="maxAll">Max Properties</Label>
              <Input
                id="maxAll"
                type="number"
                value={maxProperties}
                onChange={(e) => setMaxProperties(parseInt(e.target.value) || 50)}
                min={1}
                max={500}
              />
            </div>
            <Button
              onClick={handleEnrichAll}
              disabled={isEnriching}
              variant="outline"
              className="w-full"
            >
              {isEnriching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enriching...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Enrich All
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results Display */}
      {enrichmentResults && (
        <Card>
          <CardHeader>
            <CardTitle>Enrichment Results</CardTitle>
            <CardDescription>
              {enrichmentResults.isCheckOnly ? (
                `${enrichmentResults.needingEnrichment} properties need enrichment`
              ) : (
                `Processed ${enrichmentResults.total} properties`
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!enrichmentResults.isCheckOnly && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {enrichmentResults.successful}
                  </div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {enrichmentResults.failed}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {enrichmentResults.skipped}
                  </div>
                  <div className="text-sm text-muted-foreground">Skipped</div>
                </div>
              </div>
            )}

            {enrichmentResults.details && enrichmentResults.details.length > 0 && (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="text-right">Photos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrichmentResults.details.map((result: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{getStatusIcon(result)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{result.propertyName}</div>
                          {result.placeId && (
                            <div className="text-xs text-muted-foreground">{result.placeId}</div>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(result)}</TableCell>
                        <TableCell className="text-sm">
                          {result.message}
                          {result.rating && (
                            <div className="flex items-center gap-1 mt-1 text-yellow-600">
                              <Star className="h-3 w-3 fill-current" />
                              <span>{result.rating}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {result.photosFound !== undefined && result.photosFound}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {enrichmentResults.properties && enrichmentResults.properties.length > 0 && (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property Name</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>State</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrichmentResults.properties.map((property: any) => (
                      <TableRow key={property.propertyId}>
                        <TableCell className="font-medium">{property.propertyName}</TableCell>
                        <TableCell>{property.city}</TableCell>
                        <TableCell>{property.state}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Best Practices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div>• Start with a small batch (10-20 properties) to test</div>
          <div>• Enrich by location for better accuracy</div>
          <div>• Photos are cached - only run once per property</div>
          <div>• Check "Skipped" means property already has photos</div>
          <div>• Failed results usually mean property not found on Google</div>
          <div>• Cost: ~$49 per 1,000 properties ($32 search + $17 details)</div>
        </CardContent>
      </Card>
    </div>
  );
}
