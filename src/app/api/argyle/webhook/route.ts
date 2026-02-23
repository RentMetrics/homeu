/**
 * Argyle Webhook API Route
 *
 * POST: Handle Argyle webhook events
 *
 * Webhook events:
 * - accounts.connected: User connected a payroll account
 * - accounts.synced: Data sync completed
 * - accounts.removed: User disconnected an account
 * - accounts.error: Error occurred with account
 */

import { NextResponse } from 'next/server';
import { validateWebhookSignature, createArgyleClient, getCurrentEmployment, getBestIncomeEstimate, convertBasePayToAnnual } from '@/lib/argyle';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import type { ArgyleWebhookEvent } from '@/lib/argyle';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    const payload = await req.text();
    const signature = req.headers.get('x-argyle-signature') || '';
    const webhookSecret = process.env.ARGYLE_WEBHOOK_SECRET;

    // Validate webhook signature (skip in development if secret not set)
    if (webhookSecret && !validateWebhookSignature(payload, signature, webhookSecret)) {
      console.error('Invalid Argyle webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event: ArgyleWebhookEvent = JSON.parse(payload);
    console.log('Argyle webhook received:', event.event, event.name);

    const { user: argyleUserId, account: argyleAccountId } = event.data;

    // Find the HomeU user by Argyle user ID
    const renter = await convex.query(api.argyle.getRenterByArgyleUserId, {
      argyleUserId,
    });

    if (!renter) {
      console.warn('No renter found for Argyle user:', argyleUserId);
      // Return 200 to acknowledge the webhook even if we can't process it
      return NextResponse.json({ received: true });
    }

    const userId = renter.userId;

    switch (event.event) {
      case 'accounts.connected':
        // User successfully connected a payroll account
        await handleAccountConnected(userId, argyleUserId, argyleAccountId);
        break;

      case 'accounts.synced':
        // Data sync completed - fetch fresh employment data
        await handleAccountSynced(userId, argyleUserId, argyleAccountId);
        break;

      case 'accounts.removed':
        // User disconnected their payroll account
        await handleAccountRemoved(userId, argyleAccountId);
        break;

      case 'accounts.error':
        // Error with account - log but don't fail
        console.error('Argyle account error for user:', userId, event.data);
        break;

      case 'employments.added':
      case 'employments.updated':
        // Employment data was added or updated
        await handleEmploymentUpdate(userId, argyleUserId);
        break;

      case 'paystubs.fully_synced':
        // All paystubs have been synced - update income
        await handlePaystubsSync(userId, argyleUserId);
        break;

      default:
        console.log('Unhandled Argyle webhook event:', event.event);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Argyle webhook error:', error);
    // Return 200 to prevent Argyle from retrying
    return NextResponse.json({ received: true, error: 'Processing error' });
  }
}

/**
 * Handle account connected event
 */
async function handleAccountConnected(
  userId: string,
  argyleUserId: string,
  argyleAccountId: string
) {
  try {
    // Store the account ID
    await convex.mutation(api.argyle.updateArgyleAccountId, {
      userId,
      argyleAccountId,
    });

    console.log('Account connected for user:', userId);
  } catch (error) {
    console.error('Error handling account connected:', error);
  }
}

/**
 * Handle account synced event - fetch and store employment data
 */
async function handleAccountSynced(
  userId: string,
  argyleUserId: string,
  argyleAccountId: string
) {
  try {
    const argyleClient = createArgyleClient();

    // Fetch employment and income data
    const [employmentsResponse, incomesResponse, paystubsResponse] = await Promise.all([
      argyleClient.getEmployments(argyleUserId),
      argyleClient.getIncomes(argyleUserId),
      argyleClient.getPaystubs(argyleUserId, { limit: 24 }),
    ]);

    const employments = employmentsResponse.results;
    const incomes = incomesResponse.results;
    const paystubs = paystubsResponse.results;

    // Get current employment
    const currentEmployment = getCurrentEmployment(employments);

    if (!currentEmployment) {
      console.log('No employment data found for user:', userId);
      return;
    }

    // Get employer name
    let employerName = currentEmployment.employer;
    try {
      const employer = await argyleClient.getEmployer(currentEmployment.employer);
      employerName = employer.name;
    } catch {
      // Use ID if name not available
    }

    // Get income estimate
    const incomeEstimate = getBestIncomeEstimate(incomes, employments, paystubs);
    const payFrequency =
      incomeEstimate.frequency ||
      currentEmployment.pay_cycle ||
      currentEmployment.base_pay?.period;

    // Update verified employment in Convex
    await convex.mutation(api.argyle.updateVerifiedEmployment, {
      userId,
      argyleAccountId,
      employerName,
      position: currentEmployment.job_title,
      income: incomeEstimate.amount > 0 ? incomeEstimate.amount : undefined,
      payFrequency,
      employmentStartDate: currentEmployment.hire_date,
    });

    // Store employment history
    for (const employment of employments) {
      let empEmployerName = employment.employer;
      try {
        const employer = await argyleClient.getEmployer(employment.employer);
        empEmployerName = employer.name;
      } catch {
        // Use ID
      }

      await convex.mutation(api.argyle.upsertEmploymentHistory, {
        userId,
        argyleUserId,
        argyleEmploymentId: employment.id,
        employerName: empEmployerName,
        jobTitle: employment.job_title,
        startDate: employment.hire_date,
        endDate: employment.termination_date,
        isCurrent: employment.status === 'active',
        basePay: employment.base_pay ? convertBasePayToAnnual(employment) : undefined,
        payFrequency: employment.pay_cycle || employment.base_pay?.period,
      });
    }

    console.log('Employment data synced for user:', userId);

  } catch (error) {
    console.error('Error handling account synced:', error);
  }
}

/**
 * Handle account removed event
 */
async function handleAccountRemoved(userId: string, argyleAccountId: string) {
  try {
    await convex.mutation(api.argyle.handleAccountRemoved, {
      userId,
      argyleAccountId,
    });

    console.log('Account removed for user:', userId);
  } catch (error) {
    console.error('Error handling account removed:', error);
  }
}

/**
 * Handle employment update event
 */
async function handleEmploymentUpdate(userId: string, argyleUserId: string) {
  // Re-sync employment data
  await handleAccountSynced(userId, argyleUserId, '');
}

/**
 * Handle paystubs sync completion - update income estimate
 */
async function handlePaystubsSync(userId: string, argyleUserId: string) {
  try {
    const argyleClient = createArgyleClient();

    const [employmentsResponse, incomesResponse, paystubsResponse] = await Promise.all([
      argyleClient.getEmployments(argyleUserId),
      argyleClient.getIncomes(argyleUserId),
      argyleClient.getPaystubs(argyleUserId, { limit: 24 }),
    ]);

    const incomeEstimate = getBestIncomeEstimate(
      incomesResponse.results,
      employmentsResponse.results,
      paystubsResponse.results
    );

    if (incomeEstimate.amount > 0) {
      await convex.mutation(api.argyle.syncIncomeData, {
        userId,
        income: incomeEstimate.amount,
        payFrequency: incomeEstimate.frequency,
      });
    }

    console.log('Income data synced for user:', userId);
  } catch (error) {
    console.error('Error syncing income data:', error);
  }
}
