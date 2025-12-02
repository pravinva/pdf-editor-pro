import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware
 *
 * Security features:
 * - HTTPS redirect in production
 * - Security headers enforcement
 * - Rate limiting check
 * - Request logging
 */

// Rate limiting store (in-memory)
// In production, use Redis or similar
const rateLimitStore = new Map<string, number[]>();

// Clean up old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    for (const [key, timestamps] of rateLimitStore.entries()) {
      const recentRequests = timestamps.filter(time => time > fiveMinutesAgo);
      if (recentRequests.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, recentRequests);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Check rate limit for an IP address
 * @param ip - Client IP address
 * @param limit - Maximum requests per window
 * @param windowMs - Time window in milliseconds
 * @returns true if within limit, false if exceeded
 */
function checkRateLimit(ip: string, limit: number = 60, windowMs: number = 60000): boolean {
  const now = Date.now();
  const requests = rateLimitStore.get(ip) || [];

  // Filter recent requests within window
  const recentRequests = requests.filter(time => now - time < windowMs);

  // Check if limit exceeded
  if (recentRequests.length >= limit) {
    return false;
  }

  // Add current request
  recentRequests.push(now);
  rateLimitStore.set(ip, recentRequests);

  return true;
}

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
  // Check common headers for real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to connection IP (might be proxy)
  return request.ip || 'unknown';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. HTTPS Redirect (Production only)
  if (isProduction) {
    const proto = request.headers.get('x-forwarded-proto');
    const host = request.headers.get('host');

    if (proto !== 'https' && host) {
      const httpsUrl = `https://${host}${pathname}${request.nextUrl.search}`;
      return NextResponse.redirect(httpsUrl, 301);
    }
  }

  // 2. Rate Limiting (API routes only)
  if (pathname.startsWith('/api/')) {
    const clientIp = getClientIp(request);
    const withinLimit = checkRateLimit(clientIp, 60, 60000); // 60 req/min

    if (!withinLimit) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.'
        },
        { status: 429 }
      );
    }
  }

  // 3. Security Headers
  const response = NextResponse.next();

  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.databricks.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspDirectives);

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // XSS Protection (legacy, but still useful)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (disable unnecessary features)
  const permissionsPolicy = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()'
  ].join(', ');
  response.headers.set('Permissions-Policy', permissionsPolicy);

  // Strict Transport Security (HTTPS only, production)
  if (isProduction) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // 4. Request Logging (API routes only)
  if (pathname.startsWith('/api/')) {
    const clientIp = getClientIp(request);
    const timestamp = new Date().toISOString();
    const method = request.method;

    // Log to console (in production, send to monitoring service)
    console.log(JSON.stringify({
      timestamp,
      method,
      pathname,
      ip: clientIp,
      userAgent: request.headers.get('user-agent')
    }));
  }

  return response;
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
