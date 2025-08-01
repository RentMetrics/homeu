import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await req.json();
    const { 
      amount, 
      currency = 'USD', 
      description, 
      paykey,
      propertyId,
      metadata = {}
    } = data;

    // Call Convex function to create payment
    const result = await convex.mutation(api.straddle.createPayment, {
      userId,
      amount,
      currency,
      description,
      paykey,
      propertyId,
      metadata,
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Straddle payment error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('paymentId');

    if (paymentId) {
      // Get specific payment status from Straddle
      const result = await convex.query(api.straddle.getPaymentStatus, {
        paymentId,
      });
      
      return NextResponse.json(result);
    }

    // Get user's payment history
    const result = await convex.query(api.straddle.getUserPayments, {
      userId,
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Straddle payment status error:', error);
    return NextResponse.json(
      { error: 'Failed to get payment status' },
      { status: 500 }
    );
  }
} 