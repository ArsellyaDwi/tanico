import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, user: true }
    });

    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    logger.error('GET /api/admin/orders/[id] error:', error);
    return NextResponse.json({ error: 'Gagal mengambil detail pesanan' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...body,
        totalAmount: body.totalAmount !== undefined ? parseFloat(body.totalAmount) : undefined
      },
      include: { items: true, user: true }
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/admin/orders/[id] error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui pesanan' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    await prisma.order.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    logger.error('DELETE /api/admin/orders/[id] error:', error);
    return NextResponse.json({ error: 'Gagal menghapus pesanan' }, { status: 500 });
  }
}
