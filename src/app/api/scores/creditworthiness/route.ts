/**
 * Credit Worthiness Assessment API
 *
 * POST /api/scores/creditworthiness
 * Calculates credit score (actual or proxy) for a renter
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateCreditworthiness } from '@/lib/wasm/pm-scores';
import type { CreditworthinessInput } from '@/lib/wasm/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required field
    if (!body.renter_id) {
      return NextResponse.json(
        { error: 'Missing required field: renter_id' },
        { status: 400 }
      );
    }

    const input: CreditworthinessInput = {
      renter_id: body.renter_id,

      // Actual credit score if available
      actual_credit_score: body.actual_credit_score,

      // HomeU data for proxy calculation
      on_time_payments: body.on_time_payments ?? 0,
      late_payments: body.late_payments ?? 0,
      missed_payments: body.missed_payments ?? 0,
      rental_tenure_months: body.rental_tenure_months ?? 0,
      employment_months: body.employment_months ?? 0,
      employment_verified: body.employment_verified ?? false,
      income_consistency: body.income_consistency ?? 50,
      previous_evictions: body.previous_evictions ?? 0,
    };

    const result = await calculateCreditworthiness(input);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[API] Creditworthiness calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate creditworthiness' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Credit Worthiness Assessment API',
    method: 'POST',
    description: 'Calculate credit score (300-850) - uses actual score if provided, otherwise calculates proxy from HomeU data',
    required_fields: ['renter_id'],
    optional_fields: [
      'actual_credit_score (if available, this will be used directly)',
      'on_time_payments',
      'late_payments',
      'missed_payments',
      'rental_tenure_months',
      'employment_months',
      'employment_verified',
      'income_consistency (0-100)',
      'previous_evictions',
    ],
    response: {
      credit_score: '300-850',
      is_proxy: 'true if calculated from HomeU data',
      credit_tier: 'Excellent | Good | Fair | Poor | VeryPoor',
      deposit_multiplier: '1.0 - 2.5x recommended deposit',
    },
  });
}
