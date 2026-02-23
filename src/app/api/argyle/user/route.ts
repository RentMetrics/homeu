/**
 * Argyle User API Route
 *
 * POST: Create Argyle user and get user token for Link
 * GET: Get user's Argyle connection status
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createArgyleClient } from '@/lib/argyle';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';

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

    // Check if user already has an Argyle user ID
    const status = await convex.query(api.argyle.getArgyleStatus, { userId });

    let argyleUserId = status.argyleUserId;

    // Create Argyle user if needed
    if (!argyleUserId) {
      const argyleClient = createArgyleClient();
      const argyleUser = await argyleClient.createUser();
      argyleUserId = argyleUser.id;

      // Store Argyle user ID in Convex
      await convex.mutation(api.argyle.updateArgyleUserId, {
        userId,
        argyleUserId,
      });
    }

    // Get fresh user token for Link
    const argyleClient = createArgyleClient();
    const tokenResponse = await argyleClient.createUserToken(argyleUserId);

    return NextResponse.json({
      success: true,
      argyleUserId,
      userToken: tokenResponse.user_token,
      expiresAt: tokenResponse.expires_at,
      // pluginKey is the API ID (client ID) - replaces deprecated linkKey
      pluginKey: process.env.ARGYLE_API_ID,
    });

  } catch (error) {
    console.error('Argyle user creation error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize Argyle connection' },
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

    // Get Argyle status from Convex
    const status = await convex.query(api.argyle.getArgyleStatus, { userId });

    return NextResponse.json({
      success: true,
      ...status,
    });

  } catch (error) {
    console.error('Argyle status error:', error);
    return NextResponse.json(
      { error: 'Failed to get Argyle status' },
      { status: 500 }
    );
  }
}
