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
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(messages || []);
  } catch (error) {
    logger.error('GET /api/admin/contacts error:', error);
    return NextResponse.json({ error: 'Gagal memuat pesan kontak dari database' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!(await verifyAdminSession(request))) {
      return NextResponse.json({ error: 'Akses ditolak. Memerlukan hak akses administrator.' }, { status: 403 });
    }
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Nama, email, dan pesan wajib diisi' }, { status: 400 });
    }

    const newMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        phone: phone || '-',
        subject: subject || 'Pesan Baru',
        message
      }
    });

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    logger.error('POST /api/admin/contacts error:', error);
    return NextResponse.json({ error: 'Gagal membuat pesan kontak' }, { status: 500 });
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
          const res = await prisma.contactMessage.update({
            where: { id: item.id },
            data: {
              isRead: item.isRead !== undefined ? Boolean(item.isRead) : undefined,
              reply: item.reply
            }
          });
          updatedList.push(res);
        }
      }
      return NextResponse.json(updatedList);
    }

    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'ID pesan diperlukan' }, { status: 400 });

    const updated = await prisma.contactMessage.update({
      where: { id },
      data
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/admin/contacts error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui pesan kontak' }, { status: 500 });
  }
}
