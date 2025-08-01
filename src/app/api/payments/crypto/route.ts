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
      message: 'Crypto payment request received',
      userId,
      data
    });

  } catch (error) {
    console.error('Crypto payment error:', error);
    return NextResponse.json(
      { error: 'Failed to process crypto payment' },
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
      payments: [],
      userId
    });

  } catch (error) {
    console.error('Crypto payments error:', error);
    return NextResponse.json(
      { error: 'Failed to get crypto payments' },
      { status: 500 }
    );
  }
} 