import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getUserCart, saveUserCart } from '@/lib/dbActions';
import { isRateLimited, getClientIp } from '@/utils/rateLimit';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

async function getUserFromRequest(request) {
  try {
    // Coba ambil dari cookie
    const token = request.cookies.get('tanico_session')?.value;
    if (token) {
      const secret = new TextEncoder().encode(process.env.SESSION_SECRET || process.env.SUPABASE_JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      return payload; // { id, email, role, ... }
    }
    // Fallback: jika tidak ada cookie, coba header x-user-id (untuk guest / legacy)
    const userId = request.headers.get('x-user-id');
    if (userId) {
      return { id: userId };
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request) {
  try {
    const session = await getUserFromRequest(request);
    const userId = session?.id || request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Akses tidak diizinkan.' }, { status: 401 });
    }
    const cartItems = await getUserCart(userId);
    return NextResponse.json(cartItems);
  } catch (error) {
    logger.error('API GET /api/cart error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(`cart_${ip}`, 30, 60 * 1000)) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Silakan tunggu sebentar.' }, { status: 429 });
    }

    const session = await getUserFromRequest(request);
    const userId = session?.id || request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Akses tidak diizinkan.' }, { status: 401 });
    }
    const { productId, quantity, setQuantity } = await request.json();
    if (!productId) {
      return NextResponse.json({ error: 'ID produk wajib diisi' }, { status: 400 });
    }
    await saveUserCart(userId, productId, quantity, setQuantity);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('API POST /api/cart error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}