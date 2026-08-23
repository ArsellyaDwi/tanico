import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/utils/session';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    if (!(await verifyAdminSession(request))) {
      return NextResponse.json({ error: 'Akses ditolak. Memerlukan hak akses administrator.' }, { status: 403 });
    }
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const wishlists = await prisma.wishlist.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
    return NextResponse.json(wishlists || []);
  } catch (error) {
    logger.error('GET /api/admin/wishlist error:', error);
    return NextResponse.json({ error: 'Gagal memuat wishlist dari database' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!(await verifyAdminSession(request))) {
      return NextResponse.json({ error: 'Akses ditolak. Memerlukan hak akses administrator.' }, { status: 403 });
    }
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();
    const { userId, productId } = body;

    if (!userId || !productId) {
      return NextResponse.json({ error: 'userId dan productId wajib diisi' }, { status: 400 });
    }

    let wishlist = await prisma.wishlist.findUnique({ where: { userId } });
    if (!wishlist) {
      wishlist = await prisma.wishlist.create({ data: { userId } });
    }

    const wishlistItem = await prisma.wishlistItem.upsert({
      where: {
        wishlistId_productId: { wishlistId: wishlist.id, productId }
      },
      update: {},
      create: {
        wishlistId: wishlist.id,
        productId
      },
      include: { product: true }
    });

    return NextResponse.json(wishlistItem, { status: 201 });
  } catch (error) {
    logger.error('POST /api/admin/wishlist error:', error);
    return NextResponse.json({ error: 'Gagal mengubah wishlist' }, { status: 500 });
  }
}
