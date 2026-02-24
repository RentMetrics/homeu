/**
 * Apartment Desirability Score API
 *
 * POST /api/scores/desirability
 * Calculates desirability score for an apartment listing
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateDesirability } from '@/lib/wasm/resident-scores';
import type { DesirabilityInput } from '@/lib/wasm/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'current_rent',
      'market_rent',
      'occupancy_rate',
      'rent_trend_3mo',
      'rent_trend_12mo',
      'amenity_count',
      'building_year',
      'unit_sqft',
      'price_per_sqft',
      'market_price_per_sqft',
    ];

    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Build input with defaults for optional fields
    const input: DesirabilityInput = {
      current_rent: body.current_rent,
      market_rent: body.market_rent,
      occupancy_rate: body.occupancy_rate,
      rent_trend_3mo: body.rent_trend_3mo,
      rent_trend_12mo: body.rent_trend_12mo,
      google_rating: body.google_rating,
      walkability_score: body.walkability_score,
      transit_score: body.transit_score,
      amenity_count: body.amenity_count,
      building_year: body.building_year,
      unit_sqft: body.unit_sqft,
      price_per_sqft: body.price_per_sqft,
      market_price_per_sqft: body.market_price_per_sqft,
      has_concessions: body.has_concessions ?? false,
      concession_value: body.concession_value ?? 0,
    };

    // Calculate score
    const result = await calculateDesirability(input);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[API] Desirability calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate desirability score' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Apartment Desirability Score API',
    method: 'POST',
    description: 'Calculate apartment desirability score based on market factors, location, amenities, and value',
    required_fields: [
      'current_rent',
      'market_rent',
      'occupancy_rate',
      'rent_trend_3mo',
      'rent_trend_12mo',
      'amenity_count',
      'building_year',
      'unit_sqft',
      'price_per_sqft',
      'market_price_per_sqft',
    ],
    optional_fields: [
      'google_rating',
      'walkability_score',
      'transit_score',
      'has_concessions',
      'concession_value',
    ],
  });
}
