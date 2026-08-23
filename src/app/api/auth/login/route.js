import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSessionToken } from '@/utils/session';
import { loginSchema, getZodErrorMessage } from '@/utils/validators';
import { isRateLimited, getClientIp } from '@/utils/rateLimit';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    // Rate limit: Max 10 login attempts per minute per IP
    if (isRateLimited(`login_${ip}`, 10, 60 * 1000)) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan login. Silakan tunggu 1 menit.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Zod Validation
    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = getZodErrorMessage(parseResult.error, 'Input login tidak valid.');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = (email || '').trim().toLowerCase();

    let user = null;
    if (prisma) {
      user = await prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
        include: { role: true }
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 });
    }

    // Check account active status
    const statusUpper = (user.status || 'AKTIF').toUpperCase();
    if (statusUpper === 'NONAKTIF' || statusUpper === 'NON-AKTIF' || statusUpper === 'DISABLED') {
      return NextResponse.json({ error: 'Akun telah dinonaktifkan.' }, { status: 403 });
    }

    // Verify password with bcrypt, with auto-upgrade fallback for legacy plaintext passwords
    let isValid = false;
    if (user.password) {
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        isValid = await bcrypt.compare(password, user.password);
      } else {
        if (user.password === password) {
          isValid = true;
          const newHash = await bcrypt.hash(password, 10);
          if (prisma) {
            await prisma.user.update({
              where: { id: user.id },
              data: { password: newHash }
            });
          }
        }
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 });
    }

    // Role check - Only CUSTOMER is allowed on user login endpoint.
    // Return generic error for non-customer roles (ADMIN / SUPER_ADMIN) to prevent role enumeration.
    const roleName = (user.role?.name || '').toUpperCase();
    if (roleName !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 });
    }

    // Update lastLogin timestamp
    if (prisma) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      }).catch((err) => logger.warn('Failed to update lastLogin:', err));
    }

    // Save session cookie for CUSTOMER
    const cookieStore = await cookies();
    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: 'CUSTOMER'
    };
    
    const signedToken = await createSessionToken(sessionData);

    cookieStore.set('tanico_session', signedToken, {
      path: '/',
      httpOnly: true, // Secure cookie inaccessible to client scripts
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    logger.info(`Customer logged in successfully: ${user.email} (CUSTOMER)`);

    return NextResponse.json({
      success: true,
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar || '',
      phone: user.phone || '',
      address: user.address || '',
      provider: user.provider || 'Email',
      status: user.status || 'Aktif',
      role: user.role || { name: 'CUSTOMER' },
      sessionToken: signedToken
    });

  } catch (error) {
    logger.error('API POST /api/auth/login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
