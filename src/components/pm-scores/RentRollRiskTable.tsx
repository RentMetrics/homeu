'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  Info,
} from 'lucide-react';
import { calculateTenantRisksBatch } from '@/lib/wasm/pm-scores';
import type { TenantRiskInput, TenantRiskResult, RiskCategory } from '@/lib/wasm/types';

interface RentRollRiskTableProps {
  tenants: TenantRiskInput[];
  onRefresh?: () => void;
  loading?: boolean;
}

const riskConfig: Record<RiskCategory, { icon: typeof CheckCircle; color: string; bgColor: string }> = {
  Low: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
  Moderate: { icon: AlertCircle, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  High: { icon: AlertTriangle, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  Critical: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
};

export function RentRollRiskTable({ tenants, onRefresh, loading = false }: RentRollRiskTableProps) {
  const [results, setResults] = useState<TenantRiskResult[]>([]);
  const [calculating, setCalculating] = useState(false);
  const [sortField, setSortField] = useState<'risk_score' | 'payment_likelihood' | 'renter_name'>('risk_score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    if (tenants.length > 0) {
      calculateRisks();
    }
  }, [tenants]);

  const calculateRisks = async () => {
    setCalculating(true);
    try {
      const riskResults = await calculateTenantRisksBatch(tenants);
      setResults(riskResults);
    } catch (err) {
      console.error('Risk calculation error:', err);
    } finally {
      setCalculating(false);
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    const aVal = sortField === 'renter_name' ? a.renter_name : a[sortField];
    const bVal = sortField === 'renter_name' ? b.renter_name : b[sortField];

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const exportCSV = () => {
    const headers = ['Tenant', 'Property', 'Risk Score', 'Payment Likelihood', 'Category', 'Recommended Actions'];
    const rows = sortedResults.map(r => [
      r.renter_name,
      r.property_address,
      r.risk_score,
      r.payment_likelihood,
      r.risk_category,
      r.recommended_actions.join('; '),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rent-roll-risk-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totalRent = tenants.reduce((sum, t) => sum + t.rent_amount, 0);
  const atRiskCount = results.filter(r => r.risk_score > 50).length;
  const avgRisk = results.length > 0
    ? results.reduce((sum, r) => sum + r.risk_score, 0) / results.length
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Rent Roll Risk Assessment
            </CardTitle>
            <CardDescription>
              Individual tenant payment risk analysis
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onRefresh?.();
                calculateRisks();
              }}
              disabled={calculating || loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${calculating ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">Total Tenants</p>
            <p className="text-2xl font-bold">{results.length}</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">At Risk</p>
            <p className="text-2xl font-bold text-orange-600">{atRiskCount}</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">Avg Risk Score</p>
            <p className="text-2xl font-bold">{avgRisk.toFixed(1)}</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">Total Rent</p>
            <p className="text-2xl font-bold">${totalRent.toLocaleString()}</p>
          </div>
        </div>

        {/* Risk Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('renter_name')}
                >
                  Tenant
                  {sortField === 'renter_name' && (
                    sortDir === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                  )}
                </TableHead>
                <TableHead>Property</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted text-center"
                  onClick={() => handleSort('risk_score')}
                >
                  Risk Score
                  {sortField === 'risk_score' && (
                    sortDir === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                  )}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted text-center"
                  onClick={() => handleSort('payment_likelihood')}
                >
                  Payment Likelihood
                  {sortField === 'payment_likelihood' && (
                    sortDir === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />
                  )}
                </TableHead>
                <TableHead className="text-center">Category</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedResults.map((result) => {
                const config = riskConfig[result.risk_category];
                const RiskIcon = config.icon;
                const isExpanded = expandedRow === result.renter_id;

                return (
                  <>
                    <TableRow
                      key={result.renter_id}
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => setExpandedRow(isExpanded ? null : result.renter_id)}
                    >
                      <TableCell className="font-medium">{result.renter_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {result.property_address}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={result.risk_score} className="w-16 h-2" />
                          <span className="text-sm font-medium w-8">{result.risk_score}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-medium ${result.payment_likelihood >= 70 ? 'text-green-600' : result.payment_likelihood >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {result.payment_likelihood}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${config.bgColor} ${config.color} border-0`}>
                          <RiskIcon className="h-3 w-3 mr-1" />
                          {result.risk_category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground hover:text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <ul className="text-xs space-y-1">
                                {result.recommended_actions.map((action, i) => (
                                  <li key={i}>• {action}</li>
                                ))}
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${result.renter_id}-expanded`}>
                        <TableCell colSpan={6} className="bg-muted p-4">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-medium text-sm mb-2">Risk Factors</h4>
                              <div className="space-y-2">
                                {result.factors.map((factor, i) => (
                                  <div key={i}>
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="text-muted-foreground">{factor.name}</span>
                                      <span>{Math.round(factor.value)}</span>
                                    </div>
                                    <Progress value={factor.value} className="h-1.5" />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm mb-2">Recommended Actions</h4>
                              <ul className="space-y-1">
                                {result.recommended_actions.map((action, i) => (
                                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default RentRollRiskTable;
