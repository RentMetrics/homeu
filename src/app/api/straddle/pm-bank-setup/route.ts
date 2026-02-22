/**
 * PM Bank Setup API - Token-authenticated (no Clerk auth required)
 * Called from the public PM onboarding page to:
 * 1. Create a Straddle customer for the PM
 * 2. Create a bank connection link for them to connect their bank
 */

import { NextResponse } from 'next/server';
import { straddleAPI } from '@/lib/straddle';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { token, pmName, companyName, email, phone } = data;

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token' },
        { status: 400 }
      );
    }

    // Validate the onboarding token via Convex
    const tokenData = await convex.query(api.propertyManagers.validateOnboardingToken, { token });
    if (!tokenData.valid) {
      return NextResponse.json(
        { error: tokenData.error || 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Create a Straddle customer for the PM
    const nameParts = (pmName || '').split(' ');
    const customer = await straddleAPI.createCustomer({
      email: email || tokenData.pm!.email,
      firstName: nameParts[0] || tokenData.pm!.firstName,
      lastName: nameParts.slice(1).join(' ') || tokenData.pm!.lastName,
      dateOfBirth: '1990-01-01', // Placeholder for business accounts
      phone: phone || '+10000000000',
      address: {
        line1: '123 Business St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
      },
    });

    // Create bank connection link
    const connection = await straddleAPI.createBankConnection(customer.id);

    return NextResponse.json({
      success: true,
      customerId: customer.id,
      connectionUrl: connection.connectionUrl,
      connectionId: connection.connectionId,
    });
  } catch (error: any) {
    console.error('PM Bank Setup Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set up bank account' },
      { status: 500 }
    );
  }
}
