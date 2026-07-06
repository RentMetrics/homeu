'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  RefreshCw,
  Download,
} from 'lucide-react';
import { calculatePortfolioRisk, calculatePortfolioSummary } from '@/lib/wasm/pm-scores';
import type { PortfolioRiskInput, PortfolioRiskResult, PortfolioSummary, TenantRiskInput } from '@/lib/wasm/types';

interface PortfolioRiskDashboardProps {
  propertyManagerId: string;
  organizationId: string;
  tenants: TenantRiskInput[];
  historicalRate?: number;
}

const RISK_COLORS = {
  low: '#22c55e',
  moderate: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

export function PortfolioRiskDashboard({
  propertyManagerId,
  organizationId,
  tenants,
  historicalRate = 95,
}: PortfolioRiskDashboardProps) {
  const [risk, setRisk] = useState<PortfolioRiskResult | null>(null);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const nextMonths = [0, 1, 2].map(i => {
    const date = new Date();
    date.setMonth(date.getMonth() + i);
    return date.toISOString().slice(0, 7);
  });

  useEffect(() => {
    if (tenants.length > 0) {
      fetchPortfolioData();
    }
  }, [tenants]);

  const fetchPortfolioData = async () => {
    setLoading(true);
    try {
      const input: PortfolioRiskInput = {
        property_manager_id: propertyManagerId,
        organization_id: organizationId,
        tenants,
        historical_collection_rate: historicalRate,
        forecast_months: nextMonths,
      };

      const [portfolioRisk, portfolioSummary] = await Promise.all([
        calculatePortfolioRisk(input),
        calculatePortfolioSummary(input),
      ]);

      setRisk(portfolioRisk);
      setSummary(portfolioSummary);
    } catch (err) {
      console.error('Portfolio risk calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!risk || !summary) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Shield className="h-12 w-12 mb-3 opacity-50" />
          <p>No portfolio data available</p>
          <Button variant="outline" className="mt-4" onClick={fetchPortfolioData}>
            Calculate Portfolio Risk
          </Button>
        </CardContent>
      </Card>
    );
  }

  const pieData = [
    { name: 'Low Risk', value: risk.risk_distribution.low, color: RISK_COLORS.low },
    { name: 'Moderate', value: risk.risk_distribution.moderate, color: RISK_COLORS.moderate },
    { name: 'High Risk', value: risk.risk_distribution.high, color: RISK_COLORS.high },
    { name: 'Critical', value: risk.risk_distribution.critical, color: RISK_COLORS.critical },
  ].filter(d => d.value > 0);

  const getRiskLevel = (score: number) => {
    if (score <= 25) return { label: 'Low', color: 'text-green-600', bg: 'bg-green-100' };
    if (score <= 50) return { label: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score <= 75) return { label: 'High', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { label: 'Critical', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const riskLevel = getRiskLevel(risk.overall_risk_score);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Portfolio Risk Dashboard
              </CardTitle>
              <CardDescription>
                Overall portfolio health and risk assessment
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" size="sm" onClick={fetchPortfolioData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Overall Risk Score */}
            <div className="col-span-2 md:col-span-1">
              <div className={`${riskLevel.bg} rounded-xl p-6 text-center`}>
                <p className="text-sm text-muted-foreground mb-1">Portfolio Risk</p>
                <p className={`text-4xl font-bold ${riskLevel.color}`}>
                  {risk.overall_risk_score.toFixed(1)}
                </p>
                <Badge className={`mt-2 ${riskLevel.bg} ${riskLevel.color} border-0`}>
                  {riskLevel.label} Risk
                </Badge>
              </div>
            </div>

            {/* Key Stats */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Tenants</p>
                  <p className="text-xl font-bold">{summary.total_tenants}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">At-Risk Tenants</p>
                  <p className="text-xl font-bold text-orange-600">{summary.at_risk_count}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Rent</p>
                  <p className="text-xl font-bold">${summary.total_monthly_rent.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected Collection</p>
                  <p className="text-xl font-bold">${risk.expected_collection.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Risk Exposure</p>
                <p className="text-xl font-bold text-orange-600">
                  ${summary.at_risk_rent_exposure.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Median Risk Score</p>
                <p className="text-xl font-bold">{summary.median_risk_score.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Distribution & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Risk Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-600 font-medium">Low Risk</span>
                  <span>{risk.risk_distribution.low} tenants</span>
                </div>
                <Progress value={(risk.risk_distribution.low / summary.total_tenants) * 100} className="h-2 bg-muted/50" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-yellow-600 font-medium">Moderate Risk</span>
                  <span>{risk.risk_distribution.moderate} tenants</span>
                </div>
                <Progress value={(risk.risk_distribution.moderate / summary.total_tenants) * 100} className="h-2 bg-muted/50" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-orange-600 font-medium">High Risk</span>
                  <span>{risk.risk_distribution.high} tenants</span>
                </div>
                <Progress value={(risk.risk_distribution.high / summary.total_tenants) * 100} className="h-2 bg-muted/50" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-red-600 font-medium">Critical Risk</span>
                  <span>{risk.risk_distribution.critical} tenants</span>
                </div>
                <Progress value={(risk.risk_distribution.critical / summary.total_tenants) * 100} className="h-2 bg-muted/50" />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Highest Risk Tenant</span>
                <span className="font-medium text-red-600">{summary.highest_risk_tenant || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted-foreground">Lowest Risk Tenant</span>
                <span className="font-medium text-green-600">{summary.lowest_risk_tenant || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Summary */}
      {risk.forecasts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Collection Forecast Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {risk.forecasts.map((forecast, i) => (
                <div key={i} className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">{formatMonth(forecast.forecast_month)}</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {forecast.expected_collection_rate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ${forecast.expected_collection_amount.toLocaleString()} expected
                  </p>
                  {forecast.at_risk_tenants.length > 0 && (
                    <Badge variant="outline" className="mt-2 text-orange-600">
                      {forecast.at_risk_tenants.length} at-risk
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default PortfolioRiskDashboard;
