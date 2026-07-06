'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Doc } from '../../../../convex/_generated/dataModel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import {
  Upload,
  DollarSign,
  Home,
  Percent,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  FileSpreadsheet,
  ExternalLink,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

type MarketDataSummary = {
  propertyCount: number;
  monthsAvailable: string[];
  rentSummary: { averageRent: number; totalRecords: number };
  occupancySummary: { averageOccupancy: number; totalRecords: number };
  concessionSummary: { totalRecords: number };
  rentData: Doc<'rentData'>[];
  occupancyData: Doc<'occupancyData'>[];
  concessionData: Doc<'concessionData'>[];
};

export default function DataManagementPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');

  // Get market data summary
  const marketData: MarketDataSummary | undefined = useQuery(api.monthly_data.getMarketDataSummary, {
    propertyId: selectedProperty || undefined,
    startMonth: startMonth || undefined,
    endMonth: endMonth || undefined,
  });

  // Get all property IDs for filter dropdown
  const propertyIds: string[] | undefined = useQuery(api.monthly_data.getAllPropertyIds, {});

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Data Management</h1>
        <p className="text-muted-foreground mt-2">
          Upload and manage market data for properties - rent, occupancy, and concessions
        </p>
      </div>

      {/* Quick Upload Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Rent Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upload monthly rent averages, ranges, and revenue data
            </p>
            <Link href="/admin/upload-rent">
              <Button className="w-full" variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload Rent Data
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Percent className="h-5 w-5 text-blue-600" />
              Occupancy Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upload monthly occupancy rates and unit counts
            </p>
            <Link href="/admin/upload-occupancy">
              <Button className="w-full" variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload Occupancy Data
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="h-5 w-5 text-purple-600" />
              Concessions Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upload monthly concession types and amounts
            </p>
            <Link href="/admin/upload-concessions">
              <Button className="w-full" variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload Concessions Data
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Data Explorer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Data Explorer
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Property</label>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">All Properties</option>
                {propertyIds?.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[150px]">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Start Month</label>
              <Input
                type="month"
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                placeholder="YYYY-MM"
              />
            </div>
            <div className="min-w-[150px]">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">End Month</label>
              <Input
                type="month"
                value={endMonth}
                onChange={(e) => setEndMonth(e.target.value)}
                placeholder="YYYY-MM"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedProperty('');
                  setStartMonth('');
                  setEndMonth('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          {marketData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Building2 className="h-4 w-4" />
                  Properties
                </div>
                <div className="text-2xl font-bold">{marketData.propertyCount}</div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-green-600 mb-1">
                  <DollarSign className="h-4 w-4" />
                  Avg Rent
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency(marketData.rentSummary.averageRent)}
                </div>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-blue-600 mb-1">
                  <Percent className="h-4 w-4" />
                  Avg Occupancy
                </div>
                <div className="text-2xl font-bold text-blue-400">
                  {formatPercent(marketData.occupancySummary.averageOccupancy)}
                </div>
              </div>
              <div className="bg-purple-500/10 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-purple-600 mb-1">
                  <Calendar className="h-4 w-4" />
                  Months Available
                </div>
                <div className="text-2xl font-bold text-purple-400">
                  {marketData.monthsAvailable.length}
                </div>
              </div>
            </div>
          )}

          {/* Data Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rent">
                Rent Data ({marketData?.rentSummary.totalRecords || 0})
              </TabsTrigger>
              <TabsTrigger value="occupancy">
                Occupancy ({marketData?.occupancySummary.totalRecords || 0})
              </TabsTrigger>
              <TabsTrigger value="concessions">
                Concessions ({marketData?.concessionSummary.totalRecords || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rent" className="mt-4">
              {marketData?.rentData && marketData.rentData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left">Property ID</th>
                        <th className="px-4 py-2 text-left">Month</th>
                        <th className="px-4 py-2 text-right">Avg Rent</th>
                        <th className="px-4 py-2 text-right">Min</th>
                        <th className="px-4 py-2 text-right">Max</th>
                        <th className="px-4 py-2 text-right">$/SqFt</th>
                        <th className="px-4 py-2 text-right">Revenue</th>
                        <th className="px-4 py-2 text-right">Units</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marketData.rentData.map((row, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="px-4 py-2 font-mono text-xs">{row.propertyId}</td>
                          <td className="px-4 py-2">{row.month}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(row.averageRent)}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(row.minRent)}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(row.maxRent)}</td>
                          <td className="px-4 py-2 text-right">${row.rentPerSqFt.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(row.totalRevenue)}</td>
                          <td className="px-4 py-2 text-right">{row.unitsRented}/{row.totalUnits}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No rent data available.{' '}
                  <Link href="/admin/upload-rent" className="text-blue-600 hover:underline">
                    Upload rent data
                  </Link>
                </div>
              )}
            </TabsContent>

            <TabsContent value="occupancy" className="mt-4">
              {marketData?.occupancyData && marketData.occupancyData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left">Property ID</th>
                        <th className="px-4 py-2 text-left">Month</th>
                        <th className="px-4 py-2 text-right">Occupancy Rate</th>
                        <th className="px-4 py-2 text-right">Occupied</th>
                        <th className="px-4 py-2 text-right">Vacant</th>
                        <th className="px-4 py-2 text-right">Total Units</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marketData.occupancyData.map((row, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="px-4 py-2 font-mono text-xs">{row.propertyId}</td>
                          <td className="px-4 py-2">{row.month}</td>
                          <td className="px-4 py-2 text-right">
                            <span className={row.occupancyRate >= 95 ? 'text-green-600' : row.occupancyRate >= 90 ? 'text-yellow-600' : 'text-red-600'}>
                              {formatPercent(row.occupancyRate)}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">{row.occupiedUnits}</td>
                          <td className="px-4 py-2 text-right">{row.vacantUnits}</td>
                          <td className="px-4 py-2 text-right">{row.totalUnits}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No occupancy data available.{' '}
                  <Link href="/admin/upload-occupancy" className="text-blue-600 hover:underline">
                    Upload occupancy data
                  </Link>
                </div>
              )}
            </TabsContent>

            <TabsContent value="concessions" className="mt-4">
              {marketData?.concessionData && marketData.concessionData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left">Property ID</th>
                        <th className="px-4 py-2 text-left">Month</th>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                        <th className="px-4 py-2 text-right">Duration (mo)</th>
                        <th className="px-4 py-2 text-right">Units w/ Concessions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marketData.concessionData.map((row, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="px-4 py-2 font-mono text-xs">{row.propertyId}</td>
                          <td className="px-4 py-2">{row.month}</td>
                          <td className="px-4 py-2">
                            <Badge variant="outline">{row.concessionType}</Badge>
                          </td>
                          <td className="px-4 py-2 text-right">{formatCurrency(row.concessionAmount)}</td>
                          <td className="px-4 py-2 text-right">{row.concessionDuration}</td>
                          <td className="px-4 py-2 text-right">{row.unitsWithConcessions}/{row.totalUnits}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No concession data available.{' '}
                  <Link href="/admin/upload-concessions" className="text-blue-600 hover:underline">
                    Upload concessions data
                  </Link>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Excel Format Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Excel Format Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Rent Data Headers
              </h4>
              <div className="bg-muted rounded p-3 font-mono text-xs space-y-1">
                <div>Property ID</div>
                <div>Month</div>
                <div>Average Rent</div>
                <div>Min Rent</div>
                <div>Max Rent</div>
                <div>Rent Per Sq Ft</div>
                <div>Total Revenue</div>
                <div>Units Rented</div>
                <div>Total Units</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Percent className="h-4 w-4 text-blue-600" />
                Occupancy Data Headers
              </h4>
              <div className="bg-muted rounded p-3 font-mono text-xs space-y-1">
                <div>Property ID</div>
                <div>Month</div>
                <div>Occupancy Rate</div>
                <div>Occupied Units</div>
                <div>Vacant Units</div>
                <div>Total Units</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Home className="h-4 w-4 text-purple-600" />
                Concessions Data Headers
              </h4>
              <div className="bg-muted rounded p-3 font-mono text-xs space-y-1">
                <div>Property ID</div>
                <div>Month</div>
                <div>Concession Type</div>
                <div>Concession Amount</div>
                <div>Concession Duration</div>
                <div>Units With Concessions</div>
                <div>Total Units</div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
            <p className="text-sm text-yellow-400">
              <strong>Note:</strong> Property IDs must match existing properties in the database.
              Month format should be <code className="bg-yellow-500/20 px-1 rounded">YYYY-MM</code> (e.g., 2024-01).
              Headers are case-insensitive.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
