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

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    const article = await prisma.article.findUnique({
      where: { id }
    });

    if (!article) {
      return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    logger.error('GET /api/admin/articles/[id] error:', error);
    return NextResponse.json({ error: 'Gagal mengambil detail artikel' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();

    const existing = await prisma.article.findUnique({
      where: { id },
      select: { image: true }
    });

    if (body.image && body.image.startsWith('data:image')) {
      body.image = await ensureSupabaseImageUrl(body.image, `article_${id}.jpg`, 'articles');
    }

    const updated = await prisma.article.update({
      where: { id },
      data: body
    });

    if (existing?.image && body.image && existing.image !== body.image) {
      cleanupOldImageIfReplaced(existing.image, body.image, { model: 'Article', id });
    }

    clearHomeCache();
    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/admin/articles/[id] error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui artikel' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    const existing = await prisma.article.findUnique({
      where: { id },
      select: { image: true }
    });

    await prisma.article.delete({
      where: { id }
    });

    if (existing?.image) {
      cleanupDeletedEntityImages([existing.image], { model: 'Article', id });
    }

    clearHomeCache();
    return NextResponse.json({ success: true, id });
  } catch (error) {
    logger.error('DELETE /api/admin/articles/[id] error:', error);
    return NextResponse.json({ error: 'Gagal menghapus artikel' }, { status: 500 });
  }
}