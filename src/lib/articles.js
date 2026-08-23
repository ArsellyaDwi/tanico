import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { getCacheItem, setCacheItem } from '@/lib/cache';

export async function getPublishedArticles(limit = 24) {
  const cacheKey = `published_articles_limit_${limit}`;
  const cached = getCacheItem(cacheKey);
  if (cached) return cached;

  if (!prisma) return [];

  try {
    const articles = await prisma.article.findMany({
      where: {
        status: {
          notIn: ['Draft', 'Nonaktif', 'draft', 'nonaktif']
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    const result = articles || [];
    setCacheItem(cacheKey, result, 60 * 1000);
    return result;
  } catch (error) {
    logger.error('getPublishedArticles error:', error);
    return [];
  }
}

export async function getArticleBySlug(slug) {
  if (!slug) return null;
  const decodedSlug = decodeURIComponent(slug).trim().toLowerCase();
  const cacheKey = `article_slug_${decodedSlug}`;
  const cached = getCacheItem(cacheKey);
  if (cached) return cached;

  if (!prisma) return null;

  try {
    let article = await prisma.article.findUnique({
      where: { slug: decodedSlug }
    }).catch(() => null);

    if (!article) {
      article = await prisma.article.findFirst({
        where: {
          OR: [
            { slug: { equals: decodedSlug, mode: 'insensitive' } },
            { id: decodedSlug }
          ]
        }
      }).catch(() => null);
    }

    if (!article) {
      const all = await prisma.article.findMany({
        where: { status: { notIn: ['Draft', 'Nonaktif', 'draft', 'nonaktif'] } },
        take: 50
      }).catch(() => []);
      const slugify = (t) => (t || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      article = all.find(a => a.id === decodedSlug || a.slug === decodedSlug || slugify(a.title) === decodedSlug) || null;
    }

    if (article) {
      setCacheItem(cacheKey, article, 60 * 1000);
    }
    return article;
  } catch (error) {
    logger.error('getArticleBySlug error:', error);
    return null;
  }
}

