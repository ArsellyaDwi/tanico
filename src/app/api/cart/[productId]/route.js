import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { deleteUserCartItem } from '@/lib/dbActions';
import { isRateLimited, getClientIp } from '@/utils/rateLimit';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

async function getUserFromRequest(request) {
  try {
    const token = request.cookies.get('tanico_session')?.value;
    if (token) {
      const secret = new TextEncoder().encode(process.env.SESSION_SECRET || process.env.SUPABASE_JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      return payload;
    }
    const userId = request.headers.get('x-user-id');
    if (userId) {
      return { id: userId };
    }
    return null;
  } catch {
    return null;
  }
}

export async function DELETE(request, { params }) {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(`cart_delete_${ip}`, 30, 60 * 1000)) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Silakan tunggu sebentar.' }, { status: 429 });
    }

    const resolvedParams = await params;
    const { productId } = resolvedParams;
    const session = await getUserFromRequest(request);
    const userId = session?.id || request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Akses tidak diizinkan.' }, { status: 401 });
    }
    if (!productId) {
      return NextResponse.json({ error: 'ID produk wajib diisi' }, { status: 400 });
    }
    await deleteUserCartItem(userId, productId);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('API DELETE /api/cart/[productId] error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}