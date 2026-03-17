import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createAwardcoClient } from '@/lib/awardco';

export async function GET(request: NextRequest) {
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

    // Get user email from Clerk
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    if (!user.emailAddresses[0]?.emailAddress) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Create Awardco client
    const awardcoClient = createAwardcoClient({
      apiKey,
      partnerId: process.env.AWARDCO_PARTNER_ID,
    });

    // Get user balance from Awardco
    const result = await awardcoClient.getUserBalance({
      email: user.emailAddresses[0].emailAddress,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        balance: result.balance,
        currency: result.currency,
        userId: result.userId,
      });
    } else {
      // User might not exist in Awardco yet
      return NextResponse.json({
        success: true,
        balance: 0,
        currency: 'USD',
        userId: userId,
        newUser: true,
      });
    }
  } catch (error) {
    console.error('Error fetching Awardco balance:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch balance',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
