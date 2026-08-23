import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { getCacheItem, setCacheItem } from '@/lib/cache';

export async function getActiveCategories() {
  const cacheKey = 'active_categories_list';
  const cached = getCacheItem(cacheKey);
  if (cached) return cached;

  if (!prisma) return [];

  try {
    const categories = await prisma.category.findMany({
      where: {
        status: { notIn: ['Nonaktif', 'nonaktif'] }
      },
      orderBy: { sortOrder: 'asc' },
      take: 100,
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    const result = categories || [];
    setCacheItem(cacheKey, result, 60 * 1000);
    return result;
  } catch (error) {
    logger.error('getActiveCategories error:', error);
    return [];
  }
}

