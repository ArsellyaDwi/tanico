import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    const message = await prisma.contactMessage.findUnique({
      where: { id }
    });

    if (!message) {
      return NextResponse.json({ error: 'Pesan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(message);
  } catch (error) {
    logger.error('GET /api/admin/contacts/[id] error:', error);
    return NextResponse.json({ error: 'Gagal mengambil detail pesan' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: body
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/admin/contacts/[id] error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui pesan' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    await prisma.contactMessage.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    logger.error('DELETE /api/admin/contacts/[id] error:', error);
    return NextResponse.json({ error: 'Gagal menghapus pesan' }, { status: 500 });
  }
}
