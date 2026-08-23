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
    const carts = await prisma.cart.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
    return NextResponse.json(carts || []);
  } catch (error) {
    logger.error('GET /api/admin/cart error:', error);
    return NextResponse.json({ error: 'Gagal memuat keranjang dari database' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!(await verifyAdminSession(request))) {
      return NextResponse.json({ error: 'Akses ditolak. Memerlukan hak akses administrator.' }, { status: 403 });
    }
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();
    const { userId, productId, quantity } = body;

    if (!userId || !productId) {
      return NextResponse.json({ error: 'userId dan productId wajib diisi' }, { status: 400 });
    }

    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    const cartItem = await prisma.cartItem.upsert({
      where: {
        cartId_productId: { cartId: cart.id, productId }
      },
      update: {
        quantity: { increment: quantity ? parseInt(quantity, 10) : 1 }
      },
      create: {
        cartId: cart.id,
        productId,
        quantity: quantity ? parseInt(quantity, 10) : 1
      },
      include: { product: true }
    });

    return NextResponse.json(cartItem, { status: 201 });
  } catch (error) {
    logger.error('POST /api/admin/cart error:', error);
    return NextResponse.json({ error: 'Gagal mengubah keranjang' }, { status: 500 });
  }
}
