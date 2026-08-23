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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where = {};
    if (status) where.status = status;

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, image: true } }
      }
    });

    return NextResponse.json(reviews || []);
  } catch (error) {
    logger.error('GET /api/admin/reviews error:', error);
    return NextResponse.json({ error: 'Gagal memuat ulasan dari database' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!(await verifyAdminSession(request))) {
      return NextResponse.json({ error: 'Akses ditolak. Memerlukan hak akses administrator.' }, { status: 403 });
    }
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();
    const { productId, productName, customerName, rating, comment, status } = body;

    const newReview = await prisma.review.create({
      data: {
        productId: productId || null,
        productName: productName || 'Produk Organik',
        customerName: customerName || 'Pelanggan',
        rating: parseInt(rating || 5, 10),
        comment: comment || '',
        status: status || 'Pending'
      }
    });

    return NextResponse.json(newReview, { status: 201 });
  } catch (error) {
    logger.error('POST /api/admin/reviews error:', error);
    return NextResponse.json({ error: 'Gagal membuat review' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    if (!(await verifyAdminSession(request))) {
      return NextResponse.json({ error: 'Akses ditolak. Memerlukan hak akses administrator.' }, { status: 403 });
    }
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();

    if (Array.isArray(body)) {
      const updatedList = [];
      for (const item of body) {
        if (item.id) {
          const res = await prisma.review.update({
            where: { id: item.id },
            data: {
              status: item.status,
              adminReply: item.adminReply || item.reply,
              adminReplyAt: item.adminReply ? new Date() : undefined
            }
          });
          updatedList.push(res);
        }
      }
      return NextResponse.json(updatedList);
    }

    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'ID review diperlukan' }, { status: 400 });

    const updated = await prisma.review.update({
      where: { id },
      data: {
        ...data,
        rating: data.rating !== undefined ? parseInt(data.rating, 10) : undefined,
        adminReplyAt: data.adminReply ? new Date() : undefined
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/admin/reviews error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui review' }, { status: 500 });
  }
}
