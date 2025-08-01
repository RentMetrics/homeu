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
      message: 'Setup completed',
      userId,
      data
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Failed to complete setup' },
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
      setupComplete: false,
      userId
    });

  } catch (error) {
    console.error('Setup status error:', error);
    return NextResponse.json(
      { error: 'Failed to get setup status' },
      { status: 500 }
    );
  }
} 