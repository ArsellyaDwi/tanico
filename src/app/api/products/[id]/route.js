import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { clearHomeCache, getCacheItem, setCacheItem } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const cacheKey = `product_detail_${id}`;
    const cached = getCacheItem(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
        }
      });
    }

    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    const includeRelations = {
      images: {
        select: { id: true, url: true, sortOrder: true },
        orderBy: { sortOrder: 'asc' }
      },
      category: {
        select: { id: true, name: true, slug: true, image: true, status: true }
      },
      farmerLocation: true,
      labels: true
    };

    let product = await prisma.product.findUnique({
      where: { id },
      include: includeRelations
    }).catch(() => null);

    if (!product) {
      const formattedName = String(id).replace(/-/g, ' ');
      product = await prisma.product.findFirst({
        where: {
          OR: [
            { name: { equals: formattedName, mode: 'insensitive' } },
            { name: { contains: formattedName, mode: 'insensitive' } }
          ],
          status: { notIn: ['Nonaktif', 'nonaktif'] }
        },
        include: includeRelations
      }).catch(() => null);
    }

    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    const catObj = typeof product.category === 'object' && product.category !== null ? product.category : null;
    const catName = product.categoryName || catObj?.name || (typeof product.category === 'string' ? product.category : 'Hasil Panen');

    const formattedProduct = {
      ...product,
      categoryName: catName,
      category: catName,
      categoryObj: catObj
    };

    setCacheItem(cacheKey, formattedProduct, 30 * 1000);

    return NextResponse.json(formattedProduct, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    logger.error(`GET /api/products/[id] error:`, error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    const updated = await prisma.product.update({
      where: { id },
      data: body
    });

    clearHomeCache();
    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/products/[id] error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui produk' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    await prisma.product.delete({ where: { id } });
    clearHomeCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('DELETE /api/products/[id] error:', error);
    return NextResponse.json({ error: 'Gagal menghapus produk' }, { status: 500 });
  }
}
