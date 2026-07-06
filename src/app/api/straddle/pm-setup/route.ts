/**
 * Property Manager Payment Setup API
 *
 * Uses Straddle's platform model:
 * 1. Create Organization (one per PM company)
 * 2. Create Account (business) within the org
 * 3. Simulate to active (sandbox) or wait for onboarding (production)
 */

import { NextResponse } from 'next/server';
import { straddleAPI } from '@/lib/straddle';

const straddlePlatformAPI = straddleAPI;

// POST - Create a PM organization + account
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { companyName, website, phone, address, externalId } = data;

    if (!companyName || !address) {
      return NextResponse.json(
        { error: 'Missing required fields: companyName, address' },
        { status: 400 }
      );
    }

    // Step 1: Create organization
    const org = await straddlePlatformAPI.createOrganization({
      name: companyName,
      external_id: externalId ? `org_${externalId}` : undefined,
    });

    // Step 2: Create business account under the org
    const account = await straddlePlatformAPI.createAccount({
      organization_id: org.id,
      account_type: 'business',
      access_level: 'standard',
      business_profile: {
        name: companyName,
        website: website || undefined,
        phone: phone || undefined,
        address: {
          line1: address.line1,
          line2: address.line2 || undefined,
          city: address.city,
          state: address.state,
          postal_code: address.postalCode || address.zipCode,
          country: 'US',
        },
      },
      external_id: externalId ? `acct_${externalId}` : undefined,
    });

    // Step 3: In sandbox, simulate to active
    if (process.env.NODE_ENV !== 'production') {
      try {
        await straddlePlatformAPI.simulateAccount(account.id, 'active');
        account.status = 'active';
      } catch (e) {
        console.warn('Sandbox simulation failed:', e);
      }
    }

    return NextResponse.json({
      success: true,
      organization: {
        id: org.id,
        name: org.name,
      },
      account: {
        id: account.id,
        status: account.status,
        name: account.business_profile?.name,
        capabilities: account.capabilities,
        settings: account.settings,
      },
      message: account.status === 'active'
        ? 'Account created and active. Ready to accept payments.'
        : 'Account created. Onboarding in progress.',
    });
  } catch (error: any) {
    console.error('PM Setup Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create business account' },
      { status: 500 }
    );
  }
}

// GET - Get PM account status
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId query parameter required' },
        { status: 400 }
      );
    }

    const account = await straddlePlatformAPI.getAccount(accountId);

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        organizationId: account.organization_id,
        status: account.status,
        name: account.business_profile?.name,
        isActive: account.status === 'active',
        capabilities: account.capabilities,
        settings: account.settings,
      },
    });
  } catch (error: any) {
    console.error('PM Status Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get account status' },
      { status: 500 }
    );
  }
}
