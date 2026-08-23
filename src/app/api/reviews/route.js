import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const status = searchParams.get('status');

    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    const where = {};
    if (productId) where.productId = productId;
    if (status) where.status = status;

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return NextResponse.json(reviews || []);
  } catch (error) {
    logger.error('GET /api/reviews error:', error);
    return NextResponse.json({ error: 'Gagal memuat ulasan dari database' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      productId,
      productName,
      customerName,
      userId,
      userAvatar,
      rating,
      comment,
      status
    } = body;

    if (!customerName || !comment) {
      return NextResponse.json({ error: 'Nama dan ulasan wajib diisi' }, { status: 400 });
    }

    const newReview = await prisma.review.create({
      data: {
        productId: productId || null,
        productName: productName || 'Produk TaniCo',
        customerName,
        userId: userId || null,
        userAvatar: userAvatar || '',
        rating: Number(rating) || 5,
        comment,
        status: status || 'Pending'
      }
    });

    return NextResponse.json(newReview);
  } catch (error) {
    logger.error('POST /api/reviews error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan ulasan' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id') || body.id;

    if (!id) {
      return NextResponse.json({ error: 'ID ulasan diperlukan' }, { status: 400 });
    }

    const { rating, comment, status, reply, adminReply } = body;

    const updated = await prisma.review.update({
      where: { id },
      data: {
        ...(rating !== undefined && { rating: Number(rating) }),
        ...(comment !== undefined && { comment }),
        ...(status !== undefined && { status }),
        ...(reply !== undefined && { reply }),
        ...(adminReply !== undefined && { adminReply, adminReplyAt: new Date() })
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/reviews error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui ulasan' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json({ error: 'ID ulasan diperlukan' }, { status: 400 });
    }

    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Ulasan berhasil dihapus' });
  } catch (error) {
    logger.error('DELETE /api/reviews error:', error);
    return NextResponse.json({ error: 'Gagal menghapus ulasan' }, { status: 500 });
  }
}
