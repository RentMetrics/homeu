import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { createAwardcoClient } from '@/lib/awardco';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;

  // Verify the webhook
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses[0]?.email_address;

    if (!email) {
      console.error('No email found for user:', id);
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    const firstName = first_name || '';
    const lastName = last_name || '';

    // Step 1: Award signup points in Convex
    try {
      const result = await convex.mutation(api.points.awardSignupPoints, {
        userId: id,
        email: email,
      });
      console.log('Signup points awarded:', result);
    } catch (error) {
      console.error('Error awarding signup points:', error);
      // Continue — don't block Awardco creation
    }

    // Step 2: Create user in Awardco
    const awardcoApiKey = process.env.AWARDCO_API_KEY;
    if (awardcoApiKey) {
      try {
        const awardcoClient = createAwardcoClient({ apiKey: awardcoApiKey });

        // Check if user already exists in Awardco
        const exists = await awardcoClient.userExists({ email });

        if (!exists) {
          await awardcoClient.createUser({
            employeeId: id,
            email: email,
            firstName: firstName,
            lastName: lastName,
            metadata: {
              source: 'HomeU',
              clerkUserId: id,
              createdAt: new Date().toISOString(),
              signupMethod: 'clerk_webhook',
            },
          });
          console.log('Awardco user created for:', email);
        } else {
          console.log('Awardco user already exists for:', email);
        }
      } catch (error) {
        console.error('Error creating Awardco user:', error);
        // Don't fail the webhook — Awardco creation is best-effort
        // User will be auto-created on first SSO login as fallback
      }
    } else {
      console.warn('AWARDCO_API_KEY not set — skipping Awardco user creation');
    }

    return NextResponse.json({
      success: true,
      message: 'User onboarded: points awarded + Awardco account created',
    }, { status: 200 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
