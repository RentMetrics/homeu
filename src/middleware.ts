import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, logSecurityEvent, secureHeaders } from '@/lib/security'

const isPublicRoute = createRouteMatcher([
  '/',
  '/contact',
  '/properties(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/health',
  '/pm-onboarding(.*)',
  '/api/straddle/pm-bank-setup',
])

const isIgnoredRoute = createRouteMatcher([
  '/api/webhooks(.*)',
  '/api/health',
])

// Rate limiting configurations
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
})

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 auth attempts per 15 minutes
})

export default clerkMiddleware(
  (auth, req) => {
    // Apply rate limiting
    if (req.nextUrl.pathname.startsWith('/api/')) {
      const rateLimitResponse = apiRateLimit(req)
      if (rateLimitResponse) {
        logSecurityEvent('RATE_LIMIT_EXCEEDED', { path: req.nextUrl.pathname }, req)
        return rateLimitResponse
      }
    }

    // Apply stricter rate limiting for auth routes
    if (req.nextUrl.pathname.includes('/sign-in') || req.nextUrl.pathname.includes('/sign-up')) {
      const rateLimitResponse = authRateLimit(req)
      if (rateLimitResponse) {
        logSecurityEvent('AUTH_RATE_LIMIT_EXCEEDED', { path: req.nextUrl.pathname }, req)
        return rateLimitResponse
      }
    }

    // Security headers for all responses
    const response = NextResponse.next()
    const headers = secureHeaders()
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Prevent aggressive browser caching of HTML pages
    // (static assets under /_next/static/ are excluded by the matcher config)
    if (!req.nextUrl.pathname.startsWith('/api/')) {
      response.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
    }

    // Block suspicious user agents
    const userAgent = req.headers.get('user-agent') || ''
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
    ]
    
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent))
    if (isSuspicious && !req.nextUrl.pathname.startsWith('/api/health')) {
      logSecurityEvent('SUSPICIOUS_USER_AGENT', { userAgent, path: req.nextUrl.pathname }, req)
      // Allow but log - you can change this to block if needed
    }

    // Restrict admin routes to users with specific permissions
    if (req.nextUrl.pathname.startsWith('/admin')) {
      try {
        auth().protect()
        logSecurityEvent('ADMIN_ACCESS', { path: req.nextUrl.pathname }, req)
      } catch (error) {
        logSecurityEvent('UNAUTHORIZED_ADMIN_ACCESS', { path: req.nextUrl.pathname }, req)
        throw error
      }
    }
    
    // Restrict dashboard routes to signed in users
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      try {
        auth().protect()
      } catch (error) {
        logSecurityEvent('UNAUTHORIZED_DASHBOARD_ACCESS', { path: req.nextUrl.pathname }, req)
        throw error
      }
    }
    
    // Allow public routes
    if (isPublicRoute(req)) return response
    
    // Protect all other routes
    try {
      auth().protect()
      return response
    } catch (error) {
      logSecurityEvent('UNAUTHORIZED_ACCESS', { path: req.nextUrl.pathname }, req)
      throw error
    }
  },
  { 
    ignoredRoutes: isIgnoredRoute 
  }
)

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
} 