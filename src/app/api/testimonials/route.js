import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { clearHomeCache } from '@/lib/cache';
import { 
  ensureSupabaseImageUrl, 
  cleanupOldImageIfReplaced, 
  cleanupDeletedEntityImages 
} from '@/lib/supabaseStorage';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === 'true';

    const testimonials = await prisma.testimonial.findMany({
      where: showAll ? {} : { active: true },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    return NextResponse.json(testimonials || []);
  } catch (error) {
    logger.error('GET /api/testimonials error:', error);
    return NextResponse.json({ error: 'Gagal memuat testimonial dari database' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();

    // Bulk Sync Mode
    if (Array.isArray(body.testimonials) || Array.isArray(body.list)) {
      const list = body.testimonials || body.list;
      const existing = await prisma.testimonial.findMany({ select: { id: true, avatar: true } });
      const existingMap = new Map(existing.map(t => [t.id, t]));

      const incomingValidIds = new Set();
      list.forEach(t => {
        if (t.id && existingMap.has(t.id)) {
          incomingValidIds.add(t.id);
        }
      });

      const idsToDelete = Array.from(existingMap.keys()).filter(id => !incomingValidIds.has(id));
      if (idsToDelete.length > 0) {
        const toDeleteRecords = idsToDelete.map(id => existingMap.get(id)).filter(Boolean);
        await prisma.testimonial.deleteMany({
          where: { id: { in: idsToDelete } }
        });
        const deleteAvatars = toDeleteRecords.map(r => r.avatar).filter(Boolean);
        if (deleteAvatars.length > 0) {
          await cleanupDeletedEntityImages(deleteAvatars, { model: 'Testimonial', ids: idsToDelete });
        }
      }

      for (let i = 0; i < list.length; i++) {
        const t = list[i];
        const tName = t.name || `Pelanggan ${i + 1}`;
        const tComment = t.comment || t.review || t.content || '';
        
        let finalAvatar = '';
        if (t.avatar) {
          if (t.avatar.startsWith('data:image')) {
            const uploaded = await ensureSupabaseImageUrl(t.avatar, `testimonial_${t.id || Date.now()}_${i}.jpg`, 'testimonials');
            if (uploaded && !uploaded.startsWith('data:image')) {
              finalAvatar = uploaded;
            } else if (t.id && existingMap.has(t.id)) {
              finalAvatar = existingMap.get(t.id)?.avatar || '';
            }
          } else {
            finalAvatar = t.avatar;
          }
        } else if (t.id && existingMap.has(t.id)) {
          finalAvatar = existingMap.get(t.id)?.avatar || '';
        }

        const tData = {
          name: tName,
          role: t.role || 'Pelanggan Setia',
          location: t.location || t.city || '',
          comment: tComment,
          rating: Number(t.rating) || 5,
          avatar: finalAvatar,
          active: t.active !== false,
          sortOrder: Number(t.sortOrder) || i
        };

        if (t.id && existingMap.has(t.id)) {
          const oldAvatar = existingMap.get(t.id)?.avatar;
          await prisma.testimonial.update({
            where: { id: t.id },
            data: tData
          });
          if (oldAvatar && finalAvatar && oldAvatar !== finalAvatar) {
            await cleanupOldImageIfReplaced(oldAvatar, finalAvatar, { model: 'Testimonial', id: t.id });
          }
        } else {
          await prisma.testimonial.create({
            data: tData
          });
        }
      }

      clearHomeCache();
      const updatedList = await prisma.testimonial.findMany({
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'desc' }
        ]
      });
      return NextResponse.json(updatedList);
    }

    // Single Create Mode
    const { name, role, comment, review, content, rating, avatar, location, active, sortOrder } = body;
    const finalComment = typeof comment === 'string' ? comment : (typeof review === 'string' ? review : (typeof content === 'string' ? content : ''));

    if (!name?.trim() || !finalComment?.trim()) {
      return NextResponse.json({ error: 'Nama dan ulasan testimoni wajib diisi' }, { status: 400 });
    }

    let finalAvatar = '';
    if (avatar) {
      if (avatar.startsWith('data:image')) {
        const uploaded = await ensureSupabaseImageUrl(avatar, `testimonial_${Date.now()}.jpg`, 'testimonials');
        if (uploaded && !uploaded.startsWith('data:image')) {
          finalAvatar = uploaded;
        }
      } else {
        finalAvatar = avatar;
      }
    }

    const newTestimonial = await prisma.testimonial.create({
      data: {
        name: name.trim(),
        role: (role || 'Pelanggan Setia').trim(),
        comment: finalComment.trim(),
        rating: Number(rating) || 5,
        avatar: finalAvatar,
        location: (location || '').trim(),
        active: active !== false,
        sortOrder: Number(sortOrder) || 0
      }
    });

    clearHomeCache();
    return NextResponse.json(newTestimonial, { status: 201 });
  } catch (error) {
    logger.error('POST /api/testimonials error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan testimoni: ' + error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const id = body.id || searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID testimoni diperlukan' }, { status: 400 });
    }

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
        ...(body.rating !== undefined && { rating: Number(body.rating) }),
        avatar: finalAvatar,
        ...(body.location !== undefined && { location: body.location.trim() }),
        ...(body.active !== undefined && { active: Boolean(body.active) }),
        ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) })
      }
    });

    clearHomeCache();
    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/testimonials error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui testimoni: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json({ error: 'ID testimoni diperlukan' }, { status: 400 });
    }

    await prisma.testimonial.delete({ where: { id } });
    clearHomeCache();
    return NextResponse.json({ success: true, message: 'Testimoni berhasil dihapus' });
  } catch (error) {
    logger.error('DELETE /api/testimonials error:', error);
    return NextResponse.json({ error: 'Gagal menghapus testimoni: ' + error.message }, { status: 500 });
  }
}
