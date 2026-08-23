import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: { product: true, cart: { include: { user: true } } }
    });

    if (!cartItem) {
      return NextResponse.json({ error: 'Item keranjang tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(cartItem);
  } catch (error) {
    logger.error('GET /api/admin/cart/[id] error:', error);
    return NextResponse.json({ error: 'Gagal mengambil detail item keranjang' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();

    const updated = await prisma.cartItem.update({
      where: { id },
      data: {
        quantity: body.quantity !== undefined ? parseInt(body.quantity, 10) : undefined
      },
      include: { product: true }
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/admin/cart/[id] error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui item keranjang' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    await prisma.cartItem.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    logger.error('DELETE /api/admin/cart/[id] error:', error);
    return NextResponse.json({ error: 'Gagal menghapus item keranjang' }, { status: 500 });
  }
}