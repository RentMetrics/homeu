/**
 * HomeU Renter Score API
 *
 * POST /api/scores/renter-score
 * Calculates unified tenant quality score
 *
 * GET /api/scores/renter-score?userId=xxx
 * Retrieves cached score for a user or calculates fresh
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateRenterScore } from '@/lib/wasm/resident-scores';
import type { RenterScoreInput } from '@/lib/wasm/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'rental_history_months',
      'annual_income',
      'monthly_rent',
      'on_time_payments',
      'late_payments',
      'missed_payments',
    ];

    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const input: RenterScoreInput = {
      // Rental history
      rental_history_months: body.rental_history_months,
      verified_history: body.verified_history ?? false,
      previous_residences: body.previous_residences ?? 1,
      eviction_history: body.eviction_history ?? false,

      // Employment/Income
      employment_verified: body.employment_verified ?? false,
      annual_income: body.annual_income,
      monthly_rent: body.monthly_rent,
      employment_tenure_months: body.employment_tenure_months ?? 0,

      // Payment history
      on_time_payments: body.on_time_payments,
      late_payments: body.late_payments,
      missed_payments: body.missed_payments,
      current_streak: body.current_streak ?? 0,
      longest_streak: body.longest_streak ?? 0,

      // Verification status
      identity_verified: body.identity_verified ?? false,
      bank_linked: body.bank_linked ?? false,

      // Financial standing
      has_sufficient_balance: body.has_sufficient_balance ?? false,
      balance_check_passed: body.balance_check_passed ?? false,
    };

    const result = await calculateRenterScore(input);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[API] Renter score calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate renter score' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({
      name: 'HomeU Renter Score API',
      method: 'POST or GET',
      description: 'Calculate or retrieve unified tenant quality score (0-100)',
      required_fields: [
        'rental_history_months',
        'annual_income',
        'monthly_rent',
        'on_time_payments',
        'late_payments',
        'missed_payments',
      ],
      optional_fields: [
        'verified_history',
        'previous_residences',
        'eviction_history',
        'employment_verified',
        'employment_tenure_months',
        'current_streak',
        'longest_streak',
        'identity_verified',
        'bank_linked',
        'has_sufficient_balance',
        'balance_check_passed',
      ],
      get_usage: 'GET /api/scores/renter-score?userId=xxx',
    });
  }

  // TODO: Fetch from Convex cache or calculate from user data
  // For now, return a placeholder response
  return NextResponse.json({
    success: true,
    cached: false,
    message: 'Use POST with user data to calculate score',
  });
}
