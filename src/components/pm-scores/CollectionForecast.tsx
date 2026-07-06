'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Calendar,
  Users,
} from 'lucide-react';
import { calculateCollectionForecast } from '@/lib/wasm/pm-scores';
import type { CollectionForecastInput, CollectionForecastResult, TenantRiskInput } from '@/lib/wasm/types';

interface CollectionForecastProps {
  propertyManagerId: string;
  organizationId: string;
  tenants: TenantRiskInput[];
  forecastMonth?: string;
  historicalRate?: number;
}

export function CollectionForecast({
  propertyManagerId,
  organizationId,
  tenants,
  forecastMonth,
  historicalRate = 95,
}: CollectionForecastProps) {
  const [result, setResult] = useState<CollectionForecastResult | null>(null);
  const [loading, setLoading] = useState(false);

  const currentMonth = forecastMonth || new Date().toISOString().slice(0, 7);

  useEffect(() => {
    if (tenants.length > 0) {
      fetchForecast();
    }
  }, [tenants, currentMonth]);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const input: CollectionForecastInput = {
        property_manager_id: propertyManagerId,
        organization_id: organizationId,
        forecast_month: currentMonth,
        tenants,
        historical_collection_rate: historicalRate,
        seasonal_adjustment: true,
      };
      const forecastResult = await calculateCollectionForecast(input);
      setResult(forecastResult);
    } catch (err) {
      console.error('Forecast calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="h-32 w-full bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
          No forecast data available
        </CardContent>
      </Card>
    );
  }

  const chartData = result.monthly_forecasts.map(f => ({
    month: f.month,
    displayMonth: formatMonth(f.month),
    rate: f.expected_rate,
    amount: f.expected_amount,
    confidence: f.confidence * 100,
  }));

  const rateChange = result.expected_collection_rate - historicalRate;
  const isImproving = rateChange > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Collection Forecast
            </CardTitle>
            <CardDescription>
              {formatMonth(result.forecast_month)} projection with 3-month outlook
            </CardDescription>
          </div>
          <Badge variant={isImproving ? 'default' : 'secondary'} className="flex items-center gap-1">
            {isImproving ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {rateChange > 0 ? '+' : ''}{rateChange.toFixed(1)}% vs historical
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <DollarSign className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-sm text-muted-foreground">Expected Collection</p>
            <p className="text-2xl font-bold text-blue-700">
              ${result.expected_collection_amount.toLocaleString()}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-sm text-muted-foreground">Collection Rate</p>
            <p className="text-2xl font-bold text-green-700">
              {result.expected_collection_rate.toFixed(1)}%
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <AlertTriangle className="h-5 w-5 text-orange-600 mx-auto mb-1" />
            <p className="text-sm text-muted-foreground">Expected Shortfall</p>
            <p className="text-2xl font-bold text-orange-700">
              ${result.expected_shortfall.toLocaleString()}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <Users className="h-5 w-5 text-purple-600 mx-auto mb-1" />
            <p className="text-sm text-muted-foreground">At-Risk Tenants</p>
            <p className="text-2xl font-bold text-purple-700">
              {result.at_risk_tenants.length}
            </p>
          </div>
        </div>

        {/* Confidence Interval */}
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Confidence Range ({(result.confidence_interval.confidence * 100).toFixed(0)}%)</span>
            <span className="text-sm text-muted-foreground">
              {result.confidence_interval.lower.toFixed(1)}% - {result.confidence_interval.upper.toFixed(1)}%
            </span>
          </div>
          <div className="relative h-4 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-blue-200"
              style={{
                left: `${result.confidence_interval.lower}%`,
                width: `${result.confidence_interval.upper - result.confidence_interval.lower}%`,
              }}
            />
            <div
              className="absolute h-full w-1 bg-blue-600"
              style={{ left: `${result.expected_collection_rate}%` }}
            />
          </div>
        </div>

        {/* 3-Month Forecast Chart */}
        <div>
          <h4 className="font-medium mb-3">3-Month Rolling Forecast</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayMonth" />
                <YAxis yAxisId="left" domain={[80, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'rate') return [`${value.toFixed(1)}%`, 'Collection Rate'];
                    if (name === 'amount') return [`$${value.toLocaleString()}`, 'Expected Amount'];
                    return [value, name];
                  }}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="amount"
                  fill="#e0f2fe"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="rate"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* At-Risk Tenants */}
        {result.at_risk_tenants.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              At-Risk Tenants ({result.at_risk_tenants.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {result.at_risk_tenants.map((tenant, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{tenant.renter_name}</p>
                    <p className="text-xs text-muted-foreground">{tenant.property_address}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-orange-700">${tenant.rent_amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {tenant.payment_likelihood.toFixed(0)}% likelihood
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default CollectionForecast;
