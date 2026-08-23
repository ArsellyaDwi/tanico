import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('tanico_session');

    const response = NextResponse.json({ success: true, message: 'Berhasil keluar dari sesi admin.' });
    response.cookies.set('tanico_session', '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      httpOnly: false,
      sameSite: 'lax'
    });

    return response;
  } catch (error) {
    logger.error('Admin logout error:', error);
    return NextResponse.json({ success: false, error: 'Gagal keluar sesi.' }, { status: 500 });
  }
}
