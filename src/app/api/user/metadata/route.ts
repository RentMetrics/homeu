import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { managementCompany } = body;

    if (!managementCompany) {
      return NextResponse.json(
        { error: 'Management company data is required' },
        { status: 400 }
      );
    }

    // Update user metadata on the server side using Clerk Admin API
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        managementCompany,
      },
    });

    return NextResponse.json(
      { success: true, message: 'Management company connected successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating user metadata:', error);
    return NextResponse.json(
      { error: 'Failed to update user metadata' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    return NextResponse.json(
      {
        managementCompany: user.publicMetadata?.managementCompany || null
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching user metadata:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user metadata' },
      { status: 500 }
    );
  }
}
