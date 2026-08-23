import { NextResponse } from 'next/server';
import { findUserByEmail, createPasswordResetToken } from '@/lib/dbActions';
import { isRateLimited, getClientIp } from '@/utils/rateLimit';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(`forgot_password_${ip}`, 5, 60 * 1000)) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan reset password. Silakan tunggu 1 menit.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const email = body?.email?.trim();

    if (!email) {
      return NextResponse.json({ error: 'Alamat email wajib diisi.' }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Email tidak ditemukan.' }, { status: 404 });
    }

    const tokenRecord = await createPasswordResetToken(email);

    logger.info(`Password reset token created for: ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Kami telah mengirimkan tautan untuk mengatur ulang password.',
      resetToken: tokenRecord.token,
      email: user.email
    });

  } catch (error) {
    logger.error('API POST /api/auth/forgot-password error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
