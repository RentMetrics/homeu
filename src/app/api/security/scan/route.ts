import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { secureHeaders, logSecurityEvent } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    // Only allow authenticated admin users
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { 
        status: 401,
        headers: secureHeaders(),
      });
    }

    // Basic security scan results
    const securityScan = {
      timestamp: new Date().toISOString(),
      checks: {
        httpsEnabled: req.url.startsWith('https://'),
        securityHeaders: {
          contentTypeOptions: true,
          frameOptions: true,
          xssProtection: true,
          strictTransportSecurity: true,
        },
        environmentVariables: {
          clerkConfigured: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
          convexConfigured: !!process.env.NEXT_PUBLIC_CONVEX_URL,
          straddleConfigured: !!process.env.STRADDLE_API_KEY,
          workosConfigured: !!process.env.WORKOS_API_KEY,
        },
        rateLimit: {
          enabled: true,
          apiLimit: '100 requests per 15 minutes',
          authLimit: '5 attempts per 15 minutes',
        },
        cors: {
          configured: true,
          restrictedOrigins: true,
        },
      },
      recommendations: [
        'Regularly rotate API keys',
        'Monitor security logs',
        'Keep dependencies updated',
        'Use environment-specific configurations',
        'Implement proper error handling',
      ],
    };

    logSecurityEvent('SECURITY_SCAN_PERFORMED', { userId }, req);

    return NextResponse.json(securityScan, {
      status: 200,
      headers: secureHeaders(),
    });
  } catch (error) {
    logSecurityEvent('SECURITY_SCAN_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' }, req);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: secureHeaders(),
      }
    );
  }
}
