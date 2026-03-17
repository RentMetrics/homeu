/**
 * Awardco SSO API Route
 *
 * This endpoint initiates SAML SSO to Awardco's rewards platform.
 * Users are authenticated via Clerk, then a SAML assertion is generated
 * and the user is redirected to Awardco via HTTP-POST binding.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { generateSSOPayload, getSAMLConfig, isSSOConfigured, SAMLUser } from '@/lib/awardco/saml';
import { createAwardcoClient } from '@/lib/awardco';

/**
 * GET /api/awardco/sso
 *
 * Initiates SSO flow to Awardco. Returns an HTML page with auto-submitting form
 * that POSTs the SAML response to Awardco's ACS URL.
 */
export async function GET(request: NextRequest) {
  try {
    // Check if SSO is configured
    if (!isSSOConfigured()) {
      return NextResponse.json(
        { error: 'SSO is not configured' },
        { status: 500 }
      );
    }

    // Verify user is authenticated with Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in first' },
        { status: 401 }
      );
    }

    // Get user details from Clerk
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Could not retrieve user information' },
        { status: 500 }
      );
    }

    // Prepare SAML user data
    const samlUser: SAMLUser = {
      email: user.emailAddresses[0]?.emailAddress || '',
      firstName: user.firstName || 'User',
      lastName: user.lastName || '',
      employeeId: userId,
      sessionIndex: `_homeu_${userId}_${Date.now()}`,
    };

    if (!samlUser.email) {
      return NextResponse.json(
        { error: 'User email is required for SSO' },
        { status: 400 }
      );
    }

    // Ensure user exists in Awardco (create if not)
    const apiKey = process.env.AWARDCO_API_KEY;
    if (apiKey) {
      try {
        const awardcoClient = createAwardcoClient({ apiKey });
        const exists = await awardcoClient.userExists({ email: samlUser.email });

        if (!exists) {
          // Create user in Awardco
          await awardcoClient.createUser({
            employeeId: samlUser.employeeId,
            email: samlUser.email,
            firstName: samlUser.firstName,
            lastName: samlUser.lastName,
            metadata: {
              source: 'HomeU',
              clerkUserId: userId,
              createdAt: new Date().toISOString(),
            },
          });
        }
      } catch (error) {
        console.error('Error syncing user to Awardco:', error);
        // Continue with SSO even if sync fails
      }
    }

    // Generate SAML payload
    const config = getSAMLConfig();
    const payload = generateSSOPayload(samlUser, config);

    // Return HTML page with auto-submitting form (HTTP-POST binding)
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>HomeU Rewards Store</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: #2AA54C;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 { margin: 0 0 0.5rem; font-weight: 500; }
    p { margin: 0; opacity: 0.7; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h2>Opening HomeU Rewards Store</h2>
    <p>Please wait while we securely sign you in...</p>
  </div>
  <form id="samlForm" method="POST" action="${payload.acsUrl}">
    <input type="hidden" name="SAMLResponse" value="${payload.samlResponse}" />
    <input type="hidden" name="RelayState" value="${payload.relayState || ''}" />
  </form>
  <script>
    // Auto-submit the form after a brief delay for UX
    setTimeout(function() {
      document.getElementById('samlForm').submit();
    }, 500);
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

  } catch (error) {
    console.error('SSO Error:', error);
    return NextResponse.json(
      { error: 'SSO initialization failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/awardco/sso
 *
 * Alternative endpoint for programmatic SSO initiation.
 * Returns JSON payload instead of HTML redirect.
 */
export async function POST(request: NextRequest) {
  try {
    // Check if SSO is configured
    if (!isSSOConfigured()) {
      return NextResponse.json(
        { success: false, error: 'SSO is not configured' },
        { status: 500 }
      );
    }

    // Verify user is authenticated with Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user details from Clerk
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Could not retrieve user information' },
        { status: 500 }
      );
    }

    // Prepare SAML user data
    const samlUser: SAMLUser = {
      email: user.emailAddresses[0]?.emailAddress || '',
      firstName: user.firstName || 'User',
      lastName: user.lastName || '',
      employeeId: userId,
      sessionIndex: `_homeu_${userId}_${Date.now()}`,
    };

    if (!samlUser.email) {
      return NextResponse.json(
        { success: false, error: 'User email is required' },
        { status: 400 }
      );
    }

    // Generate SAML payload
    const config = getSAMLConfig();
    const payload = generateSSOPayload(samlUser, config);

    return NextResponse.json({
      success: true,
      ssoUrl: payload.acsUrl,
      samlResponse: payload.samlResponse,
      relayState: payload.relayState,
    });

  } catch (error) {
    console.error('SSO Error:', error);
    return NextResponse.json(
      { success: false, error: 'SSO initialization failed' },
      { status: 500 }
    );
  }
}
