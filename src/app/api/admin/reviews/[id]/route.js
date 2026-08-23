import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    const review = await prisma.review.findUnique({
      where: { id },
      include: { product: true }
    });

    if (!review) {
      return NextResponse.json({ error: 'Review tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(review);
  } catch (error) {
    logger.error('GET /api/admin/reviews/[id] error:', error);
    return NextResponse.json({ error: 'Gagal mengambil detail review' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();

    const updated = await prisma.review.update({
      where: { id },
      data: {
        ...body,
        rating: body.rating !== undefined ? parseInt(body.rating, 10) : undefined,
        adminReplyAt: body.adminReply ? new Date() : undefined
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/admin/reviews/[id] error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui review' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    await prisma.review.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    logger.error('DELETE /api/admin/reviews/[id] error:', error);
    return NextResponse.json({ error: 'Gagal menghapus review' }, { status: 500 });
  }
}
