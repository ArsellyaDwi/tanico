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

export async function GET(request) {
  try {
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const where = {};
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        farmerLocation: true
      }
    });

    const formattedProducts = (products || []).map(p => {
      const catObj = typeof p.category === 'object' && p.category !== null ? p.category : null;
      const catName = p.categoryName || catObj?.name || (typeof p.category === 'string' ? p.category : 'Hasil Panen');
      return {
        ...p,
        categoryName: catName,
        category: catName,
        categoryObj: catObj
      };
    });

    return NextResponse.json(formattedProducts);
  } catch (error) {
    logger.error('GET /api/admin/products error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data produk' }, { status: 500 });
  }
}

function sanitizeProductData(data) {
  const allowed = [
    'id',
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

export async function POST(request) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    }

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
        const customFilename = `product_${Date.now()}_${(file.name || 'product.jpg').replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase()}`;
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

    const { name, price, image } = body;

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: 'Nama dan harga produk wajib diisi' },
        { status: 400 }
      );
    }

    const cleanImage = await ensureSupabaseImageUrl(image, `${name || 'product'}.jpg`, 'products');

    const sanitized = sanitizeProductData({
      ...body,
      image: cleanImage || '/placeholder-vegetable.jpg'
    });

    if (!sanitized.categoryId && sanitized.categoryName) {
      const catMatch = await prisma.category.findFirst({ where: { name: sanitized.categoryName } });
      if (catMatch) sanitized.categoryId = catMatch.id;
    }

    const newProduct = await prisma.product.create({
      data: sanitized,
      include: {
        category: true
      }
    });

    const catName = newProduct.categoryName || newProduct.category?.name || 'Hasil Panen';
    const formatted = {
      ...newProduct,
      categoryName: catName,
      category: catName,
      categoryObj: newProduct.category
    };

    clearHomeCache();
    return NextResponse.json(formatted, { status: 201 });
  } catch (error) {
    logger.error('POST /api/admin/products error:', error);
    return NextResponse.json(
      { error: 'Gagal membuat produk' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    }

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
        const customFilename = `product_${Date.now()}_${(file.name || 'product.jpg').replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase()}`;
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

    if (Array.isArray(body)) {
      // Bulk update using single transaction batch
      const validItems = body.filter(item => item && item.id);
      const operations = validItems.map(item => {
        const sanitizedItem = sanitizeProductData(item);
        return prisma.product.update({
          where: { id: item.id },
          data: sanitizedItem
        });
      });
      const updated = operations.length > 0 ? await prisma.$transaction(operations) : [];
      clearHomeCache();
      return NextResponse.json(updated);
    }

    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: 'ID produk diperlukan' }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({
      where: { id }
    });

    let cleanImage = data.image;
    if (cleanImage) {
      cleanImage = await ensureSupabaseImageUrl(cleanImage, `product_${id}.jpg`, 'products');
    }

    const sanitizedData = sanitizeProductData({ ...data, image: cleanImage });

    if (!sanitizedData.categoryId && sanitizedData.categoryName) {
      const catMatch = await prisma.category.findFirst({ where: { name: sanitizedData.categoryName } });
      if (catMatch) sanitizedData.categoryId = catMatch.id;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: sanitizedData,
      include: { category: true }
    });

    if (existing?.image && sanitizedData.image && existing.image !== sanitizedData.image) {
      await cleanupOldImageIfReplaced(existing.image, sanitizedData.image, { model: 'Product', id });
    }

    const catName = updatedProduct.categoryName || updatedProduct.category?.name || 'Hasil Panen';
    const formatted = {
      ...updatedProduct,
      categoryName: catName,
      category: catName,
      categoryObj: updatedProduct.category
    };

    clearHomeCache();
    return NextResponse.json(formatted);
  } catch (error) {
    logger.error('PUT /api/admin/products error:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui produk' },
      { status: 500 }
    );
  }
}
