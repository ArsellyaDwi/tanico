import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { 
  ensureSupabaseImageUrl, 
  uploadBufferToSupabase, 
  cleanupOldImageIfReplaced, 
  cleanupDeletedEntityImages 
} from '@/lib/supabaseStorage';
import { clearHomeCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        reviews: true,
        farmerLocation: true
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    logger.error('GET /api/admin/products/[id] error:', error);
    return NextResponse.json({ error: 'Gagal mengambil detail produk' }, { status: 500 });
  }
}

function sanitizeProductData(data) {
  const allowed = [
    'name',
    'categoryId',
    'categoryName',
    'price',
    'discountPrice',
    'unit',
    'image',
    'stock',
    'rating',
    'description',
    'origin',
    'certification',
    'weight',
    'benefits',
    'isFeatured',
    'isNew',
    'isPopular',
    'status',
    'farmerLocationId',
    'soldCount'
  ];

  const sanitized = {};
  for (const field of allowed) {
    if (data[field] !== undefined && data[field] !== null) {
      sanitized[field] = data[field];
    }
  }

  if (sanitized.price !== undefined) {
    const p = parseFloat(sanitized.price);
    sanitized.price = Number.isNaN(p) ? 0 : p;
  }

  if (sanitized.discountPrice !== undefined) {
    if (sanitized.discountPrice === '' || sanitized.discountPrice === null) {
      sanitized.discountPrice = null;
    } else {
      const dp = parseFloat(sanitized.discountPrice);
      sanitized.discountPrice = Number.isNaN(dp) ? null : dp;
    }
  }

  if (sanitized.stock !== undefined) {
    const st = parseInt(sanitized.stock, 10);
    sanitized.stock = Number.isNaN(st) ? 0 : st;
  }

  if (sanitized.weight !== undefined) {
    const w = parseInt(sanitized.weight, 10);
    sanitized.weight = Number.isNaN(w) ? 0 : w;
  }

  if (sanitized.rating !== undefined) {
    const r = parseFloat(sanitized.rating);
    sanitized.rating = Number.isNaN(r) ? 5.0 : r;
  }

  if (sanitized.soldCount !== undefined) {
    const sc = parseInt(sanitized.soldCount, 10);
    sanitized.soldCount = Number.isNaN(sc) ? 0 : sc;
  }

  if (sanitized.isFeatured !== undefined) {
    sanitized.isFeatured = Boolean(sanitized.isFeatured);
  }

  if (sanitized.isNew !== undefined) {
    sanitized.isNew = Boolean(sanitized.isNew);
  }

  if (sanitized.isPopular !== undefined) {
    sanitized.isPopular = Boolean(sanitized.isPopular);
  }

  if (!sanitized.categoryName && data.category && typeof data.category === 'string') {
    sanitized.categoryName = data.category;
  }

  return sanitized;
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    const contentType = request.headers.get('content-type') || '';
    let body = {};
    let uploadedImageUrl = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') || formData.get('imageFile') || formData.get('image');

      if (file && typeof file === 'object' && typeof file.arrayBuffer === 'function') {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = file.type || 'image/jpeg';
        const customFilename = `product_${id}_${Date.now()}_${(file.name || 'product.jpg').replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase()}`;
        const res = await uploadBufferToSupabase(buffer, mimeType, customFilename, 'products');
        if (res.success && (res.url || res.publicUrl)) {
          uploadedImageUrl = res.url || res.publicUrl;
        }
      }

      for (const [key, value] of formData.entries()) {
        if (key !== 'file' && key !== 'imageFile') {
          if (key === 'image' && uploadedImageUrl) {
            body.image = uploadedImageUrl;
          } else {
            try {
              body[key] = JSON.parse(value);
            } catch {
              body[key] = value;
            }
          }
        }
      }
      if (uploadedImageUrl && !body.image) {
        body.image = uploadedImageUrl;
      }
    } else {
      body = await request.json();
    }

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { image: true }
    });

    let cleanImage = body.image;
    if (cleanImage) {
      cleanImage = await ensureSupabaseImageUrl(cleanImage, `product_${id}.jpg`, 'products');
    }

    const sanitizedData = sanitizeProductData({ ...body, image: cleanImage });

    if (!sanitizedData.categoryId && sanitizedData.categoryName) {
      const catMatch = await prisma.category.findFirst({ where: { name: sanitizedData.categoryName } });
      if (catMatch) sanitizedData.categoryId = catMatch.id;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: sanitizedData,
      include: { category: true }
    });

    if (existing?.image && sanitizedData.image && existing.image !== sanitizedData.image) {
      cleanupOldImageIfReplaced(existing.image, sanitizedData.image, { model: 'Product', id });
    }

    const catName = updated.categoryName || updated.category?.name || 'Hasil Panen';
    const formatted = {
      ...updated,
      categoryName: catName,
      category: catName,
      categoryObj: updated.category
    };

    clearHomeCache();
    return NextResponse.json(formatted);
  } catch (error) {
    logger.error('PUT /api/admin/products/[id] error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui produk' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { image: true }
    });

    await prisma.product.delete({
      where: { id }
    });

    if (existing?.image) {
      cleanupDeletedEntityImages([existing.image], { model: 'Product', id });
    }

    clearHomeCache();
    return NextResponse.json({ success: true, id });
  } catch (error) {
    logger.error('DELETE /api/admin/products/[id] error:', error);
    return NextResponse.json({ error: 'Gagal menghapus produk' }, { status: 500 });
  }
}
