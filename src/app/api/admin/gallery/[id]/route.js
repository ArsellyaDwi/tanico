import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/utils/session';
import { prisma } from '@/lib/prisma';              
import { logger } from '@/utils/logger';            
import { 
  ensureSupabaseImageUrl, 
  cleanupOldImageIfReplaced, 
  cleanupDeletedEntityImages 
} from '@/lib/supabaseStorage';
import { clearHomeCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    if (!(await verifyAdminSession(request))) {
      return NextResponse.json({ error: 'Akses ditolak. Memerlukan hak akses administrator.' }, { status: 403 });
    }
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    const item = await prisma.gallery.findUnique({
      where: { id }
    });

    if (!item) {
      return NextResponse.json({ error: 'Foto galeri tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    logger.error('GET /api/admin/gallery/[id] error:', error);
    return NextResponse.json({ error: 'Gagal mengambil detail foto galeri' }, { status: 500 });
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

    const existing = await prisma.gallery.findUnique({
      where: { id },
      select: { image: true }
    });

    if (body.image) {
      body.image = await ensureSupabaseImageUrl(body.image, `gallery_${id}.jpg`, 'gallery');
    }

    const updated = await prisma.gallery.update({
      where: { id },
      data: {
        ...body,
        sortOrder: body.sortOrder !== undefined ? parseInt(body.sortOrder, 10) : undefined
      }
    });

    if (existing?.image && body.image && existing.image !== body.image) {
      cleanupOldImageIfReplaced(existing.image, body.image, { model: 'Gallery', id })
        .catch(err => logger.warn('Background cleanup failed:', err));
    }

    clearHomeCache();
    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/admin/gallery/[id] error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui foto galeri' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!(await verifyAdminSession(request))) {
      return NextResponse.json({ error: 'Akses ditolak. Memerlukan hak akses administrator.' }, { status: 403 });
    }
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    const existing = await prisma.gallery.findUnique({
      where: { id },
      select: { image: true }
    });

    await prisma.gallery.delete({
      where: { id }
    });

    if (existing?.image) {
      cleanupDeletedEntityImages([existing.image], { model: 'Gallery', id })
        .catch(err => logger.warn('Background cleanup failed:', err));
    }

    clearHomeCache();
    return NextResponse.json({ success: true, id });
  } catch (error) {
    logger.error('DELETE /api/admin/gallery/[id] error:', error);
    return NextResponse.json({ error: 'Gagal menghapus foto galeri' }, { status: 500 });
  }
}