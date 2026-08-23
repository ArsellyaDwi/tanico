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

    const category = await prisma.category.findUnique({
      where: { id },
      include: { products: true }
    });

    if (!category) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    logger.error('GET /api/admin/categories/[id] error:', error);
    return NextResponse.json({ error: 'Gagal mengambil detail kategori' }, { status: 500 });
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

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();

    const existing = await prisma.category.findUnique({
      where: { id },
      select: { image: true, banner: true, heroImage: true, ogImage: true }
    });

    let image = body.image;
    if (image) {
      image = await ensureSupabaseImageUrl(image, `category_${id}.jpg`, 'categories');
    }
    let banner = body.banner;
    if (banner) {
      banner = await ensureSupabaseImageUrl(banner, `category_banner_${id}.jpg`, 'categories');
    }

    const dataToUpdate = sanitizeCategoryData({ ...body, image, banner });

    const updated = await prisma.category.update({
      where: { id },
      data: dataToUpdate
    });

    if (existing?.image && dataToUpdate.image && existing.image !== dataToUpdate.image) {
      cleanupOldImageIfReplaced(existing.image, dataToUpdate.image, { model: 'Category', id });
    }
    if (existing?.banner && dataToUpdate.banner && existing.banner !== dataToUpdate.banner) {
      cleanupOldImageIfReplaced(existing.banner, dataToUpdate.banner, { model: 'Category', id });
    }

    clearHomeCache();
    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/admin/categories/[id] error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui kategori' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    const existing = await prisma.category.findUnique({
      where: { id },
      select: { image: true, banner: true, heroImage: true, ogImage: true }
    });

    await prisma.category.delete({
      where: { id }
    });

    const urls = [existing?.image, existing?.banner, existing?.heroImage, existing?.ogImage].filter(Boolean);
    if (urls.length > 0) {
      cleanupDeletedEntityImages(urls, { model: 'Category', id });
    }

    clearHomeCache();
    return NextResponse.json({ success: true, id });
  } catch (error) {
    logger.error('DELETE /api/admin/categories/[id] error:', error);
    return NextResponse.json({ error: 'Gagal menghapus kategori' }, { status: 500 });
  }
}