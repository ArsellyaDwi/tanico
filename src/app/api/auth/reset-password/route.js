import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { 
  findUserByEmail, 
  updateUserPassword, 
  verifyPasswordResetToken, 
  deletePasswordResetToken 
} from '@/lib/dbActions';
import { isRateLimited, getClientIp } from '@/utils/rateLimit';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(`reset_password_${ip}`, 10, 60 * 1000)) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan reset password. Silakan tunggu 1 menit.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, token, password, confirmPassword } = body || {};

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password minimal 8 karakter.' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Konfirmasi password tidak cocok.' },
        { status: 400 }
      );
    }

    let user = null;

    if (token) {
      const tokenRecord = await verifyPasswordResetToken(token, email);
      if (!tokenRecord) {
        return NextResponse.json(
          { error: 'Token reset password tidak valid atau sudah kadaluarsa.' },
          { status: 400 }
        );
      }
      user = await findUserByEmail(tokenRecord.email);
    } else if (email) {
      user = await findUserByEmail(email);
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const updated = await updateUserPassword(user.id, hashedPassword);

    if (!updated) {
      return NextResponse.json(
        { error: 'Gagal memperbarui password.' },
        { status: 500 }
      );
    }

    if (token) {
      await deletePasswordResetToken(token);
    }

    logger.info(`Password successfully reset for user: ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diperbarui. Silakan login.'
    });

  } catch (error) {
    logger.error('API POST /api/auth/reset-password error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
