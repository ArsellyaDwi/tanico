import { NextResponse } from 'next/server';
import { deleteUserWishlistItem } from '@/lib/dbActions';
import { getAuthenticatedUser } from '@/utils/session';
import { isRateLimited, getClientIp } from '@/utils/rateLimit';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(`wishlist_delete_${ip}`, 30, 60 * 1000)) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Silakan tunggu sebentar.' }, { status: 429 });
    }

    const resolvedParams = await params;
    const { productId } = resolvedParams;
    const session = await getAuthenticatedUser(request);
    const userId = session?.id || request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Akses tidak diizinkan.' }, { status: 401 });
    }
    if (!productId) {
      return NextResponse.json({ error: 'ID produk wajib diisi' }, { status: 400 });
    }
    await deleteUserWishlistItem(userId, productId);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('API DELETE /api/wishlist/[productId] error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

