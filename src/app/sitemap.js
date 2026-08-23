import { getWebsiteData } from '@/lib/dbActions';

export default async function sitemap() {
  const baseUrl = process.env.APP_URL || 'https://tanico.id';

  const staticRoutes = [
    '',
    '/produk',
    '/kategori',
    '/artikel',
    '/tentang-kami',
    '/hubungi-kami',
    '/kisah-mitra-tani',
    '/faq',
    '/knowledge-base'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === '' || route === '/produk' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8
  }));

  try {
    const data = await getWebsiteData();
    const products = data.products || [];
    const articles = data.articles || [];

    const productRoutes = products.map((p) => ({
      url: `${baseUrl}/produk/${p.id}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.7
    }));

    const articleRoutes = articles.map((a) => ({
      url: `${baseUrl}/artikel/${a.slug || a.id}`,
      lastModified: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
      changeFrequency: 'monthly',
      priority: 0.6
    }));

    return [...staticRoutes, ...productRoutes, ...articleRoutes];
  } catch (e) {
    return staticRoutes;
  }
}
