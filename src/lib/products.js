import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { getCacheItem, setCacheItem } from '@/lib/cache';

export async function getProductByIdOrSlug(idOrSlug) {
  if (!idOrSlug) return null;
  const cacheKey = `product_detail_${idOrSlug}`;
  const cached = getCacheItem(cacheKey);
  if (cached) return cached;

  if (!prisma) return null;

  try {
    const includeRelations = {
      category: {
        select: { id: true, name: true, slug: true, image: true, status: true }
      },
      farmerLocation: true
    };

    let product = await prisma.product.findUnique({
      where: { id: idOrSlug },
      include: includeRelations
    }).catch(() => null);

    if (!product) {
      const formattedName = String(idOrSlug).replace(/-/g, ' ');
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

    if (!product) return null;

    const catObj = typeof product.category === 'object' && product.category !== null ? product.category : null;
    const catName = product.categoryName || catObj?.name || (typeof product.category === 'string' ? product.category : 'Hasil Panen');

    const formattedProduct = {
      ...product,
      categoryName: catName,
      category: catName,
      categoryObj: catObj
    };

    setCacheItem(cacheKey, formattedProduct, 60 * 1000);
    return formattedProduct;
  } catch (error) {
    logger.error('getProductByIdOrSlug error:', error);
    return null;
  }
}

export async function getActiveProducts(limit = 24) {
  const cacheKey = `active_products_limit_${limit}`;
  const cached = getCacheItem(cacheKey);
  if (cached) return cached;

  if (!prisma) return [];

  try {
    const products = await prisma.product.findMany({
      where: {
        status: { notIn: ['Nonaktif', 'nonaktif'] }
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true, image: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
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
    return formattedProducts;
  } catch (error) {
    logger.error('getActiveProducts error:', error);
    return [];
  }
}
