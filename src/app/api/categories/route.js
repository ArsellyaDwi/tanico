import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/utils/session';
import { logger } from '@/utils/logger';
import { clearHomeCache, getCacheItem, setCacheItem } from '@/lib/cache';
import { 
  ensureSupabaseImageUrl, 
  cleanupOldImageIfReplaced, 
  cleanupDeletedEntityImages 
} from '@/lib/supabaseStorage';

export const dynamic = 'force-dynamic';

// GET -> Ambil semua kategori, bisa difilter berdasarkan status dan showOnHomepage
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cacheKey = `categories_${searchParams.toString()}`;
    const cached = getCacheItem(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
        }
      });
    }

    const status = searchParams.get('status');
    const showOnHomepageParam = searchParams.get('showOnHomepage');

    const where = {};
    if (status) {
      where.status = status;
    }
    if (showOnHomepageParam !== null) {
      where.showOnHomepage = showOnHomepageParam === 'true';
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { sortOrder: 'asc' }
    });

    const result = categories || [];
    setCacheItem(cacheKey, result, 60 * 1000);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    });
  } catch (error) {
    logger.error('GET /api/categories error:', error.message || error);
    return NextResponse.json({ error: 'Gagal memuat kategori dari database' }, { status: 500 });
  }
}

// POST -> Tambah kategori baru, validasi slug unik
export async function POST(request) {
  try {
    if (!(await verifyAdminSession(request))) {
      return NextResponse.json({ error: 'Akses ditolak: Memerlukan hak akses Admin yang sah.' }, { status: 403 });
    }
    if (!prisma) {
      return NextResponse.json({ error: 'Database tidak tersedia.' }, { status: 500 });
    }
    const body = await request.json();
    const { 
      name, 
      image, 
      description, 
      status, 
      sortOrder, 
      metaTitle, 
      badgeColor, 
      ctaLink, 
      ctaText, 
      showOnHomepage,
      cropPosition,
      cropZoom,
      banner,
      heroImage,
      ogImage
    } = body;

    // Validation
    if (!name || name.trim().length < 3) {
      return NextResponse.json({ error: 'Nama kategori minimal 3 karakter' }, { status: 400 });
    }
    if (!image) {
      return NextResponse.json({ error: 'Gambar wajib diisi' }, { status: 400 });
    }

    const slug = body.slug || name.toLowerCase().trim().replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    // Check uniqueness
    const existing = await prisma.category.findFirst({
      where: {
        OR: [
          { slug },
          { name: { equals: name } }
        ]
      }
    });
    if (existing) {
      return NextResponse.json({ error: 'Kategori dengan nama atau slug ini sudah terdaftar' }, { status: 400 });
    }

    const id = body.id || `cat-${slug}`;

    const cleanImage = await ensureSupabaseImageUrl(image, `category_${slug}.jpg`, 'categories');
    const cleanBanner = banner ? await ensureSupabaseImageUrl(banner, `cat_banner_${slug}.jpg`, 'categories') : '';
    const cleanHero = heroImage ? await ensureSupabaseImageUrl(heroImage, `cat_hero_${slug}.jpg`, 'categories') : '';
    const cleanOg = ogImage ? await ensureSupabaseImageUrl(ogImage, `cat_og_${slug}.jpg`, 'categories') : '';

    const newCategory = await prisma.category.create({
      data: {
        id,
        name,
        slug,
        image: cleanImage || image,
        description: description || '',
        status: status || 'Aktif',
        sortOrder: parseInt(sortOrder) || 0,
        badgeText: metaTitle || '',
        badgeColor: badgeColor || 'Green',
        ctaLink: ctaLink || '',
        ctaText: ctaText || '',
        showOnHomepage: showOnHomepage !== false,
        cropPosition: cropPosition || 'center center',
        cropZoom: cropZoom || '100',
        banner: cleanBanner || '',
        heroImage: cleanHero || '',
        ogImage: cleanOg || ''
      }
    });
    clearHomeCache();
    return NextResponse.json(newCategory);
  } catch (error) {
    logger.error('API POST /api/categories error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

// PUT -> Update kategori berdasarkan ID
export async function PUT(request) {
  try {
    if (!(await verifyAdminSession(request))) {
      return NextResponse.json({ error: 'Akses ditolak: Memerlukan hak akses Admin yang sah.' }, { status: 403 });
    }
    if (!prisma) {
      return NextResponse.json({ error: 'Database tidak tersedia.' }, { status: 500 });
    }
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    const body = await request.json();
    if (!id) {
      id = body.id;
    }

    const { 
      name, 
      slug: inputSlug, 
      image, 
      description, 
      status, 
      sortOrder, 
      metaTitle, 
      badgeText,
      badgeColor, 
      ctaLink, 
      ctaText, 
      showOnHomepage,
      cropPosition,
      cropZoom,
      banner,
      heroImage,
      ogImage
    } = body;

    // Find category by ID, or fallback to name/slug match
    let existing = null;
    if (id) {
      existing = await prisma.category.findUnique({ where: { id } });
    }
    if (!existing && (name || inputSlug)) {
      existing = await prisma.category.findFirst({
        where: {
          OR: [
            ...(name ? [{ name: name.trim() }] : []),
            ...(inputSlug ? [{ slug: inputSlug.trim() }] : [])
          ]
        }
      });
    }

    if (!existing) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    const targetId = existing.id;

    // Validation
    if (name !== undefined && name.trim().length < 3) {
      return NextResponse.json({ error: 'Nama kategori minimal 3 karakter' }, { status: 400 });
    }

    let slug = inputSlug;
    if (name !== undefined && !slug) {
      slug = name.toLowerCase().trim().replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.category.findFirst({ where: { slug, id: { not: targetId } } });
      if (slugExists) {
        return NextResponse.json({ error: 'Slug sudah terdaftar pada kategori lain' }, { status: 400 });
      }
    }
    if (name && name.trim() !== existing.name) {
      const nameExists = await prisma.category.findFirst({ where: { name: name.trim(), id: { not: targetId } } });
      if (nameExists) {
        return NextResponse.json({ error: 'Nama kategori sudah terdaftar pada kategori lain' }, { status: 400 });
      }
    }

    let safeSortOrder = existing.sortOrder;
    if (sortOrder !== undefined) {
      const parsed = parseInt(sortOrder, 10);
      safeSortOrder = Number.isNaN(parsed) ? existing.sortOrder : parsed;
    }

    const badgeTextVal = badgeText !== undefined 
      ? badgeText 
      : (metaTitle !== undefined ? metaTitle : (existing.badgeText || ''));

    let cleanImage = image;
    if (cleanImage) {
      cleanImage = await ensureSupabaseImageUrl(cleanImage, `category_${targetId}.jpg`, 'categories');
    }
    let cleanBanner = banner;
    if (cleanBanner) {
      cleanBanner = await ensureSupabaseImageUrl(cleanBanner, `cat_banner_${targetId}.jpg`, 'categories');
    }
    let cleanHero = heroImage;
    if (cleanHero) {
      cleanHero = await ensureSupabaseImageUrl(cleanHero, `cat_hero_${targetId}.jpg`, 'categories');
    }
    let cleanOg = ogImage;
    if (cleanOg) {
      cleanOg = await ensureSupabaseImageUrl(cleanOg, `cat_og_${targetId}.jpg`, 'categories');
    }

    const updated = await prisma.category.update({
      where: { id: targetId },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        slug: slug !== undefined ? slug.trim() : existing.slug,
        image: cleanImage !== undefined ? cleanImage : existing.image,
        description: description !== undefined ? description : existing.description,
        status: status !== undefined ? status : existing.status,
        sortOrder: safeSortOrder,
        badgeText: badgeTextVal,
        badgeColor: badgeColor !== undefined ? badgeColor : existing.badgeColor,
        ctaLink: ctaLink !== undefined ? ctaLink : existing.ctaLink,
        ctaText: ctaText !== undefined ? ctaText : existing.ctaText,
        showOnHomepage: showOnHomepage !== undefined ? showOnHomepage : existing.showOnHomepage,
        cropPosition: cropPosition !== undefined ? cropPosition : existing.cropPosition,
        cropZoom: cropZoom !== undefined ? cropZoom : existing.cropZoom,
        banner: cleanBanner !== undefined ? cleanBanner : existing.banner,
        heroImage: cleanHero !== undefined ? cleanHero : existing.heroImage,
        ogImage: cleanOg !== undefined ? cleanOg : existing.ogImage
      }
    });

    if (existing?.image && cleanImage && existing.image !== cleanImage) {
      await cleanupOldImageIfReplaced(existing.image, cleanImage, { model: 'Category', id: targetId });
    }
    if (existing?.banner && cleanBanner && existing.banner !== cleanBanner) {
      await cleanupOldImageIfReplaced(existing.banner, cleanBanner, { model: 'Category', id: targetId });
    }
    if (existing?.heroImage && cleanHero && existing.heroImage !== cleanHero) {
      await cleanupOldImageIfReplaced(existing.heroImage, cleanHero, { model: 'Category', id: targetId });
    }
    if (existing?.ogImage && cleanOg && existing.ogImage !== cleanOg) {
      await cleanupOldImageIfReplaced(existing.ogImage, cleanOg, { model: 'Category', id: targetId });
    }

    clearHomeCache();
    return NextResponse.json(updated);
  } catch (error) {
    logger.error('API PUT /api/categories error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

// DELETE -> Hapus kategori (cek relasi produk dulu)
export async function DELETE(request) {
  try {
    if (!(await verifyAdminSession(request))) {
      return NextResponse.json({ error: 'Akses ditolak: Memerlukan hak akses Admin yang sah.' }, { status: 403 });
    }
    if (!prisma) {
      return NextResponse.json({ error: 'Database tidak tersedia.' }, { status: 500 });
    }
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json({ error: 'ID kategori wajib disertakan' }, { status: 400 });
    }

    // Check related products
    const relatedProduct = await prisma.product.findFirst({
      where: { categoryId: id }
    });
    if (relatedProduct) {
      return NextResponse.json({ 
        error: 'Tidak dapat menghapus kategori karena masih ada produk yang menggunakan kategori ini' 
      }, { status: 400 });
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    await prisma.category.delete({ where: { id } });

    const urls = [existing.image, existing.banner, existing.heroImage, existing.ogImage].filter(Boolean);
    if (urls.length > 0) {
      await cleanupDeletedEntityImages(urls, { model: 'Category', id });
    }

    clearHomeCache();
    return NextResponse.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (error) {
    logger.error('API DELETE /api/categories error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
