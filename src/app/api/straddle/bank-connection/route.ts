import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call Convex function to create bank connection
    const result = await convex.mutation(api.straddle.createBankConnection, {
      userId,
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Straddle bank connection error:', error);
    return NextResponse.json(
      { error: 'Failed to create bank connection' },
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

    // Call Convex function to get bank accounts
    const result = await convex.query(api.straddle.getBankAccounts, {
      userId,
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Straddle bank accounts error:', error);
    return NextResponse.json(
      { error: 'Failed to get bank accounts' },
      { status: 500 }
    );
  }
} 