import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

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
    
    // For now, return a mock response
    return NextResponse.json({
      success: true,
      message: 'Verification request received',
      userId,
      data
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Failed to process verification' },
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

    // For now, return a mock response
    return NextResponse.json({
      verified: false,
      status: 'pending',
      userId
    });

  } catch (error) {
    console.error('Verification status error:', error);
    return NextResponse.json(
      { error: 'Failed to get verification status' },
      { status: 500 }
    );
  }
} 