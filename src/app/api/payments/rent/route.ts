/**
 * Rent Payment API Route
 *
 * Handles rent payments with split routing:
 * - Rent amount → Property Manager
 * - $5 fee → HomeU ($4 ops + $1 = 100 points to resident)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { straddleAPI } from '@/lib/straddle';
import { Id } from '../../../../../convex/_generated/dataModel';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Constants
const HOMEU_CONVENIENCE_FEE = 5.00;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { statementId, paykey } = body;

    if (!statementId || !paykey) {
      return NextResponse.json(
        { error: 'Missing required fields: statementId, paykey' },
        { status: 400 }
      );
    }

    // Initiate the rent payment in Convex
    const initiateResult = await convex.mutation(api.rentPayments.initiateRentPayment, {
      renterId: userId,
      statementId: statementId as Id<"monthlyStatements">,
      paykey,
      paymentMethod: 'ach',
    });

    if (!initiateResult.success || !initiateResult.rentPaymentId) {
      return NextResponse.json(
        { error: initiateResult.message || 'Failed to initiate payment' },
        { status: 400 }
      );
    }

    // Get the renter's Straddle customer ID
    const renter = await convex.query(api.straddle.getBankAccounts, { userId });

    if ('error' in renter) {
      return NextResponse.json(
        { error: 'Renter bank account not found' },
        { status: 400 }
      );
    }

    // Get property manager's Straddle business ID from the statement
    const statement = await convex.query(api.statements.getStatementById, {
      statementId: statementId as Id<"monthlyStatements">,
    });

    if (!statement) {
      return NextResponse.json(
        { error: 'Statement not found' },
        { status: 404 }
      );
    }

    // For now, create a simple routed payment
    // In production, this would use the split payment API
    try {
      // Get PM's Straddle business customer ID
      // This would need to be fetched from the propertyManagers table
      const pmStraddleId = process.env.HOMEU_PM_TEST_ID || 'pm_test_id';
      const homeuBusinessId = process.env.HOMEU_STRADDLE_BUSINESS_ID || 'homeu_business_id';

      // Create split payment through Straddle
      const splitPayment = await straddleAPI.createSplitRentPayment({
        fromCustomerId: userId, // Using Clerk ID as reference
        paykey,
        totalAmount: initiateResult.totalAmount,
        routes: [
          {
            toBusinessCustomerId: pmStraddleId,
            amount: initiateResult.rentAmount,
            description: 'Monthly rent payment',
            type: 'rent',
          },
          {
            toBusinessCustomerId: homeuBusinessId,
            amount: HOMEU_CONVENIENCE_FEE,
            description: 'HomeU convenience fee',
            type: 'fee',
          },
        ],
        description: `Rent payment - ${statement.month}`,
        metadata: {
          rentPaymentId: initiateResult.rentPaymentId,
          statementId,
          renterId: userId,
          month: statement.month,
        },
      });

      // Update payment with Straddle IDs
      await convex.mutation(api.rentPayments.updatePaymentWithStraddleIds, {
        rentPaymentId: initiateResult.rentPaymentId,
        straddlePaymentId: splitPayment.id,
        straddleRentRouteId: splitPayment.routes[0]?.id,
        straddleFeeRouteId: splitPayment.routes[1]?.id,
      });

      return NextResponse.json({
        success: true,
        paymentId: initiateResult.rentPaymentId,
        straddlePaymentId: splitPayment.id,
        totalAmount: initiateResult.totalAmount,
        breakdown: {
          rentAmount: initiateResult.rentAmount,
          homeuFee: HOMEU_CONVENIENCE_FEE,
          pointsToEarn: 100, // Fee conversion points
          bonusPoints: {
            onTime: initiateResult.isOnTime ? 100 : 0,
            early: (initiateResult.daysEarly ?? 0) >= 5 ? 25 : 0,
          },
        },
        message: 'Payment initiated successfully',
      });
    } catch (straddleError: any) {
      console.error('Straddle payment error:', straddleError);

      // For development/testing, simulate success
      if (process.env.NODE_ENV === 'development') {
        const mockPaymentId = `mock_${Date.now()}`;

        await convex.mutation(api.rentPayments.updatePaymentWithStraddleIds, {
          rentPaymentId: initiateResult.rentPaymentId,
          straddlePaymentId: mockPaymentId,
        });

        return NextResponse.json({
          success: true,
          paymentId: initiateResult.rentPaymentId,
          straddlePaymentId: mockPaymentId,
          totalAmount: initiateResult.totalAmount,
          breakdown: {
            rentAmount: initiateResult.rentAmount,
            homeuFee: HOMEU_CONVENIENCE_FEE,
            pointsToEarn: 100,
            bonusPoints: {
              onTime: initiateResult.isOnTime ? 100 : 0,
              early: (initiateResult.daysEarly ?? 0) >= 5 ? 25 : 0,
            },
          },
          message: 'Payment initiated (development mode)',
          isDevelopment: true,
        });
      }

      return NextResponse.json(
        { error: 'Failed to process payment through Straddle' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Rent payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Retrieve payment status
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (paymentId) {
      // Get specific payment
      const payment = await convex.query(api.rentPayments.getPaymentWithFeeBreakdown, {
        rentPaymentId: paymentId as Id<"rentPayments">,
      });

      return NextResponse.json({ payment });
    }

    // Get all payments for user
    const payments = await convex.query(api.rentPayments.getRenterPayments, {
      renterId: userId,
      limit: 20,
    });

    return NextResponse.json({ payments });
  } catch (error: any) {
    console.error('Get payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
