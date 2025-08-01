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
    // In production, this would call Straddle API directly
    return NextResponse.json({
      success: true,
      message: 'Bank connection request received',
      userId,
      data
    });

  } catch (error) {
    console.error('Straddle bank connection error:', error);
    return NextResponse.json(
      { error: 'Failed to process bank connection' },
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
      bankAccounts: [],
      userId
    });

  } catch (error) {
    console.error('Straddle bank accounts error:', error);
    return NextResponse.json(
      { error: 'Failed to get bank accounts' },
      { status: 500 }
    );
  }
} 