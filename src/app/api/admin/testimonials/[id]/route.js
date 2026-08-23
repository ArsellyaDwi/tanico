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

    const item = await prisma.testimonial.findUnique({
      where: { id }
    });

    if (!item) {
      return NextResponse.json({ error: 'Testimoni tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    logger.error('GET /api/admin/testimonials/[id] error:', error);
    return NextResponse.json({ error: 'Gagal mengambil detail testimoni' }, { status: 500 });
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

    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Testimoni tidak ditemukan' }, { status: 404 });
    }

    let finalAvatar = existing.avatar;
    if (body.avatar !== undefined) {
      if (body.avatar === '') {
        finalAvatar = '';
      } else if (body.avatar.startsWith('data:image')) {
        const uploaded = await ensureSupabaseImageUrl(body.avatar, `testimonial_${id}.jpg`, 'testimonials');
        if (uploaded && !uploaded.startsWith('data:image')) {
          finalAvatar = uploaded;
        }
      } else {
        finalAvatar = body.avatar;
      }
    }

    const finalComment = body.comment !== undefined ? body.comment : (body.review !== undefined ? body.review : (body.content !== undefined ? body.content : existing.comment));

    if (body.name !== undefined && typeof body.name === 'string' && !body.name.trim()) {
      return NextResponse.json({ error: 'Nama testimoni tidak boleh kosong' }, { status: 400 });
    }

    if (finalComment !== undefined && typeof finalComment === 'string' && !finalComment.trim()) {
      return NextResponse.json({ error: 'Ulasan testimoni tidak boleh kosong' }, { status: 400 });
    }

    const updated = await prisma.testimonial.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.role !== undefined && { role: body.role.trim() }),
        ...(finalComment !== undefined && { comment: finalComment.trim() }),
        ...(body.rating !== undefined && { rating: parseInt(body.rating, 10) }),
        avatar: finalAvatar,
        ...(body.location !== undefined && { location: body.location.trim() }),
        ...(body.active !== undefined && { active: Boolean(body.active) }),
        ...(body.sortOrder !== undefined && { sortOrder: parseInt(body.sortOrder, 10) })
      }
    });

    if (existing?.avatar && finalAvatar && existing.avatar !== finalAvatar) {
      await cleanupOldImageIfReplaced(existing.avatar, finalAvatar, { model: 'Testimonial', id });
    }

    clearHomeCache();
    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/admin/testimonials/[id] error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui testimoni: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!(await verifyAdminSession(request))) {
      return NextResponse.json({ error: 'Akses ditolak. Memerlukan hak akses administrator.' }, { status: 403 });
    }
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Testimoni tidak ditemukan' }, { status: 404 });
    }

    await prisma.testimonial.delete({
      where: { id }
    });

    if (existing?.avatar) {
      await cleanupDeletedEntityImages([existing.avatar], { model: 'Testimonial', id });
    }

    clearHomeCache();
    return NextResponse.json({ success: true, id });
  } catch (error) {
    logger.error('DELETE /api/admin/testimonials/[id] error:', error);
    return NextResponse.json({ error: 'Gagal menghapus testimoni: ' + error.message }, { status: 500 });
  }
}
