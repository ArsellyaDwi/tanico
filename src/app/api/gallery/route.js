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

export async function GET() {
  try {
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const gallery = await prisma.gallery.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    return NextResponse.json(gallery || []);
  } catch (error) {
    logger.error('GET /api/gallery error:', error);
    return NextResponse.json({ error: 'Gagal memuat galeri dari database' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { image, title, span, active, sortOrder } = body;

    if (!image || !title) {
      return NextResponse.json({ error: 'Gambar dan judul galeri wajib diisi' }, { status: 400 });
    }

    const cleanImage = await ensureSupabaseImageUrl(image, `gallery_${Date.now()}.jpg`, 'gallery');

    const newItem = await prisma.gallery.create({
      data: {
        image: cleanImage || image,
        title,
        span: span || 'col-span-1',
        active: active !== false,
        sortOrder: Number(sortOrder) || 0
      }
    });

    clearHomeCache();
    return NextResponse.json(newItem);
  } catch (error) {
    logger.error('POST /api/gallery error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan galeri' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id') || body.id;

    if (!id) {
      return NextResponse.json({ error: 'ID galeri diperlukan' }, { status: 400 });
    }

    const existing = await prisma.gallery.findUnique({
      where: { id }
    });

    let { image, title, span, active, sortOrder } = body;

    if (image) {
      image = await ensureSupabaseImageUrl(image, `gallery_${id}.jpg`, 'gallery');
    }

    const updated = await prisma.gallery.update({
      where: { id },
      data: {
        ...(image !== undefined && { image }),
        ...(title !== undefined && { title }),
        ...(span !== undefined && { span }),
        ...(active !== undefined && { active }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) })
      }
    });

    if (existing?.image && image && existing.image !== image) {
      await cleanupOldImageIfReplaced(existing.image, image, { model: 'Gallery', id });
    }

    clearHomeCache();
    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/gallery error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui galeri' }, { status: 500 });
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
      return NextResponse.json({ error: 'ID galeri diperlukan' }, { status: 400 });
    }

    const existing = await prisma.gallery.findUnique({
      where: { id }
    });

    await prisma.gallery.delete({ where: { id } });

    if (existing?.image) {
      await cleanupDeletedEntityImages([existing.image], { model: 'Gallery', id });
    }

    clearHomeCache();
    return NextResponse.json({ success: true, message: 'Item galeri berhasil dihapus' });
  } catch (error) {
    logger.error('DELETE /api/gallery error:', error);
    return NextResponse.json({ error: 'Gagal menghapus galeri' }, { status: 500 });
  }
}
