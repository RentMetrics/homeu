'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Calendar,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Lightbulb,
} from 'lucide-react';
import { calculateNegotiation } from '@/lib/wasm/resident-scores';
import type { NegotiationResult, NegotiationInput } from '@/lib/wasm/types';

interface NegotiationCalculatorProps {
  initialRent?: number;
  marketRent?: number;
  occupancyRate?: number;
  tenureMonths?: number;
  paymentRate?: number;
}

export function NegotiationCalculator({
  initialRent = 1500,
  marketRent = 1500,
  occupancyRate = 92,
  tenureMonths = 12,
  paymentRate = 95,
}: NegotiationCalculatorProps) {
  const [input, setInput] = useState<NegotiationInput>({
    current_rent: initialRent,
    market_rent: marketRent,
    occupancy_rate: occupancyRate,
    current_month: new Date().getMonth() + 1,
    tenant_tenure_months: tenureMonths,
    on_time_payment_rate: paymentRate,
    market_rent_growth: 3,
    competing_offers: 0,
  });

  const [result, setResult] = useState<NegotiationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showScripts, setShowScripts] = useState(false);
  const [copiedScript, setCopiedScript] = useState<number | null>(null);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const negotiationResult = await calculateNegotiation(input);
      setResult(negotiationResult);
    } catch (err) {
      console.error('Negotiation calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyScript = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedScript(index);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  const getPowerColor = (power: number) => {
    if (power >= 70) return 'text-green-600';
    if (power >= 50) return 'text-blue-600';
    if (power >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPowerLabel = (power: number) => {
    if (power >= 70) return 'Strong';
    if (power >= 50) return 'Moderate';
    if (power >= 30) return 'Limited';
    return 'Weak';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-green-600" />
          Rent Negotiation Calculator
        </CardTitle>
        <CardDescription>
          Calculate your negotiation power and get strategies for your rent discussion
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Form */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="current_rent">Current Rent ($)</Label>
            <Input
              id="current_rent"
              type="number"
              value={input.current_rent}
              onChange={(e) => setInput({ ...input, current_rent: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="market_rent">Market Rent ($)</Label>
            <Input
              id="market_rent"
              type="number"
              value={input.market_rent}
              onChange={(e) => setInput({ ...input, market_rent: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="occupancy">Building Occupancy (%)</Label>
            <Input
              id="occupancy"
              type="number"
              min="0"
              max="100"
              value={input.occupancy_rate}
              onChange={(e) => setInput({ ...input, occupancy_rate: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenure">Your Tenure (months)</Label>
            <Input
              id="tenure"
              type="number"
              value={input.tenant_tenure_months}
              onChange={(e) => setInput({ ...input, tenant_tenure_months: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment_rate">On-Time Payment Rate (%)</Label>
            <Input
              id="payment_rate"
              type="number"
              min="0"
              max="100"
              value={input.on_time_payment_rate}
              onChange={(e) => setInput({ ...input, on_time_payment_rate: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="competing">Competing Applicants</Label>
            <Input
              id="competing"
              type="number"
              min="0"
              value={input.competing_offers}
              onChange={(e) => setInput({ ...input, competing_offers: Number(e.target.value) })}
            />
          </div>
        </div>

        <Button onClick={handleCalculate} disabled={loading} className="w-full">
          {loading ? 'Calculating...' : 'Calculate Negotiation Power'}
        </Button>

        {/* Results */}
        {result && (
          <div className="space-y-6 pt-4 border-t">
            {/* Power Score */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Your Negotiation Power</p>
              <div className="flex items-center justify-center gap-3">
                <span className={`text-4xl font-bold ${getPowerColor(result.negotiation_power)}`}>
                  {result.negotiation_power}%
                </span>
                <Badge variant="outline" className={getPowerColor(result.negotiation_power)}>
                  {getPowerLabel(result.negotiation_power)}
                </Badge>
              </div>
              <Progress value={result.negotiation_power} className="mt-3 h-2" />
            </div>

            {/* Key Numbers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <DollarSign className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <p className="text-sm text-muted-foreground">Suggested Rent</p>
                <p className="text-2xl font-bold text-green-700">${result.suggested_rent.toFixed(0)}</p>
                <p className="text-xs text-green-600">
                  Save ${(input.current_rent - result.suggested_rent).toFixed(0)}/mo
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <TrendingUp className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <p className="text-sm text-muted-foreground">Max Discount</p>
                <p className="text-2xl font-bold text-blue-700">{result.max_discount}%</p>
                <p className="text-xs text-blue-600">
                  ${(input.current_rent * result.max_discount / 100).toFixed(0)} potential savings
                </p>
              </div>
            </div>

            {/* Leverage Factors */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Your Leverage Factors
              </h4>
              {result.leverage_factors.map((factor, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{factor.name}</p>
                    <p className="text-xs text-muted-foreground">{factor.description}</p>
                  </div>
                  <Badge variant={factor.points > 0 ? 'default' : 'secondary'}>
                    {factor.points > 0 ? '+' : ''}{factor.points} pts
                  </Badge>
                </div>
              ))}
            </div>

            {/* Best Timing */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium text-purple-800">Timing Insight</p>
                  <p className="text-sm text-purple-700">{result.best_timing}</p>
                </div>
              </div>
            </div>

            {/* Suggested Asks */}
            <div className="space-y-2">
              <h4 className="font-medium">What to Ask For</h4>
              <ul className="space-y-2">
                {result.suggested_asks.map((ask, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-1">✓</span>
                    {ask}
                  </li>
                ))}
              </ul>
            </div>

            {/* Negotiation Scripts */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => setShowScripts(!showScripts)}
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Negotiation Scripts
                </span>
                {showScripts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>

              {showScripts && (
                <div className="space-y-4">
                  {result.scripts.map((script, i) => (
                    <div key={i} className="bg-muted rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{script.scenario}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyScript(script.script, i)}
                        >
                          {copiedScript === i ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-foreground italic">&quot;{script.script}&quot;</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default NegotiationCalculator;
