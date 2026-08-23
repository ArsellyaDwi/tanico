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
    const cacheKey = `products_${searchParams.toString()}`;
    const cached = getCacheItem(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
        }
      });
    }

    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status');
    const isFeatured = searchParams.get('isFeatured');
    const isPopular = searchParams.get('isPopular');
    const search = searchParams.get('search');
    const limitParam = searchParams.get('limit');
    const pageParam = searchParams.get('page');
    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');
    const onlyInStockParam = searchParams.get('onlyInStock');
    const sortBy = searchParams.get('sortBy');

    const where = {};
    if (status) {
      where.status = status;
    } else {
      where.status = { notIn: ['Nonaktif', 'nonaktif'] };
    }

    if (categoryId && categoryId !== 'Semua') {
      where.categoryId = categoryId;
    }
    if (isFeatured === 'true') {
      where.isFeatured = true;
    }
    if (isPopular === 'true') {
      where.isPopular = true;
    }
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } }
      ];
    }
    if (minPriceParam || maxPriceParam) {
      where.price = {};
      if (minPriceParam && !isNaN(parseFloat(minPriceParam))) {
        where.price.gte = parseFloat(minPriceParam);
      }
      if (maxPriceParam && !isNaN(parseFloat(maxPriceParam))) {
        where.price.lte = parseFloat(maxPriceParam);
      }
    }
    if (onlyInStockParam === 'true') {
      where.stock = { gt: 0 };
    }

    let orderBy = { createdAt: 'desc' };
    if (sortBy === 'price-low') {
      orderBy = { price: 'asc' };
    } else if (sortBy === 'price-high') {
      orderBy = { price: 'desc' };
    } else if (sortBy === 'populer') {
      orderBy = [{ rating: 'desc' }, { soldCount: 'desc' }];
    }

    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
    const skip = limit && pageParam ? (page - 1) * limit : undefined;

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, slug: true, image: true, status: true }
        }
      },
      orderBy,
      take: limit,
      skip
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

    setCacheItem(cacheKey, formattedProducts, 30 * 1000);

    return NextResponse.json(formattedProducts, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    logger.error('GET /api/products error:', error);
    return NextResponse.json({ error: 'Gagal memuat produk dari database' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database tidak tersedia.' }, { status: 500 });
    }

    const body = await request.json();
    const {
      id,
      name,
      categoryId,
      categoryName,
      price,
      discountPrice,
      unit,
      image,
      stock,
      rating,
      description,
      origin,
      certification,
      weight,
      benefits,
      isFeatured,
      isNew,
      isPopular,
      status
    } = body;

    if (!name || !price) {
      return NextResponse.json({ error: 'Nama dan harga produk wajib diisi' }, { status: 400 });
    }

    const cleanImage = image ? await ensureSupabaseImageUrl(image, `product_${Date.now()}.jpg`, 'products') : '';

    const newProduct = await prisma.product.create({
      data: {
        id: id || undefined,
        name,
        categoryId: categoryId || null,
        categoryName: categoryName || '',
        price: Number(price) || 0,
        discountPrice: discountPrice !== null && discountPrice !== undefined && discountPrice !== ''
          ? Number(discountPrice)
          : null,
        unit: unit || 'kg',
        image: cleanImage || image || '',
        stock: Number(stock) || 0,
        rating: Number(rating) || 5.0,
        description: description || '',
        origin: origin || '',
        certification: certification || '',
        weight: Number(weight) || 0,
        benefits: benefits || '',
        isFeatured: Boolean(isFeatured),
        isNew: Boolean(isNew),
        isPopular: Boolean(isPopular),
        status: status || 'Aktif'
      }
    });

    clearHomeCache();
    return NextResponse.json(newProduct);
  } catch (error) {
    logger.error('POST /api/products error:', error);
    return NextResponse.json({ error: 'Gagal membuat produk' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database tidak tersedia.' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    const body = await request.json();

    if (Array.isArray(body)) {
      // Bulk update/upsert
      const operations = await Promise.all(body.map(async (p, idx) => {
        const cleanImg = p.image ? await ensureSupabaseImageUrl(p.image, `product_${p.id || idx}.jpg`, 'products') : (p.image || '');
        const payload = {
          name: p.name,
          categoryId: p.categoryId || null,
          categoryName: p.categoryName || '',
          price: Number(p.price) || 0,
          discountPrice: p.discountPrice !== null && p.discountPrice !== undefined && p.discountPrice !== ''
            ? Number(p.discountPrice)
            : null,
          unit: p.unit || 'kg',
          image: cleanImg,
          stock: Number(p.stock) || 0,
          rating: Number(p.rating) || 5.0,
          description: p.description || '',
          origin: p.origin || '',
          certification: p.certification || '',
          weight: Number(p.weight) || 0,
          benefits: p.benefits || '',
          isFeatured: Boolean(p.isFeatured),
          isNew: Boolean(p.isNew),
          isPopular: Boolean(p.isPopular),
          status: p.status || 'Aktif'
        };

        return prisma.product.upsert({
          where: { id: p.id },
          create: { id: p.id, ...payload },
          update: payload
        });
      }));

      await prisma.$transaction(operations);
      clearHomeCache();
      return NextResponse.json({ success: true, count: body.length });
    }

    if (!id) id = body.id;
    if (!id) {
      return NextResponse.json({ error: 'ID produk wajib diisi' }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({
      where: { id }
    });

    let cleanImage = body.image;
    if (cleanImage) {
      cleanImage = await ensureSupabaseImageUrl(cleanImage, `product_${id}.jpg`, 'products');
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        categoryId: body.categoryId || null,
        categoryName: body.categoryName,
        price: body.price !== undefined ? Number(body.price) : undefined,
        discountPrice: body.discountPrice !== undefined ? (body.discountPrice ? Number(body.discountPrice) : null) : undefined,
        unit: body.unit,
        image: cleanImage !== undefined ? cleanImage : undefined,
        stock: body.stock !== undefined ? Number(body.stock) : undefined,
        rating: body.rating !== undefined ? Number(body.rating) : undefined,
        description: body.description,
        origin: body.origin,
        certification: body.certification,
        weight: body.weight !== undefined ? Number(body.weight) : undefined,
        benefits: body.benefits,
        isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : undefined,
        isNew: body.isNew !== undefined ? Boolean(body.isNew) : undefined,
        isPopular: body.isPopular !== undefined ? Boolean(body.isPopular) : undefined,
        status: body.status
      }
    });

    if (existing?.image && cleanImage && existing.image !== cleanImage) {
      await cleanupOldImageIfReplaced(existing.image, cleanImage, { model: 'Product', id });
    }

    clearHomeCache();
    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/products error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui produk' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
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
      return NextResponse.json({ error: 'ID produk wajib diisi' }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({
      where: { id }
    });

    await prisma.product.delete({ where: { id } });

    if (existing?.image) {
      await cleanupDeletedEntityImages([existing.image], { model: 'Product', id });
    }

    clearHomeCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('DELETE /api/products error:', error);
    return NextResponse.json({ error: 'Gagal menghapus produk' }, { status: 500 });
  }
}
