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

export async function GET(request) {
  try {
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(articles || []);
  } catch (error) {
    logger.error('GET /api/admin/articles error:', error);
    return NextResponse.json({ error: 'Gagal memuat artikel dari database' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();
    const {
      title,
      subtitle,
      content,
      category,
      author,
      image,
      excerpt,
      readTime,
      date,
      status,
      showOnHomepage,
      showOnKisahMitra
    } = body;

    if (!title || (!content && !excerpt)) {
      return NextResponse.json({ error: 'Judul dan konten artikel wajib diisi' }, { status: 400 });
    }

    const slug = body.slug || title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let cleanImage = image || '';
    if (cleanImage && cleanImage.startsWith('data:image')) {
      cleanImage = await ensureSupabaseImageUrl(cleanImage, `article_${slug}.jpg`, 'articles');
    }

    const newArticle = await prisma.article.create({
      data: {
        title,
        subtitle: subtitle || '',
        slug,
        category: category || 'Edukasi',
        author: author || 'Tim TaniCo',
        image: cleanImage || '',
        excerpt: excerpt || '',
        content: content || excerpt || title,
        readTime: readTime || '5 min baca',
        date: date || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        status: status || 'published',
        showOnHomepage: showOnHomepage !== undefined ? Boolean(showOnHomepage) : true,
        showOnKisahMitra: showOnKisahMitra !== undefined ? Boolean(showOnKisahMitra) : false
      }
    });

    clearHomeCache();
    return NextResponse.json(newArticle, { status: 201 });
  } catch (error) {
    logger.error('POST /api/admin/articles error:', error);
    return NextResponse.json({ error: 'Gagal membuat artikel: ' + error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) return NextResponse.json({ error: 'ID artikel diperlukan' }, { status: 400 });

    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 });
    }

    if (data.image) {
      data.image = await ensureSupabaseImageUrl(data.image, `article_${id}.jpg`, 'articles');
    }

    const updated = await prisma.article.update({
      where: { id },
      data: {
        ...data,
        showOnHomepage: data.showOnHomepage !== undefined ? Boolean(data.showOnHomepage) : existing.showOnHomepage,
        showOnKisahMitra: data.showOnKisahMitra !== undefined ? Boolean(data.showOnKisahMitra) : existing.showOnKisahMitra
      }
    });

    if (existing?.image && data.image && existing.image !== data.image) {
      await cleanupOldImageIfReplaced(existing.image, data.image, { model: 'Article', id });
    }

    clearHomeCache();
    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/admin/articles error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui artikel: ' + error.message }, { status: 500 });
  }
}