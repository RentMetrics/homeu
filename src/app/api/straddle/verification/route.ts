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

    const data = await req.json();
    const { 
      firstName, 
      lastName, 
      dateOfBirth, 
      ssn, 
      address, 
      phone,
      documents 
    } = data;

    // Get user email from Clerk
    const user = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    }).then(res => res.json());

    if (!user.email_addresses?.[0]?.email_address) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 404 }
      );
    }

    const email = user.email_addresses[0].email_address;

    // Call Convex function to handle Straddle verification
    const result = await convex.mutation(api.straddle.createStraddleCustomer, {
      userId,
      email,
      firstName,
      lastName,
      dateOfBirth,
      ssn,
      address,
      phone,
      documents,
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Straddle verification error:', error);
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

    // Call Convex function to get verification status
    const result = await convex.query(api.straddle.getVerificationStatus, {
      userId,
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Straddle verification status error:', error);
    return NextResponse.json(
      { error: 'Failed to get verification status' },
      { status: 500 }
    );
  }
} 