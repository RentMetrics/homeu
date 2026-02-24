/**
 * Rent Roll Risk Score API
 *
 * POST /api/scores/rent-roll-risk
 * Calculates risk scores for tenants in a rent roll
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateTenantRisk, calculateTenantRisksBatch } from '@/lib/wasm/pm-scores';
import type { TenantRiskInput } from '@/lib/wasm/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if batch or single tenant
    const isBatch = Array.isArray(body.tenants);

    if (isBatch) {
      // Batch calculation
      const tenants: TenantRiskInput[] = body.tenants.map((t: any) => validateTenantInput(t));
      const results = await calculateTenantRisksBatch(tenants);

      return NextResponse.json({
        success: true,
        count: results.length,
        data: results,
      });
    } else {
      // Single tenant calculation
      const input = validateTenantInput(body);
      const result = await calculateTenantRisk(input);

      return NextResponse.json({
        success: true,
        data: result,
      });
    }
  } catch (error) {
    console.error('[API] Rent roll risk calculation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to calculate risk score' },
      { status: 500 }
    );
  }
}

function validateTenantInput(body: any): TenantRiskInput {
  const requiredFields = [
    'renter_id',
    'renter_name',
    'property_id',
    'property_address',
    'rent_amount',
  ];

  for (const field of requiredFields) {
    if (body[field] === undefined) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return {
    renter_id: body.renter_id,
    renter_name: body.renter_name,
    property_id: body.property_id,
    property_address: body.property_address,

    // Payment history
    on_time_payments: body.on_time_payments ?? 0,
    late_payments: body.late_payments ?? 0,
    average_days_late: body.average_days_late ?? 0,
    missed_payments: body.missed_payments ?? 0,

    // Balance check
    has_sufficient_balance: body.has_sufficient_balance ?? false,
    balance_check_date: body.balance_check_date,
    account_status: body.account_status ?? 'unknown',

    // Income/Employment
    rent_amount: body.rent_amount,
    verified_income: body.verified_income,
    employment_verified: body.employment_verified ?? false,

    // Lease info
    lease_months_remaining: body.lease_months_remaining ?? 0,
    is_month_to_month: body.is_month_to_month ?? false,
    lease_start_date: body.lease_start_date ?? Date.now(),
  };
}

export async function GET() {
  return NextResponse.json({
    name: 'Rent Roll Risk Score API',
    method: 'POST',
    description: 'Calculate risk scores for tenants (single or batch)',
    single_tenant: {
      required_fields: [
        'renter_id',
        'renter_name',
        'property_id',
        'property_address',
        'rent_amount',
      ],
      optional_fields: [
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
    batch: {
      format: '{ tenants: [tenant1, tenant2, ...] }',
    },
  });
}
