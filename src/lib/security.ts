import { NextRequest, NextResponse } from 'next/server';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export function rateLimit(config: RateLimitConfig) {
  return (req: NextRequest): NextResponse | null => {
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Clean old entries
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
    
    const current = rateLimitStore.get(ip) || { count: 0, resetTime: now + config.windowMs };
    
    if (current.resetTime < now) {
      // Reset window
      current.count = 1;
      current.resetTime = now + config.windowMs;
    } else {
      current.count++;
    }
    
    rateLimitStore.set(ip, current);
    
    if (current.count > config.maxRequests) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': current.resetTime.toString(),
        },
      });
    }
    
    return null; // Allow request
  };
}

export function validateEnvironmentVariables() {
  const required = [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'NEXT_PUBLIC_CONVEX_URL',
    'CONVEX_DEPLOY_KEY',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

export function validateApiKey(apiKey: string | null): boolean {
  if (!apiKey) return false;
  
  // Basic API key validation (adjust based on your API key format)
  const apiKeyRegex = /^[a-zA-Z0-9_-]{32,}$/;
  return apiKeyRegex.test(apiKey);
}

export function secureHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
}

export function logSecurityEvent(event: string, details: any, req?: NextRequest) {
  const logData = {
    timestamp: new Date().toISOString(),
    event,
    details,
    ip: req?.ip || req?.headers.get('x-forwarded-for'),
    userAgent: req?.headers.get('user-agent'),
  };
  
  // In production, send to your logging service
  console.warn('[SECURITY]', JSON.stringify(logData));
}
