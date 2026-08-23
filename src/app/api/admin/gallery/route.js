import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { 
  ensureSupabaseImageUrl, 
  cleanupOldImageIfReplaced, 
  cleanupDeletedEntityImages 
} from '@/lib/supabaseStorage';
import { clearHomeCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET - ambil semua galeri
export async function GET(request) {
  try {
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const gallery = await prisma.gallery.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    return NextResponse.json(gallery || []);
  } catch (error) {
    logger.error('GET /api/admin/gallery error:', error);
    return NextResponse.json({ error: 'Gagal memuat galeri dari database' }, { status: 500 });
  }
}

// POST - tambah galeri baru
export async function POST(request) {
  try {
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();
    const { title, image, span, active, sortOrder } = body;

    if (!title || !image) {
      return NextResponse.json({ error: 'Judul dan gambar galeri wajib diisi' }, { status: 400 });
    }

    const cleanImage = await ensureSupabaseImageUrl(image, `gallery_${Date.now()}.jpg`, 'gallery');

    const newGallery = await prisma.gallery.create({
      data: {
        title,
        image: cleanImage || image,
        span: span || 'col-span-1',
        active: active !== undefined ? Boolean(active) : true,
        sortOrder: sortOrder ? parseInt(sortOrder, 10) : 0
      }
    });

    clearHomeCache();
    return NextResponse.json(newGallery, { status: 201 });
  } catch (error) {
    logger.error('POST /api/admin/gallery error:', error);
    return NextResponse.json({ error: 'Gagal menambah foto galeri' }, { status: 500 });
  }
}

// PUT - update galeri
export async function PUT(request) {
  try {
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) return NextResponse.json({ error: 'ID galeri diperlukan' }, { status: 400 });

    const existing = await prisma.gallery.findUnique({
      where: { id }
    });

    if (data.image) {
      data.image = await ensureSupabaseImageUrl(data.image, `gallery_${id}.jpg`, 'gallery');
    }

    const updated = await prisma.gallery.update({
      where: { id },
      data: {
        ...data,
        sortOrder: data.sortOrder !== undefined ? parseInt(data.sortOrder, 10) : undefined
      }
    });

    if (existing?.image && data.image && existing.image !== data.image) {
      await cleanupOldImageIfReplaced(existing.image, data.image, { model: 'Gallery', id });
    }

    clearHomeCache();
    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/admin/gallery error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui galeri' }, { status: 500 });
  }
}

// DELETE - hapus galeri
export async function DELETE(request) {
  try {
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    // Ambil id dari query parameter
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID galeri diperlukan' }, { status: 400 });
    }

    // Cek apakah data ada
    const existing = await prisma.gallery.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Galeri tidak ditemukan' }, { status: 404 });
    }

    // Hapus dari database
    await prisma.gallery.delete({
      where: { id }
    });

    // Hapus file gambar dari Supabase (jika ada)
    if (existing.image) {
      await cleanupDeletedEntityImages([existing.image], { model: 'Gallery', id });
    }

    clearHomeCache();
    return NextResponse.json({ success: true, message: 'Galeri berhasil dihapus' });
  } catch (error) {
    logger.error('DELETE /api/admin/gallery error:', error);
    return NextResponse.json({ error: 'Gagal menghapus galeri' }, { status: 500 });
  }
}