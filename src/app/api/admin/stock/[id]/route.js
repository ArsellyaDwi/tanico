import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/utils/session';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    if (!(await verifyAdminSession(request))) {
      return NextResponse.json({ error: 'Akses ditolak. Memerlukan hak akses administrator.' }, { status: 403 });
    }
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    const item = await prisma.stockHistory.findUnique({
      where: { id },
      include: { product: true }
    });

    if (!item) {
      return NextResponse.json({ error: 'Data stok tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    logger.error('GET /api/admin/stock-history/[id] error:', error);
    return NextResponse.json({ error: 'Gagal mengambil detail mutasi stok' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    if (!(await verifyAdminSession(request))) {
      return NextResponse.json({ error: 'Akses ditolak. Memerlukan hak akses administrator.' }, { status: 403 });
    }
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();

    const updated = await prisma.stockHistory.update({
      where: { id },
      data: {
        ...body,
        quantity: body.quantity !== undefined ? parseInt(body.quantity, 10) : undefined
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/admin/stock-history/[id] error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui mutasi stok' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!(await verifyAdminSession(request))) {
      return NextResponse.json({ error: 'Akses ditolak. Memerlukan hak akses administrator.' }, { status: 403 });
    }
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    await prisma.stockHistory.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    logger.error('DELETE /api/admin/stock-history/[id] error:', error);
    return NextResponse.json({ error: 'Gagal menghapus mutasi stok' }, { status: 500 });
  }
}
