import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { 
  ensureSupabaseImageUrl, 
  cleanupOldImageIfReplaced, 
  cleanupDeletedEntityImages 
} from '@/lib/supabaseStorage';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    const customer = await prisma.user.findUnique({
      where: { id },
      include: {
        orders: { orderBy: { createdAt: 'desc' }, take: 10 },
        reviews: true,
        wishlist: { include: { items: { include: { product: true } } } },
        cart: { include: { items: { include: { product: true } } } }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Pelanggan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    logger.error('GET /api/admin/customers/[id] error:', error);
    return NextResponse.json({ error: 'Gagal mengambil detail pelanggan' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Pelanggan tidak ditemukan' }, { status: 404 });
    }

    if (body.avatar) {
      body.avatar = await ensureSupabaseImageUrl(body.avatar, `user_${id}_${Date.now()}.jpg`, 'tanico-public');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: body
    });

    if (existing?.avatar && body.avatar && existing.avatar !== body.avatar) {
      await cleanupOldImageIfReplaced(existing.avatar, body.avatar, { model: 'User', id });
    }

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/admin/customers/[id] error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui pelanggan' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Pelanggan tidak ditemukan' }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id }
    });

    if (existing?.avatar) {
      await cleanupDeletedEntityImages([existing.avatar], { model: 'User', id });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    logger.error('DELETE /api/admin/customers/[id] error:', error);
    return NextResponse.json({ error: 'Gagal menghapus pelanggan' }, { status: 500 });
  }
}
