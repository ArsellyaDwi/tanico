import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { clearHomeCache, getCacheItem, setCacheItem } from '@/lib/cache';
import { 
  ensureSupabaseImageUrl, 
  cleanupOldImageIfReplaced, 
  cleanupDeletedEntityImages 
} from '@/lib/supabaseStorage';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cacheKey = `articles_${searchParams.toString()}`;
    const cached = getCacheItem(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
        }
      });
    }

    const all = searchParams.get('all') === 'true';
    const slug = searchParams.get('slug');

    if (slug) {
      let article = await prisma.article.findUnique({
        where: { slug }
      }).catch(() => null);
      if (!article) {
        article = await prisma.article.findUnique({
          where: { id: slug }
        }).catch(() => null);
      }
      if (!article) {
        const formattedTitle = slug.replace(/-/g, ' ');
        article = await prisma.article.findFirst({
          where: {
            title: { equals: formattedTitle, mode: 'insensitive' }
          }
        }).catch(() => null);
      }
      if (article) {
        setCacheItem(cacheKey, article, 60 * 1000);
      }
      return NextResponse.json(article || null, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
        }
      });
    }

    const where = {};
    if (!all) {
      where.status = {
        notIn: ['Draft', 'Nonaktif', 'draft', 'nonaktif']
      };
    }
    const homepage = searchParams.get('homepage') === 'true';
    if (homepage) {
      where.showOnHomepage = true;
    }
    const kisahMitra = searchParams.get('kisahMitra') === 'true';
    if (kisahMitra) {
      where.showOnKisahMitra = true;
    }

    const articles = await prisma.article.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    const result = articles || [];
    setCacheItem(cacheKey, result, 60 * 1000);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    });
  } catch (error) {
    logger.error('API GET /api/articles error:', error);
    return NextResponse.json({ error: 'Gagal memuat artikel dari database' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      title,
      slug,
      category,
      author,
      image,
      excerpt,
      content,
      readTime,
      date,
      status,
      showOnHomepage,
      showOnKisahMitra,
      subtitle
    } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Judul dan konten wajib diisi' }, { status: 400 });
    }

    const generatedSlug = slug || title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newArticle = await prisma.article.create({
      data: {
        title,
        slug: generatedSlug,
        category: category || 'Edukasi',
        author: author || 'Tim TaniCo',
        image: image || '',
        excerpt: excerpt || '',
        content,
        readTime: readTime || '5 min baca',
        date: date || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        status: status || 'published',
        showOnHomepage: showOnHomepage !== false,
        showOnKisahMitra: showOnKisahMitra === true,
        subtitle: subtitle || ''
      }
    });

    clearHomeCache();
    return NextResponse.json(newArticle);
  } catch (error) {
    logger.error('API POST /api/articles error:', error);
    return NextResponse.json({ error: 'Gagal membuat artikel' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    const body = await request.json();
    if (!id) id = body.id;

    if (!id) {
      return NextResponse.json({ error: 'ID artikel wajib ada' }, { status: 400 });
    }

    const {
      title,
      slug,
      category,
      author,
      image,
      excerpt,
      content,
      readTime,
      date,
      status,
      showOnHomepage,
      showOnKisahMitra,
      subtitle
    } = body;

    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 });
    }

    let cleanImage = image;
    if (cleanImage) {
      cleanImage = await ensureSupabaseImageUrl(cleanImage, `article_${id}.jpg`, 'articles');
    }

    const updated = await prisma.article.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        slug: slug !== undefined ? slug : existing.slug,
        category: category !== undefined ? category : existing.category,
        author: author !== undefined ? author : existing.author,
        image: cleanImage !== undefined ? cleanImage : existing.image,
        excerpt: excerpt !== undefined ? excerpt : existing.excerpt,
        content: content !== undefined ? content : existing.content,
        readTime: readTime !== undefined ? readTime : existing.readTime,
        date: date !== undefined ? date : existing.date,
        status: status !== undefined ? status : existing.status,
        showOnHomepage: showOnHomepage !== undefined ? showOnHomepage : existing.showOnHomepage,
        showOnKisahMitra: showOnKisahMitra !== undefined ? showOnKisahMitra : existing.showOnKisahMitra,
        subtitle: subtitle !== undefined ? subtitle : existing.subtitle
      }
    });

    if (existing?.image && cleanImage && existing.image !== cleanImage) {
      await cleanupOldImageIfReplaced(existing.image, cleanImage, { model: 'Article', id });
    }

    clearHomeCache();
    return NextResponse.json(updated);
  } catch (error) {
    logger.error('API PUT /api/articles error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui artikel' }, { status: 500 });
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
      return NextResponse.json({ error: 'ID artikel wajib diisi' }, { status: 400 });
    }

    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 });
    }

    await prisma.article.delete({ where: { id } });

    if (existing?.image) {
      await cleanupDeletedEntityImages([existing.image], { model: 'Article', id });
    }

    clearHomeCache();
    return NextResponse.json({ success: true, message: 'Artikel berhasil dihapus' });
  } catch (error) {
    logger.error('API DELETE /api/articles error:', error);
    return NextResponse.json({ error: 'Gagal menghapus artikel' }, { status: 500 });
  }
}
