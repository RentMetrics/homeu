import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createAwardcoClient } from '@/lib/awardco';
import { formatRecognitionMessage } from '@/lib/awardco/utils';

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
      activityType,
      points,
      customMessage,
    } = body;

    if (!recipientEmail || !points) {
      return NextResponse.json(
        { error: 'Missing required fields: recipientEmail, points' },
        { status: 400 }
      );
    }

    // Create Awardco client
    const awardcoClient = createAwardcoClient({
      apiKey,
      partnerId: process.env.AWARDCO_PARTNER_ID,
    });

    // Create recognition message
    const message = customMessage || formatRecognitionMessage({
      activityType: activityType || 'profile_completion',
      points,
      description: `You've earned ${points} points!`,
      timestamp: new Date().toISOString(),
    });

    // Send recognition to Awardco
    const result = await awardcoClient.createRecognition({
      recipients: [recipientEmail],
      note: message,
      amount: points,
      recognitionProgramName: process.env.AWARDCO_PROGRAM_NAME || 'HomeU Rewards',
      giver: process.env.AWARDCO_GIVER_EMAIL, // Company bot if not specified
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        recognitionId: result.recognitionId,
        message: 'Recognition sent successfully',
        points,
      });
    } else {
      throw new Error(result.error || 'Failed to create recognition');
    }
  } catch (error) {
    console.error('Error creating Awardco recognition:', error);
    return NextResponse.json(
      {
        error: 'Failed to create recognition',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
