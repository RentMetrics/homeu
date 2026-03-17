import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createAwardcoClient } from '@/lib/awardco';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const apiKey = process.env.AWARDCO_API_KEY;
    if (!apiKey) {
      console.error('AWARDCO_API_KEY not configured');
      return NextResponse.json(
        { error: 'Awardco integration not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      recipientEmail,
      points,
      message,
      budgetName,
    } = body;

    if (!recipientEmail || !points || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: recipientEmail, points, message' },
        { status: 400 }
      );
    }

    // Create Awardco client
    const awardcoClient = createAwardcoClient({
      apiKey,
      partnerId: process.env.AWARDCO_PARTNER_ID,
    });

    // Send reward to Awardco
    const result = await awardcoClient.createReward({
      recipients: [recipientEmail],
      note: message,
      amount: points,
      budgetName: budgetName || process.env.AWARDCO_BUDGET_NAME,
      giver: process.env.AWARDCO_GIVER_EMAIL,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        rewardId: result.rewardId,
        message: 'Reward sent successfully',
        points,
      });
    } else {
      throw new Error(result.error || 'Failed to create reward');
    }
  } catch (error) {
    console.error('Error creating Awardco reward:', error);
    return NextResponse.json(
      {
        error: 'Failed to create reward',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
