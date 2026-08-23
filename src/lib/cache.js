// In-memory cache for ultra-fast sub-millisecond responses
const memoryCache = new Map();

export const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds default TTL

export function getCacheItem(key) {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return item.data;
}

export function setCacheItem(key, data, ttlMs = DEFAULT_TTL_MS) {
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs
  });
}

export function deleteCacheItem(key) {
  memoryCache.delete(key);
}

export function getHomeCache() {
  return getCacheItem('home_data');
}

export function getStaleHomeCache() {
  const item = memoryCache.get('home_data');
  return item ? item.data : null;
}

export function setHomeCache(data, ttlMs = DEFAULT_TTL_MS) {
  setCacheItem('home_data', data, ttlMs);
}

export function clearHomeCache() {
  memoryCache.clear();
  try {
    import('next/cache').then(({ revalidatePath, revalidateTag }) => {
      if (typeof revalidatePath === 'function') {
        revalidatePath('/', 'page');
        revalidatePath('/(public)', 'page');
        revalidatePath('/(public)/page', 'page');
        revalidatePath('/products', 'page');
        revalidatePath('/categories', 'page');
        revalidatePath('/articles', 'page');
        revalidatePath('/gallery', 'page');
        revalidatePath('/about', 'page');
        revalidatePath('/contact', 'page');
        revalidatePath('/farmer-stories', 'page');
      }
      if (typeof revalidateTag === 'function') {
        revalidateTag('home');
        revalidateTag('settings');
        revalidateTag('products');
        revalidateTag('categories');
        revalidateTag('articles');
        revalidateTag('gallery');
        revalidateTag('partners');
        revalidateTag('testimonials');
        revalidateTag('hero-banners');
      }
    }).catch(() => {});
  } catch {
    // Graceful fallback when called outside request context
  }
}



