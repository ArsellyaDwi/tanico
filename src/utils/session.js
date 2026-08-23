import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

const SESSION_SECRET = process.env.SESSION_SECRET || 'tanico_secure_default_session_secret_key_32chars_min';
const SESSION_COOKIE_NAME = 'tanico_session';

export function createSessionToken(payload, expiresInSeconds = 7 * 24 * 60 * 60) {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const data = JSON.stringify({ ...payload, exp });
  const encodedData = Buffer.from(data).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(encodedData).digest('base64url');
  return `${encodedData}.${signature}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedData, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(encodedData).digest('base64url');
  if (signature !== expectedSignature) return null;

  try {
    const json = Buffer.from(encodedData, 'base64url').toString('utf8');
    const payload = JSON.parse(json);
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser(request) {
  try {
    let token = null;
    if (request && request.headers) {
      const authHeader = request.headers.get ? request.headers.get('authorization') : request.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
      if (!token && request.cookies) {
        token = request.cookies.get ? request.cookies.get(SESSION_COOKIE_NAME)?.value : request.cookies[SESSION_COOKIE_NAME];
      }
    }
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    }
    if (!token) return null;
    const decoded = verifySessionToken(token);
    if (!decoded || !decoded.id) return null;

    if (!prisma) return decoded;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true }
    });
    return user;
  } catch (error) {
    logger.error('Error in getAuthenticatedUser:', error);
    return null;
  }
}

export async function verifyAdminSession(request) {
  try {
    let token = null;
    if (request && request.headers) {
      const authHeader = request.headers.get ? request.headers.get('authorization') : request.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
      if (!token && request.cookies) {
        token = request.cookies.get ? request.cookies.get(SESSION_COOKIE_NAME)?.value : request.cookies[SESSION_COOKIE_NAME];
      }
    }
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    }
    if (!token) return false;
    const decoded = verifySessionToken(token);
    if (!decoded) return false;

    if (decoded.role === 'ADMIN' || decoded.role === 'SUPERADMIN' || decoded.isAdmin) {
      return true;
    }

    if (decoded.id && prisma) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { role: true }
      });
      if (user && (user.role?.name === 'ADMIN' || user.role?.name === 'SUPERADMIN' || user.role === 'ADMIN' || user.isAdmin)) {
        return true;
      }
    }
    return false;
  } catch (error) {
    logger.error('Error in verifyAdminSession:', error);
    return false;
  }
}

export async function setSessionCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
