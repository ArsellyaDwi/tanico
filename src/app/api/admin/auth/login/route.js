import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { loginSchema, getZodErrorMessage } from '@/utils/validators';
import { isRateLimited, getClientIp } from '@/utils/rateLimit';
import { logger } from '@/utils/logger';
import { SignJWT } from 'jose';

export const dynamic = 'force-dynamic';

async function createSessionToken(payload) {
  const secretKey = process.env.SESSION_SECRET || process.env.SUPABASE_JWT_SECRET;
  if (!secretKey) {
    throw new Error('SESSION_SECRET or SUPABASE_JWT_SECRET is not set');
  }
  const secret = new TextEncoder().encode(secretKey);
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(`admin_login_${ip}`, 10, 60 * 1000)) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan login admin. Silakan tunggu 1 menit.' },
        { status: 429 }
      );
    }

    const body = await request.json();
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
      return NextResponse.json({ error: 'Email atau kata sandi administrator salah.' }, { status: 401 });
    }

    const statusUpper = (user.status || 'AKTIF').toUpperCase();
    if (statusUpper === 'NONAKTIF' || statusUpper === 'NON-AKTIF' || statusUpper === 'DISABLED') {
      return NextResponse.json({ error: 'Akun administrator telah dinonaktifkan.' }, { status: 403 });
    }

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
      return NextResponse.json({ error: 'Email atau kata sandi administrator salah.' }, { status: 401 });
    }

    const roleName = (user.role?.name || '').toUpperCase();
    if (roleName !== 'ADMIN' && roleName !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Email atau kata sandi administrator salah.' }, { status: 401 });
    }

    if (prisma) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      }).catch((err) => logger.warn('Failed to update admin lastLogin:', err));
    }

    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: roleName
    };

    let signedToken;
    try {
      signedToken = await createSessionToken(sessionData);
    } catch (tokenError) {
      logger.error('Gagal membuat token JWT:', tokenError.message);
      return NextResponse.json({ error: 'Kesalahan internal saat membuat sesi.' }, { status: 500 });
    }

    const response = NextResponse.json({
      success: true,
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar || '',
      phone: user.phone || '',
      address: user.address || '',
      provider: user.provider || 'Email',
      status: user.status || 'Aktif',
      role: user.role,
    });

    const isProd = process.env.NODE_ENV === 'production';
    response.cookies.set('tanico_session', signedToken, {
      path: '/',
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    logger.info(`Admin logged in successfully: ${user.email} (${roleName})`);
    return response;

  } catch (error) {
    logger.error('API POST /api/admin/auth/login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}