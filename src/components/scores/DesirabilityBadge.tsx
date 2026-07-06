'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { calculateDesirability } from '@/lib/wasm/resident-scores';
import type { DesirabilityResult, DesirabilityInput, ScoreGrade } from '@/lib/wasm/types';

interface DesirabilityBadgeProps {
  input?: DesirabilityInput;
  cachedResult?: DesirabilityResult;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const gradeStyles: Record<ScoreGrade, { bg: string; text: string; border: string }> = {
  Excellent: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  Good: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  Fair: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  Poor: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  VeryPoor: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
};

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function DesirabilityBadge({
  input,
  cachedResult,
  size = 'md',
  showTooltip = true,
}: DesirabilityBadgeProps) {
  const [result, setResult] = useState<DesirabilityResult | null>(cachedResult || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cachedResult) {
      setResult(cachedResult);
    } else if (input) {
      fetchScore();
    }
  }, [input, cachedResult]);

  const fetchScore = async () => {
    if (!input) return;

    setLoading(true);
    try {
      const scoreResult = await calculateDesirability(input);
      setResult(scoreResult);
    } catch (err) {
      console.error('Desirability calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Badge variant="outline" className={`animate-pulse ${sizeStyles[size]}`}>
        <span className="w-8 h-4 bg-gray-200 rounded" />
      </Badge>
    );
  }

  if (!result) {
    return null;
  }

  const style = gradeStyles[result.grade] || gradeStyles.Fair;

  const getTrendIcon = () => {
    if (result.score >= 75) return <TrendingUp className="h-3 w-3" />;
    if (result.score <= 40) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const badge = (
    <Badge
      variant="outline"
      className={`${style.bg} ${style.text} ${style.border} ${sizeStyles[size]} inline-flex items-center gap-1`}
    >
      <Star className={`h-3 w-3 ${size === 'sm' ? 'h-2.5 w-2.5' : ''}`} />
      <span className="font-semibold">{result.score}</span>
      {size !== 'sm' && getTrendIcon()}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Desirability Score</span>
              <span className={`font-bold ${style.text}`}>
                {result.score}/100 - {result.grade === 'VeryPoor' ? 'Very Poor' : result.grade}
              </span>
            </div>
            <p className="text-xs text-gray-600">{result.summary}</p>
            <div className="pt-2 border-t">
              <p className="text-xs font-medium text-gray-700">Key Factors:</p>
              <ul className="text-xs text-gray-500 mt-1 space-y-0.5">
                {result.factors.slice(0, 3).map((factor, i) => (
                  <li key={i}>
                    {factor.name}: {Math.round(factor.value)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Simpler inline score display
export function DesirabilityScore({ score, grade }: { score: number; grade: ScoreGrade }) {
  const style = gradeStyles[grade] || gradeStyles.Fair;

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${style.bg}`}>
      <Star className={`h-3 w-3 ${style.text}`} />
      <span className={`text-sm font-semibold ${style.text}`}>{score}</span>
    </div>
  );
}

export default DesirabilityBadge;
