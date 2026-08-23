import { NextResponse } from 'next/server';
import { findUserByEmail, createUser } from '@/lib/dbActions';
import { registerSchema, getZodErrorMessage } from '@/utils/validators';
import { isRateLimited, getClientIp } from '@/utils/rateLimit';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    // Rate limit: Max 5 registration attempts per minute per IP
    if (isRateLimited(`register_${ip}`, 5, 60 * 1000)) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan pendaftaran. Silakan tunggu 1 menit.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Zod validation
    const parseResult = registerSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = getZodErrorMessage(parseResult.error, 'Data pendaftaran tidak valid.');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { name, email, password, phone, address } = parseResult.data;

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.',
          message: 'Email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.'
        }, 
        { status: 409 }
      );
    }

    // Server explicitly forces CUSTOMER role regardless of any frontend body inputs
    const newUser = await createUser({
      name,
      email,
      password,
      phone: phone || '',
      address: address || '',
      provider: 'Email',
      roleName: 'CUSTOMER'
    });

    logger.info(`New user registered: ${newUser.email}`);

    return NextResponse.json({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      avatar: newUser.avatar || '',
      phone: newUser.phone || '',
      address: newUser.address || '',
      provider: newUser.provider || 'Email',
      status: newUser.status || 'Aktif',
      role: newUser.role
    });

  } catch (error) {
    logger.error('API POST /api/auth/register error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
