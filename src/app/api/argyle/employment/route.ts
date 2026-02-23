/**
 * Argyle Employment API Route
 *
 * GET: Fetch employment data from Argyle and sync to Convex
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  createArgyleClient,
  getCurrentEmployment,
  getBestIncomeEstimate,
  convertBasePayToAnnual,
} from '@/lib/argyle';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's Argyle status
    const status = await convex.query(api.argyle.getArgyleStatus, { userId });

    if (!status.argyleUserId) {
      return NextResponse.json(
        { error: 'No Argyle connection found' },
        { status: 404 }
      );
    }

    const argyleClient = createArgyleClient();
    const argyleUserId = status.argyleUserId;

    // Fetch all relevant data from Argyle
    const [accountsResponse, employmentsResponse, incomesResponse, paystubsResponse] =
      await Promise.all([
        argyleClient.getAccounts(argyleUserId),
        argyleClient.getEmployments(argyleUserId),
        argyleClient.getIncomes(argyleUserId),
        argyleClient.getPaystubs(argyleUserId, { limit: 24 }), // Last ~6 months
      ]);

    const accounts = accountsResponse.results;
    const employments = employmentsResponse.results;
    const incomes = incomesResponse.results;
    const paystubs = paystubsResponse.results;

    // Get the current/primary employment
    const currentEmployment = getCurrentEmployment(employments);

    if (!currentEmployment) {
      return NextResponse.json({
        success: true,
        hasEmployment: false,
        message: 'No employment data found',
      });
    }

    // Get employer details
    let employerName = currentEmployment.employer;
    try {
      const employer = await argyleClient.getEmployer(currentEmployment.employer);
      employerName = employer.name;
    } catch {
      // Employer details not available, use ID
    }

    // Get best income estimate
    const incomeEstimate = getBestIncomeEstimate(incomes, employments, paystubs);

    // Determine pay frequency
    const payFrequency =
      incomeEstimate.frequency ||
      currentEmployment.pay_cycle ||
      currentEmployment.base_pay?.period;

    // Get account ID (first connected account)
    const connectedAccount = accounts.find(a => a.connection.status === 'connected');
    const argyleAccountId = connectedAccount?.id || accounts[0]?.id || '';

    // Update Convex with verified employment data
    const updateResult = await convex.mutation(api.argyle.updateVerifiedEmployment, {
      userId,
      argyleAccountId,
      employerName,
      position: currentEmployment.job_title,
      income: incomeEstimate.amount > 0 ? incomeEstimate.amount : undefined,
      payFrequency,
      employmentStartDate: currentEmployment.hire_date,
    });

    // Store all employments in history
    for (const employment of employments) {
      let empEmployerName = employment.employer;
      try {
        const employer = await argyleClient.getEmployer(employment.employer);
        empEmployerName = employer.name;
      } catch {
        // Use ID if name not available
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

    return NextResponse.json({
      success: true,
      hasEmployment: true,
      isFirstVerification: updateResult.isFirstVerification,
      pointsAwarded: updateResult.pointsAwarded || 0,
      employment: {
        employerName,
        position: currentEmployment.job_title,
        status: currentEmployment.status,
        startDate: currentEmployment.hire_date,
        endDate: currentEmployment.termination_date,
        income: incomeEstimate.amount,
        incomeSource: incomeEstimate.source,
        payFrequency,
      },
      employmentCount: employments.length,
    });

  } catch (error) {
    console.error('Argyle employment fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employment data' },
      { status: 500 }
    );
  }
}
