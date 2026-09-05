import type { Request, Response, NextFunction } from 'express';
import { db } from './db.js';
import { verifyPassword, generateSessionToken } from './crypto.js';
import { notifyAdmin } from './telegram.js';

// Rate Limiter state
interface AttemptTracker {
  count: number;
  firstAttempt: number;
  lockedUntil: number;
}

const failedAttemptsMap = new Map<string, AttemptTracker>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(ip: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const tracker = failedAttemptsMap.get(ip);
  if (!tracker) return { allowed: true };

  if (tracker.lockedUntil > now) {
    const waitSeconds = Math.ceil((tracker.lockedUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  // If window expired (15m), reset
  if (now - tracker.firstAttempt > LOCKOUT_MS) {
    failedAttemptsMap.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const tracker = failedAttemptsMap.get(ip) || { count: 0, firstAttempt: now, lockedUntil: 0 };
  tracker.count += 1;

  if (tracker.count >= MAX_ATTEMPTS) {
    tracker.lockedUntil = now + LOCKOUT_MS;
    console.warn(`[Security Alert] IP ${ip} is locked out due to ${tracker.count} failed login attempts.`);
  }

  failedAttemptsMap.set(ip, tracker);
}

export function resetFailedAttempts(ip: string) {
  failedAttemptsMap.delete(ip);
}

// Extract client IP safely
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

// Authentication Middleware
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  }

  if (!token) {
    return res.status(401).json({
      error: 'غير مصرح بالدخول — يجب تسجيل الدخول كصاحب الموقع أولاً.',
      code: 'UNAUTHORIZED',
    });
  }

  const isValid = db.validateSession(token);
  if (!isValid) {
    return res.status(401).json({
      error: 'انتهت صلاحية الجلسة أو أنها غير صالحة. يرجى تسجيل الدخول مرة أخرى.',
      code: 'SESSION_EXPIRED',
    });
  }

  (req as any).adminToken = token;
  next();
}
