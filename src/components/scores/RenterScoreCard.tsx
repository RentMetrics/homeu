'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Star,
  TrendingUp,
  Shield,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Award,
} from 'lucide-react';
import { calculateRenterScore } from '@/lib/wasm/resident-scores';
import type { RenterScoreResult, RenterScoreInput, ScoreGrade } from '@/lib/wasm/types';

interface RenterScoreCardProps {
  input?: RenterScoreInput;
  cachedResult?: RenterScoreResult;
  onScoreCalculated?: (result: RenterScoreResult) => void;
  compact?: boolean;
}

const gradeConfig: Record<ScoreGrade, { color: string; bgColor: string; icon: typeof Star }> = {
  Excellent: { color: 'text-green-600', bgColor: 'bg-green-100', icon: Sparkles },
  Good: { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Star },
  Fair: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: TrendingUp },
  Poor: { color: 'text-orange-600', bgColor: 'bg-orange-100', icon: AlertCircle },
  VeryPoor: { color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertCircle },
};

const tierConfig: Record<string, { color: string; label: string }> = {
  platinum: { color: '#E5E4E2', label: 'Platinum' },
  gold: { color: '#FFD700', label: 'Gold' },
  silver: { color: '#C0C0C0', label: 'Silver' },
  bronze: { color: '#CD7F32', label: 'Bronze' },
};

export function RenterScoreCard({
  input,
  cachedResult,
  onScoreCalculated,
  compact = false,
}: RenterScoreCardProps) {
  const [result, setResult] = useState<RenterScoreResult | null>(cachedResult || null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedResult) {
      setResult(cachedResult);
    }
  }, [cachedResult]);

  useEffect(() => {
    if (input && !cachedResult) {
      calculateScore();
    }
  }, [input]);

  const calculateScore = async () => {
    if (!input) return;

    setLoading(true);
    setError(null);

    try {
      const scoreResult = await calculateRenterScore(input);
      setResult(scoreResult);
      onScoreCalculated?.(scoreResult);
    } catch (err) {
      setError('Failed to calculate score');
      console.error('Score calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={compact ? 'p-4' : ''}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-full bg-muted" />
            <div className="h-4 w-24 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={compact ? 'p-4' : ''}>
        <CardContent className="flex items-center justify-center py-8 text-red-500">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className={compact ? 'p-4' : ''}>
        <CardContent className="flex items-center justify-center py-8 text-gray-500">
          No score data available
        </CardContent>
      </Card>
    );
  }

  const grade = gradeConfig[result.grade] || gradeConfig.Fair;
  const tier = tierConfig[result.tier] || tierConfig.bronze;
  const GradeIcon = grade.icon;

  if (compact) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${grade.bgColor}`}>
                <GradeIcon className={`h-5 w-5 ${grade.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">HomeU Score</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{result.score}</span>
                  <Badge
                    variant="outline"
                    style={{ borderColor: tier.color, color: tier.color }}
                  >
                    {tier.label}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {expanded && (
            <div className="mt-4 pt-4 border-t space-y-3">
              {result.factors.slice(0, 3).map((factor, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{factor.name}</span>
                    <span className="font-medium">{Math.round(factor.value)}</span>
                  </div>
                  <Progress value={factor.value} className="h-1.5" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              HomeU Renter Score
            </CardTitle>
            <CardDescription>Your unified tenant quality score</CardDescription>
          </div>
          <Badge
            className="text-sm px-3 py-1"
            style={{ backgroundColor: tier.color, color: tier.color === '#FFD700' ? '#000' : '#fff' }}
          >
            {tier.label} Tier
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Score Display */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className={`w-32 h-32 rounded-full ${grade.bgColor} flex items-center justify-center`}>
              <div className="text-center">
                <span className={`text-4xl font-bold ${grade.color}`}>{result.score}</span>
                <p className="text-sm text-gray-500">/ 100</p>
              </div>
            </div>
            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-sm font-medium ${grade.bgColor} ${grade.color}`}>
              {result.grade === 'VeryPoor' ? 'Very Poor' : result.grade}
            </div>
          </div>
        </div>

        {/* Verified Badges */}
        {result.verified_badges.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {result.verified_badges.map((badge, i) => (
              <Badge key={i} variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                {badge.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            ))}
          </div>
        )}

        {/* Score Factors */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-gray-700">Score Breakdown</h4>
          {result.factors.map((factor, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{factor.name}</span>
                <span className="font-medium">
                  {Math.round(factor.value)} <span className="text-gray-400">({(factor.weight * 100).toFixed(0)}%)</span>
                </span>
              </div>
              <Progress value={factor.value} className="h-2" />
              <p className="text-xs text-gray-500">{factor.description}</p>
            </div>
          ))}
        </div>

        {/* Improvement Tips */}
        {result.improvement_tips.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              How to Improve Your Score
            </h4>
            <ul className="space-y-2">
              {result.improvement_tips.map((tip, i) => (
                <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RenterScoreCard;
