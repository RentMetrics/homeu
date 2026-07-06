'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lock,
  Sparkles,
  RefreshCw,
  Calendar,
  Eye,
  EyeOff,
  Crown,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';

interface RentPredictionCardProps {
  propertyManagerId: string;
  organizationId: string;
}

export function RentPredictionCard({ propertyManagerId, organizationId }: RentPredictionCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Check feature access
  const accessCheck = useQuery(api.rentPredictions.hasRentPredictionAccess, {
    propertyManagerId,
  });

  // Get current prediction
  const predictionSummary = useQuery(api.rentPredictions.getPredictionSummary, {
    propertyManagerId,
  });

  // Get active renters for generating new prediction
  const activeRenters = useQuery(api.rentPredictions.getActiveRentersForPrediction, {
    propertyManagerId,
  });

  // Mutation to store prediction
  const storePrediction = useMutation(api.rentPredictions.storePrediction);

  const handleGeneratePrediction = async () => {
    if (!activeRenters || activeRenters.length === 0) {
      toast.error('No active renters found to generate prediction');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/rent-prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${propertyManagerId}`,
        },
        body: JSON.stringify({
          propertyManagerId,
          organizationId,
          renters: activeRenters,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate prediction');
      }

      // Store the prediction in Convex
      await storePrediction({
        ...data.prediction,
      });

      toast.success('Rent prediction generated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate prediction');
    } finally {
      setIsGenerating(false);
    }
  };

  // Premium upgrade prompt
  if (!accessCheck?.hasAccess) {
    return (
      <Card className="border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-white">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
            <Lock className="h-6 w-6 text-purple-600" />
          </div>
          <CardTitle className="text-xl">Rent Collection Prediction</CardTitle>
          <CardDescription>
            Premium feature for Pro & Enterprise plans
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-white p-4 rounded-lg border space-y-3">
            <div className="flex items-center gap-2 text-left">
              <Sparkles className="h-4 w-4 text-purple-600 flex-shrink-0" />
              <span className="text-sm">Predict rent collection rates before the 1st</span>
            </div>
            <div className="flex items-center gap-2 text-left">
              <Sparkles className="h-4 w-4 text-purple-600 flex-shrink-0" />
              <span className="text-sm">See which residents are likely to pay on time</span>
            </div>
            <div className="flex items-center gap-2 text-left">
              <Sparkles className="h-4 w-4 text-purple-600 flex-shrink-0" />
              <span className="text-sm">Plan ahead with accurate forecasts</span>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-sm text-gray-600 mb-3">
              Upgrade to unlock rent predictions and more premium features
            </p>
            <Button className="bg-purple-600 hover:bg-purple-700 w-full">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Pro
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No prediction yet
  if (!predictionSummary) {
    const now = new Date();
    const currentMonth = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Rent Collection Prediction
              </CardTitle>
              <CardDescription>{currentMonth}</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="font-medium mb-2">No Prediction Generated Yet</h3>
          <p className="text-sm text-gray-600 mb-4 max-w-sm mx-auto">
            Generate a prediction to see the likelihood of your residents paying rent this month.
          </p>
          <Button
            onClick={handleGeneratePrediction}
            disabled={isGenerating || !activeRenters}
            className="bg-green-600 hover:bg-green-700"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Prediction
              </>
            )}
          </Button>
          {activeRenters && (
            <p className="text-xs text-gray-500 mt-2">
              {activeRenters.length} active resident{activeRenters.length !== 1 ? 's' : ''} to analyze
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show prediction
  const { currentMonth, previousMonth, trend } = predictionSummary;

  const getPredictionIcon = (prediction: string) => {
    switch (prediction) {
      case 'likely':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'unlikely':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <HelpCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getPredictionBadge = (prediction: string) => {
    switch (prediction) {
      case 'likely':
        return <Badge className="bg-green-100 text-green-800">Likely to Pay</Badge>;
      case 'unlikely':
        return <Badge className="bg-red-100 text-red-800">Unlikely</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Uncertain</Badge>;
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <Badge variant="outline" className="border-green-500 text-green-700">High Confidence</Badge>;
      case 'medium':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Medium Confidence</Badge>;
      default:
        return <Badge variant="outline" className="border-gray-500 text-gray-700">Low Confidence</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Rent Collection Prediction
            </CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getConfidenceBadge(currentMonth.confidence)}
            <Button
              variant="outline"
              size="sm"
              onClick={handleGeneratePrediction}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Prediction Display */}
        <div className="text-center py-4">
          <div className="text-5xl font-bold text-green-600 mb-2">
            {currentMonth.collectionRate}%
          </div>
          <p className="text-gray-600">Predicted Collection Rate</p>

          {trend !== null && (
            <div className={`flex items-center justify-center gap-1 mt-2 text-sm ${
              trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
            }`}>
              {trend > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : trend < 0 ? (
                <TrendingDown className="h-4 w-4" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              <span>{trend > 0 ? '+' : ''}{trend.toFixed(1)}% vs last month</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{currentMonth.likelyCount}</span>
            </div>
            <p className="text-xs text-gray-600">Likely to Pay</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{currentMonth.unlikelyCount}</span>
            </div>
            <p className="text-xs text-gray-600">Unlikely</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <HelpCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-2xl font-bold text-yellow-600">{currentMonth.uncertainCount}</span>
            </div>
            <p className="text-xs text-gray-600">Uncertain</p>
          </div>
        </div>

        {/* Amount Predictions */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-600">Expected Collection</span>
            <span className="font-semibold text-green-600">
              ${currentMonth.predictedAmount.toLocaleString()}
            </span>
          </div>
          <Progress
            value={(currentMonth.predictedAmount / currentMonth.totalExpected) * 100}
            className="h-2"
          />
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <span>Total if all pay: ${currentMonth.totalExpected.toLocaleString()}</span>
            <span>{currentMonth.totalResidents} residents</span>
          </div>
        </div>

        {/* Toggle Details */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Hide Resident Details
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              View Resident Details
            </>
          )}
        </Button>

        {/* Resident Details Table */}
        {showDetails && (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resident</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead className="text-right">Rent</TableHead>
                  <TableHead>Prediction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* This would map over residentPredictions from the full prediction query */}
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 py-4">
                    <p className="text-sm">
                      Detailed resident predictions available in full view
                    </p>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-gray-50 border-t">
        <div className="w-full flex items-center justify-between text-xs text-gray-500">
          <span>
            Last updated: {new Date(currentMonth.generatedAt).toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>Predictions are estimates based on current bank data</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

// Compact version for dashboard overview
export function RentPredictionMini({ propertyManagerId }: { propertyManagerId: string }) {
  const accessCheck = useQuery(api.rentPredictions.hasRentPredictionAccess, {
    propertyManagerId,
  });

  const predictionSummary = useQuery(api.rentPredictions.getPredictionSummary, {
    propertyManagerId,
  });

  if (!accessCheck?.hasAccess) {
    return (
      <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Lock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-purple-900">Rent Prediction</p>
                <p className="text-xs text-purple-700">Upgrade to unlock</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-100">
              <Crown className="h-3 w-3 mr-1" />
              Upgrade
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!predictionSummary) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="font-medium">Rent Prediction</p>
                <p className="text-xs text-gray-500">No prediction yet</p>
              </div>
            </div>
            <Button size="sm" variant="outline">
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { currentMonth, trend } = predictionSummary;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Collection Prediction</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">
                  {currentMonth.collectionRate}%
                </span>
                {trend !== null && (
                  <span className={`text-xs flex items-center ${
                    trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {trend > 0 ? <TrendingUp className="h-3 w-3" /> : trend < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                    {trend > 0 ? '+' : ''}{trend.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-900">
              ${currentMonth.predictedAmount.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">expected</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
