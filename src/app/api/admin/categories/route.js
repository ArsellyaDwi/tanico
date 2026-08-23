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
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: true } }
      }
    });

    const formatted = categories.map(cat => ({
      ...cat,
      itemCount: cat._count?.products ?? cat.itemCount ?? 0
    }));

    return NextResponse.json(formatted || []);
  } catch (error) {
    logger.error('GET /api/admin/categories error:', error);
    return NextResponse.json({ error: 'Gagal memuat kategori dari database' }, { status: 500 });
  }
}

function sanitizeCategoryData(data) {
  const allowed = [
    'name',
    'slug',
    'image',
    'description',
    'itemCount',
    'status',
    'sortOrder',
    'badgeText',
    'badgeColor',
    'ctaLink',
    'ctaText',
    'showOnHomepage',
    'banner',
    'cropPosition',
    'cropZoom',
    'heroImage',
    'ogImage'
  ];

  const sanitized = {};
  for (const field of allowed) {
    if (data[field] !== undefined && data[field] !== null) {
      sanitized[field] = data[field];
    }
  }

  if (!sanitized.badgeText && data.metaTitle) {
    sanitized.badgeText = data.metaTitle;
  }

  if (sanitized.sortOrder !== undefined) {
    const parsed = parseInt(sanitized.sortOrder, 10);
    sanitized.sortOrder = Number.isNaN(parsed) ? 0 : parsed;
  }

  if (sanitized.itemCount !== undefined) {
    const parsed = parseInt(sanitized.itemCount, 10);
    sanitized.itemCount = Number.isNaN(parsed) ? 0 : parsed;
  }

  if (sanitized.showOnHomepage !== undefined) {
    sanitized.showOnHomepage = Boolean(sanitized.showOnHomepage);
  }

  if (sanitized.cropZoom !== undefined) {
    sanitized.cropZoom = String(sanitized.cropZoom);
  }

  return sanitized;
}

export async function POST(request) {
  try {
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();
    const { name } = body;

    if (!name || name.trim().length < 3) {
      return NextResponse.json({ error: 'Nama kategori minimal 3 karakter' }, { status: 400 });
    }

    const slug = body.slug || name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const existing = await prisma.category.findFirst({
      where: {
        OR: [
          { name: { equals: name.trim(), mode: 'insensitive' } },
          { slug: { equals: slug.trim(), mode: 'insensitive' } }
        ]
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Kategori dengan nama atau slug ini sudah ada' }, { status: 409 });
    }

    const cleanImage = await ensureSupabaseImageUrl(body.image, `category_${slug}.jpg`, 'categories');

    const sanitizedData = sanitizeCategoryData({
      ...body,
      name: name.trim(),
      slug: slug.trim(),
      image: cleanImage || '/placeholder-category.jpg',
      description: body.description || ''
    });

    if (body.id) {
      sanitizedData.id = body.id;
    }

    const newCat = await prisma.category.create({
      data: sanitizedData
    });

    clearHomeCache();
    return NextResponse.json(newCat, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Kategori dengan nama atau slug ini sudah ada' }, { status: 409 });
    }
    logger.error('POST /api/admin/categories error:', error);
    return NextResponse.json({ error: 'Gagal menambah kategori' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();

    if (Array.isArray(body)) {
      const updatedList = [];
      for (const item of body) {
        if (item.id) {
          const cleanItem = sanitizeCategoryData(item);
          const res = await prisma.category.update({
            where: { id: item.id },
            data: cleanItem
          });
          updatedList.push(res);
        }
      }
      clearHomeCache();
      return NextResponse.json(updatedList);
    }

    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'ID kategori diperlukan' }, { status: 400 });

    const existing = await prisma.category.findUnique({
      where: { id }
    });

    if (data.image) {
      data.image = await ensureSupabaseImageUrl(data.image, `category_${id}.jpg`, 'categories');
    }
    if (data.banner) {
      data.banner = await ensureSupabaseImageUrl(data.banner, `category_banner_${id}.jpg`, 'categories');
    }

    const sanitizedData = sanitizeCategoryData(data);

    const updated = await prisma.category.update({
      where: { id },
      data: sanitizedData
    });

    if (existing?.image && sanitizedData.image && existing.image !== sanitizedData.image) {
      await cleanupOldImageIfReplaced(existing.image, sanitizedData.image, { model: 'Category', id });
    }
    if (existing?.banner && sanitizedData.banner && existing.banner !== sanitizedData.banner) {
      await cleanupOldImageIfReplaced(existing.banner, sanitizedData.banner, { model: 'Category', id });
    }

    clearHomeCache();
    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/admin/categories error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui kategori' }, { status: 500 });
  }
}