import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get('tanico_session')?.value;
    }

    if (!token) {
      return NextResponse.json({ valid: false, message: 'Tidak ada sesi' }, { status: 401 });
    }

    const payload = await verifySessionToken(token);
    if (!payload) {
      return NextResponse.json({ valid: false, message: 'Sesi tidak valid' }, { status: 401 });
    }

    const roleUpper = (payload.role?.name || payload.role || '').toUpperCase();
    const isAdmin = roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN' || roleUpper === 'SUPERADMIN' || payload.isAdmin;

    if (!isAdmin) {
      return NextResponse.json({ valid: false, message: 'Akses ditolak: bukan administrator' }, { status: 403 });
    }

    return NextResponse.json({ valid: true, user: payload });
  } catch (error) {
    logger.error('Session validation error:', error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}