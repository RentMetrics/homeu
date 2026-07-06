import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface CoinbaseWebhookEvent {
  id: string;
  type: 'charge:created' | 'charge:confirmed' | 'charge:failed' | 'charge:pending';
  data: {
    id: string;
    code: string;
    metadata: {
      renterId: string;
      propertyId: string;
      propertyManagerId: string;
      rentAmount: string;
      homeuFee: string;
      month: string;
    };
    payments: Array<{
      network: string;
      transaction_id: string;
      status: string;
      value: {
        local: { amount: string; currency: string };
        crypto: { amount: string; currency: string };
      };
    }>;
    timeline: Array<{
      status: string;
      time: string;
    }>;
  };
}

function verifyWebhookSignature(
  payload: string,
  signature: string,
  webhookSecret: string
): boolean {
  const crypto = require('crypto');

  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('X-CC-Webhook-Signature');
    const payload = await request.text();

    // Verify signature in production
    const webhookSecret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(payload, signature, webhookSecret);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event: CoinbaseWebhookEvent = JSON.parse(payload);

    console.log('Coinbase webhook received:', event.type, event.data.code);

    switch (event.type) {
      case 'charge:confirmed': {
        // Payment confirmed - update database and award points
        const { metadata, payments } = event.data;
        const payment = payments[0];

        if (!payment) {
          console.error('No payment found in confirmed charge');
          break;
        }

        // Store the crypto payment
        await convex.mutation(api.blockchain.storeCryptoPayment, {
          userId: metadata.renterId,
          propertyId: metadata.propertyId,
          amount: payment.value.crypto.amount,
          currency: payment.value.crypto.currency as 'ETH' | 'USDC' | 'USDT',
          transactionHash: payment.transaction_id,
          recipientAddress: 'coinbase_commerce',
        });

        // Update status to confirmed
        await convex.mutation(api.blockchain.updateCryptoPaymentStatus, {
          transactionHash: payment.transaction_id,
          status: 'confirmed',
        });

        // Award points for the payment
        // The $5 fee = 100 points, plus on-time bonus
        try {
          await convex.mutation(api.points.awardPoints, {
            userId: metadata.renterId,
            amount: 100,
            type: 'earn',
            source: 'crypto_payment_fee',
            description: `HomeU fee points for ${metadata.month}`,
            metadata: {
              month: metadata.month,
              propertyId: metadata.propertyId,
              paymentMethod: 'crypto',
            },
          });

          // On-time bonus
          await convex.mutation(api.points.awardPoints, {
            userId: metadata.renterId,
            amount: 100,
            type: 'earn',
            source: 'on_time_payment',
            description: `On-time payment bonus for ${metadata.month}`,
            metadata: {
              month: metadata.month,
              propertyId: metadata.propertyId,
            },
          });
        } catch (pointsError) {
          console.error('Failed to award points:', pointsError);
          // Don't fail the webhook for points errors
        }

        console.log(`Payment confirmed for ${metadata.renterId}: ${metadata.rentAmount} + ${metadata.homeuFee} fee`);
        break;
      }

      case 'charge:failed': {
        const { metadata, payments } = event.data;
        const payment = payments[0];

        if (payment) {
          await convex.mutation(api.blockchain.updateCryptoPaymentStatus, {
            transactionHash: payment.transaction_id,
            status: 'failed',
          });
        }

        console.log(`Payment failed for ${metadata.renterId}`);
        break;
      }

      case 'charge:pending': {
        console.log(`Payment pending for charge: ${event.data.code}`);
        break;
      }

      case 'charge:created': {
        console.log(`Charge created: ${event.data.code}`);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
