/**
 * Rent Negotiation Calculator API
 *
 * POST /api/scores/negotiation
 * Calculates negotiation power and provides strategies
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateNegotiation } from '@/lib/wasm/resident-scores';
import type { NegotiationInput } from '@/lib/wasm/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'current_rent',
      'market_rent',
      'occupancy_rate',
      'current_month',
      'tenant_tenure_months',
      'on_time_payment_rate',
    ];

    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate month is 1-12
    if (body.current_month < 1 || body.current_month > 12) {
      return NextResponse.json(
        { error: 'current_month must be between 1 and 12' },
        { status: 400 }
      );
    }

    const input: NegotiationInput = {
      current_rent: body.current_rent,
      market_rent: body.market_rent,
      occupancy_rate: body.occupancy_rate,
      current_month: body.current_month,
      tenant_tenure_months: body.tenant_tenure_months,
      on_time_payment_rate: body.on_time_payment_rate,
      market_rent_growth: body.market_rent_growth ?? 3.0,
      competing_offers: body.competing_offers ?? 0,
    };

    const result = await calculateNegotiation(input);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[API] Negotiation calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate negotiation power' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Rent Negotiation Calculator API',
    method: 'POST',
    description: 'Calculate negotiation power and get strategies for rent reduction',
    required_fields: [
      'current_rent',
      'market_rent',
      'occupancy_rate',
      'current_month (1-12)',
      'tenant_tenure_months',
      'on_time_payment_rate (0-100)',
    ],
    optional_fields: [
      'market_rent_growth (default: 3.0)',
      'competing_offers (default: 0)',
    ],
  });
}
