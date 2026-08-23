import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { verifyAdminSession } from '@/utils/session';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    if (!(await verifyAdminSession(request))) {
      return NextResponse.json({ error: 'Akses ditolak. Memerlukan hak akses administrator.' }, { status: 403 });
    }
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        role: true,
        _count: { select: { orders: true } }
      }
    });

    const customers = users.map(u => ({
      id: u.id,
      name: u.name || u.username || 'Pelanggan TaniCo',
      email: u.email,
      phone: u.phone || '-',
      address: u.address || '-',
      role: u.role?.name || 'Pelanggan',
      status: u.status || 'Aktif',
      orderCount: u._count?.orders || 0,
      createdAt: u.createdAt
    }));

    return NextResponse.json(customers || []);
  } catch (error) {
    logger.error('GET /api/admin/customers error:', error);
    return NextResponse.json({ error: 'Gagal memuat data pelanggan dari database' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!(await verifyAdminSession(request))) {
      return NextResponse.json({ error: 'Akses ditolak. Memerlukan hak akses administrator.' }, { status: 403 });
    }
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();
    const { name, email, phone, address, status, password } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 });
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        name: name || 'Pelanggan TaniCo',
        phone: phone || '',
        address: address || '',
        status: status || 'Aktif',
        password: password || '123456'
      }
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    logger.error('POST /api/admin/customers error:', error);
    return NextResponse.json({ error: 'Gagal membuat pelanggan' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    if (!(await verifyAdminSession(request))) {
      return NextResponse.json({ error: 'Akses ditolak. Memerlukan hak akses administrator.' }, { status: 403 });
    }
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) return NextResponse.json({ error: 'ID pelanggan diperlukan' }, { status: 400 });

    const updated = await prisma.user.update({
      where: { id },
      data
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/admin/customers error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui pelanggan' }, { status: 500 });
  }
}
