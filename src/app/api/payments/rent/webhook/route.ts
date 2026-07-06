/**
 * Straddle Payment Webhook Handler
 *
 * Processes payment completion webhooks:
 * 1. Update rentPayment status = 'completed'
 * 2. Update monthlyStatement status = 'paid'
 * 3. Record homeuRevenue ($4 ops + $1 points)
 * 4. Award points: 100 (fee) + 100 (on-time) + bonuses
 * 5. Update payment streak
 * 6. Check achievement triggers
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../../convex/_generated/api';
import { Id } from '../../../../../../convex/_generated/dataModel';
import crypto from 'crypto';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Verify webhook signature from Straddle
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

interface WebhookPayload {
  id: string;
  type: string; // 'payment.completed', 'payment.failed', 'split_payment.completed', etc.
  data: {
    paymentId: string;
    status: 'completed' | 'failed';
    amount: number;
    routes?: Array<{
      id: string;
      status: string;
      amount: number;
      type: string;
    }>;
    metadata?: {
      rentPaymentId?: string;
      statementId?: string;
      renterId?: string;
      month?: string;
    };
    failureReason?: string;
  };
  createdAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-straddle-signature') || '';
    const webhookSecret = process.env.STRADDLE_WEBHOOK_SECRET || '';

    // Verify signature in production
    if (process.env.NODE_ENV === 'production' && webhookSecret) {
      if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const event: WebhookPayload = JSON.parse(payload);
    console.log('Received webhook:', event.type, event.id);

    // Handle different event types
    switch (event.type) {
      case 'payment.completed':
      case 'split_payment.completed':
        await handlePaymentCompleted(event);
        break;

      case 'payment.failed':
      case 'split_payment.failed':
        await handlePaymentFailed(event);
        break;

      case 'payment.processing':
      case 'split_payment.processing':
        // Payment is being processed, no action needed
        console.log('Payment processing:', event.data.paymentId);
        break;

      default:
        console.log('Unhandled webhook type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCompleted(event: WebhookPayload) {
  const { paymentId, metadata } = event.data;

  if (!metadata?.rentPaymentId) {
    console.log('No rentPaymentId in metadata, skipping');
    return;
  }

  const rentPaymentId = metadata.rentPaymentId as Id<"rentPayments">;

  try {
    // 1. Process payment completion (updates status, statement, records revenue)
    const completionResult = await convex.mutation(api.rentPayments.processPaymentCompletion, {
      rentPaymentId,
      straddlePaymentId: paymentId,
      status: 'completed',
    });

    if (!completionResult.success) {
      console.error('Failed to process payment completion:', completionResult);
      return;
    }

    console.log('Payment completed:', {
      rentPaymentId,
      totalPointsEarned: completionResult.totalPointsEarned,
      breakdown: completionResult.breakdown,
    });

    // 2. Award points to the renter
    const pointsResult = await convex.mutation(api.rentPayments.awardPaymentPoints, {
      rentPaymentId,
    });

    if (pointsResult.success) {
      console.log('Points awarded:', {
        points: pointsResult.pointsAwarded,
        newBalance: pointsResult.newBalance,
        tier: pointsResult.tier,
      });
    }

    // 3. Check and award achievements
    if (metadata.renterId) {
      const payment = await convex.query(api.rentPayments.getPaymentWithFeeBreakdown, {
        rentPaymentId,
      });

      await convex.mutation(api.achievements.checkAndAwardAchievements, {
        userId: metadata.renterId,
        eventType: 'payment',
        eventData: {
          paymentId: rentPaymentId,
          isOnTime: payment?.isOnTime,
          daysEarly: payment?.daysEarly,
          isAutoPay: payment?.isAutoPay,
        },
      });
    }

    // 4. Log success
    console.log('Payment webhook processed successfully:', {
      paymentId,
      rentPaymentId,
      month: metadata.month,
    });
  } catch (error) {
    console.error('Error processing payment completion:', error);
    throw error;
  }
}

async function handlePaymentFailed(event: WebhookPayload) {
  const { paymentId, metadata, failureReason } = event.data;

  if (!metadata?.rentPaymentId) {
    console.log('No rentPaymentId in metadata, skipping');
    return;
  }

  const rentPaymentId = metadata.rentPaymentId as Id<"rentPayments">;

  try {
    // Update payment status to failed
    await convex.mutation(api.rentPayments.processPaymentCompletion, {
      rentPaymentId,
      straddlePaymentId: paymentId,
      status: 'failed',
      failureReason: failureReason || 'Payment failed',
    });

    console.log('Payment failed:', {
      paymentId,
      rentPaymentId,
      reason: failureReason,
    });

    // TODO: Send failure notification to user
    // TODO: Trigger retry logic if applicable
  } catch (error) {
    console.error('Error processing payment failure:', error);
    throw error;
  }
}

// Development: Simulate webhook for testing
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const rentPaymentId = searchParams.get('rentPaymentId');
  const simulate = searchParams.get('simulate');

  if (!rentPaymentId || !simulate) {
    return NextResponse.json({
      message: 'Development endpoint for testing webhooks',
      usage: '?rentPaymentId=xxx&simulate=completed|failed',
    });
  }

  // Simulate a webhook event
  const mockEvent: WebhookPayload = {
    id: `evt_${Date.now()}`,
    type: simulate === 'failed' ? 'payment.failed' : 'payment.completed',
    data: {
      paymentId: `pay_${Date.now()}`,
      status: simulate === 'failed' ? 'failed' : 'completed',
      amount: 1955.00,
      metadata: {
        rentPaymentId,
        renterId: 'test_user',
        month: new Date().toISOString().slice(0, 7),
      },
      failureReason: simulate === 'failed' ? 'Insufficient funds' : undefined,
    },
    createdAt: new Date().toISOString(),
  };

  if (simulate === 'failed') {
    await handlePaymentFailed(mockEvent);
  } else {
    await handlePaymentCompleted(mockEvent);
  }

  return NextResponse.json({
    message: 'Webhook simulated',
    event: mockEvent,
  });
}
