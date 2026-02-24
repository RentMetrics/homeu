/**
 * Collection Likelihood Forecast API
 *
 * POST /api/scores/collection-likelihood
 * Forecasts rent collection rates for a portfolio
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateCollectionForecast, calculatePortfolioRisk, calculatePortfolioSummary } from '@/lib/wasm/pm-scores';
import type { CollectionForecastInput, PortfolioRiskInput, TenantRiskInput } from '@/lib/wasm/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'property_manager_id',
      'organization_id',
      'forecast_month',
      'tenants',
    ];

    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    if (!Array.isArray(body.tenants) || body.tenants.length === 0) {
      return NextResponse.json(
        { error: 'tenants must be a non-empty array' },
        { status: 400 }
      );
    }

    // Check if this is a full portfolio request or single month forecast
    const isPortfolioRequest = body.include_portfolio === true;

    // Validate and transform tenant inputs
    const tenants: TenantRiskInput[] = body.tenants.map((t: any) => ({
      renter_id: t.renter_id || 'unknown',
      renter_name: t.renter_name || 'Unknown',
      property_id: t.property_id || '',
      property_address: t.property_address || '',
      on_time_payments: t.on_time_payments ?? 0,
      late_payments: t.late_payments ?? 0,
      average_days_late: t.average_days_late ?? 0,
      missed_payments: t.missed_payments ?? 0,
      has_sufficient_balance: t.has_sufficient_balance ?? false,
      balance_check_date: t.balance_check_date,
      account_status: t.account_status ?? 'unknown',
      rent_amount: t.rent_amount ?? 0,
      verified_income: t.verified_income,
      employment_verified: t.employment_verified ?? false,
      lease_months_remaining: t.lease_months_remaining ?? 0,
      is_month_to_month: t.is_month_to_month ?? false,
      lease_start_date: t.lease_start_date ?? Date.now(),
    }));

    if (isPortfolioRequest) {
      // Full portfolio risk analysis with multiple months
      const forecastMonths = body.forecast_months || [body.forecast_month];

      const portfolioInput: PortfolioRiskInput = {
        property_manager_id: body.property_manager_id,
        organization_id: body.organization_id,
        tenants,
        historical_collection_rate: body.historical_collection_rate ?? 95,
        forecast_months: forecastMonths,
      };

      const [portfolioRisk, portfolioSummary] = await Promise.all([
        calculatePortfolioRisk(portfolioInput),
        calculatePortfolioSummary(portfolioInput),
      ]);

      return NextResponse.json({
        success: true,
        type: 'portfolio',
        data: {
          risk: portfolioRisk,
          summary: portfolioSummary,
        },
      });
    } else {
      // Single month forecast
      const forecastInput: CollectionForecastInput = {
        property_manager_id: body.property_manager_id,
        organization_id: body.organization_id,
        forecast_month: body.forecast_month,
        tenants,
        historical_collection_rate: body.historical_collection_rate ?? 95,
        seasonal_adjustment: body.seasonal_adjustment ?? true,
      };

      const result = await calculateCollectionForecast(forecastInput);

      return NextResponse.json({
        success: true,
        type: 'forecast',
        data: result,
      });
    }
  } catch (error) {
    console.error('[API] Collection likelihood calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate collection likelihood' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Collection Likelihood Forecast API',
    method: 'POST',
    description: 'Forecast rent collection rates for a portfolio with seasonal adjustments',
    required_fields: [
      'property_manager_id',
      'organization_id',
      'forecast_month (YYYY-MM)',
      'tenants (array of tenant objects)',
    ],
    optional_fields: [
      'historical_collection_rate (0-100, default: 95)',
      'seasonal_adjustment (default: true)',
      'include_portfolio (true for full portfolio analysis)',
      'forecast_months (array of YYYY-MM, for portfolio analysis)',
    ],
    tenant_object: {
      required: ['renter_id', 'rent_amount'],
      optional: [
        'renter_name',
        'property_id',
        'property_address',
        'on_time_payments',
        'late_payments',
        'average_days_late',
        'missed_payments',
        'has_sufficient_balance',
        'balance_check_date',
        'account_status',
        'verified_income',
        'employment_verified',
        'lease_months_remaining',
        'is_month_to_month',
        'lease_start_date',
      ],
    },
    response: {
      single_forecast: {
        expected_collection_rate: '0-100%',
        expected_collection_amount: 'dollar amount',
        expected_shortfall: 'dollar amount',
        at_risk_tenants: 'list of high-risk tenants',
        monthly_forecasts: '3-month rolling forecast',
      },
      portfolio: {
        overall_risk_score: '0-100',
        risk_distribution: 'low/moderate/high/critical counts',
        forecasts: 'multi-month forecasts',
        summary: 'portfolio statistics',
      },
    },
  });
}
