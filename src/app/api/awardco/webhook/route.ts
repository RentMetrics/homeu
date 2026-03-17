import { NextRequest, NextResponse } from 'next/server';
import { validateAwardcoWebhook, isWebhookTimestampValid } from '@/lib/awardco/utils';

/**
 * Awardco Webhook Handler
 *
 * This endpoint receives webhook events from Awardco
 * Events include: recognition.created, redemption.completed, user.created, points.awarded
 */
export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.AWARDCO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('AWARDCO_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Extract webhook headers
    const signature = request.headers.get('Awardco-Signature');
    const timestamp = request.headers.get('Awardco-Timestamp');

    if (!signature || !timestamp) {
      console.error('Missing webhook signature or timestamp');
      return NextResponse.json(
        { error: 'Invalid webhook request' },
        { status: 400 }
      );
    }

    // Get raw body for signature verification
    const body = await request.text();

    // Verify timestamp is within 5 minutes
    if (!isWebhookTimestampValid(timestamp)) {
      console.error('Webhook timestamp is too old');
      return NextResponse.json(
        { error: 'Webhook timestamp expired' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const isValid = await validateAwardcoWebhook(body, signature, timestamp, webhookSecret);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const payload = JSON.parse(body);
    const { companyId, companyName, eventType, data } = payload;

    console.log(`Received Awardco webhook: ${eventType}`, {
      companyId,
      companyName,
      timestamp,
    });

    // Handle different event types
    switch (eventType) {
      case 'recognition.created':
        await handleRecognitionCreated(data);
        break;

      case 'redemption.completed':
        await handleRedemptionCompleted(data);
        break;

      case 'user.created':
        await handleUserCreated(data);
        break;

      case 'points.awarded':
        await handlePointsAwarded(data);
        break;

      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }

    // Always return 200 within 3 seconds
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing Awardco webhook:', error);
    // Still return 200 to prevent retries
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

async function handleRecognitionCreated(data: any) {
  console.log('Recognition created:', data);
  // TODO: Update Convex database with recognition data
  // TODO: Send notification to user
}

async function handleRedemptionCompleted(data: any) {
  console.log('Redemption completed:', data);
  // TODO: Update Convex database with redemption data
  // TODO: Send confirmation to user
}

async function handleUserCreated(data: any) {
  console.log('User created in Awardco:', data);
  // TODO: Sync user data with Convex
}

async function handlePointsAwarded(data: any) {
  console.log('Points awarded:', data);
  // TODO: Update user balance in Convex
  // TODO: Send notification to user
}
