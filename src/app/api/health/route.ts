import { NextRequest, NextResponse } from 'next/server';
import { validateEnvironmentVariables, secureHeaders } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    // Validate environment variables
    validateEnvironmentVariables();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
    };
    
    return NextResponse.json(health, {
      status: 200,
      headers: secureHeaders(),
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { 
        status: 500,
        headers: secureHeaders(),
      }
    );
  }
}
