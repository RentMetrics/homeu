import { NextRequest, NextResponse } from 'next/server';
import WorkOSService from '@/lib/workos';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    // Authenticate with WorkOS
    const authResult = await WorkOSService.authenticateUser(code);

    // Store authentication state (in production, use secure session storage)
    const response = NextResponse.json({
      user: authResult.user,
      organization: authResult.organization,
      success: true
    });

    // Set secure HTTP-only cookie with access token (optional)
    response.cookies.set('workos_access_token', authResult.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;

  } catch (error) {
    console.error('WorkOS callback error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}