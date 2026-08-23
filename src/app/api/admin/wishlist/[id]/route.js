import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    const item = await prisma.wishlistItem.findUnique({
      where: { id },
      include: { product: true, wishlist: { include: { user: true } } }
    });

    if (!item) {
      return NextResponse.json({ error: 'Item wishlist tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    logger.error('GET /api/admin/wishlist/[id] error:', error);
    return NextResponse.json({ error: 'Gagal mengambil detail item wishlist' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    await prisma.wishlistItem.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    logger.error('DELETE /api/admin/wishlist/[id] error:', error);
    return NextResponse.json({ error: 'Gagal menghapus item wishlist' }, { status: 500 });
  }
}
