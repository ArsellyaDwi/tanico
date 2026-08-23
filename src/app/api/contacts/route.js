import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const contacts = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    return NextResponse.json(contacts || []);
  } catch (error) {
    logger.error('GET /api/contacts error:', error);
    return NextResponse.json({ error: 'Gagal memuat pesan kontak dari database' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Nama, email, dan pesan wajib diisi' }, { status: 400 });
    }

    const newContact = await prisma.contactMessage.create({
      data: {
        name,
        email,
        phone: phone || '',
        subject: subject || 'Pertanyaan Umum',
        message
      }
    });

    return NextResponse.json(newContact);
  } catch (error) {
    logger.error('POST /api/contacts error:', error);
    return NextResponse.json({ error: 'Gagal mengirim pesan' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, isRead, reply } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID pesan kontak diperlukan' }, { status: 400 });
    }

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: {
        ...(isRead !== undefined && { isRead }),
        ...(reply !== undefined && { reply })
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/contacts error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui kontak' }, { status: 500 });
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
      return NextResponse.json({ error: 'ID pesan kontak diperlukan' }, { status: 400 });
    }

    await prisma.contactMessage.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Pesan kontak berhasil dihapus' });
  } catch (error) {
    logger.error('DELETE /api/contacts error:', error);
    return NextResponse.json({ error: 'Gagal menghapus pesan kontak' }, { status: 500 });
  }
}
