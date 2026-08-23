import { prisma } from '@/lib/prisma.js';
import { getHomepageCms } from '@/utils/cmsDefaults.js';
import { logger } from '@/utils/logger.js';
import { getHomeCache, setHomeCache } from '@/lib/cache.js';

export async function getHomeData() {
  const cached = getHomeCache();
  if (cached) {
    return cached;
  }

  if (!prisma) {
    return {
      settings: {},
      categories: [],
      featuredProducts: [],
      latestArticles: [],
      gallery: [],
      partners: [],
      testimonials: [],
      homepageCMS: getHomepageCms({})
    };
  }

  try {
    const [
      categories,
      featuredProducts,
      articles,
      gallery,
      partners,
      testimonials,
      heroBanners,
      heroBenefits
    ] = await Promise.all([
      // 1. Fetch categories with product counts
      prisma.category.findMany({
        where: { status: { notIn: ['Nonaktif', 'nonaktif'] } },
        orderBy: { sortOrder: 'asc' },
        take: 50,
        include: {
          _count: { select: { products: true } }
        }
      }).catch(() => []),

      // 2. Fetch products (top active products)
      prisma.product.findMany({
        where: { status: { notIn: ['Nonaktif', 'nonaktif'] } },
        take: 50,
        orderBy: [
          { soldCount: 'desc' },
          { createdAt: 'desc' }
        ]
      }).catch(() => []),

      // 3. Fetch latest published articles
      prisma.article.findMany({
        where: {
          status: {
            notIn: ['Draft', 'Nonaktif', 'draft', 'nonaktif']
          }
        },
        take: 12,
        orderBy: { createdAt: 'desc' }
      }).catch(() => []),

      // 4. Fetch active gallery items
      prisma.gallery.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
        take: 50
      }).catch(() => []),

      // 5. Fetch active partners
      prisma.partner.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
        take: 50
      }).catch(() => []),

      // 6. Fetch active testimonials
      prisma.testimonial.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
        take: 50
      }).catch(() => []),

      // 7. Fetch active hero banners from database table
      prisma.heroBanner.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' }
      }).catch(() => []),

      // 8. Fetch active hero benefit cards from database table
      prisma.heroBenefit.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
      }).catch(() => [])
    ]);

    // Format categories with itemCount
    const formattedCategories = (categories || []).map(cat => ({
      ...cat,
      itemCount: cat._count?.products ?? cat.itemCount ?? 0
    }));

    // Format products with primary image
    const formattedProducts = (featuredProducts || []).map(p => ({
      ...p,
      image: p.image || ''
    }));

    // Parse fresh homepageCMS JSON from defaults
    const parsedCms = getHomepageCms('');

    // Map HeroBanner table records
    const heroBannerSlides = (heroBanners || []).map(hb => ({
      id: hb.id,
      badge: hb.badge || '',
      title: hb.title,
      subtitle: hb.subtitle || '',
      description: hb.description || '',
      buttonText: hb.buttonText || '',
      buttonLink: hb.buttonLink || '',
      image: hb.image || '',
      desktopImage: hb.desktopImage || hb.image || '',
      mobileImage: hb.mobileImage || hb.image || '',
      active: hb.active ?? true,
      background: hb.background || '#ECF6ED',
      overlay: hb.overlay || 0,
      cropPosition: hb.cropPosition || 'center center',
      cropZoom: hb.cropZoom || '100',
      desktopCrop: hb.desktopCrop || hb.cropPosition || 'center center',
      desktopZoom: hb.desktopZoom || hb.cropZoom || '100',
      mobileCrop: hb.mobileCrop || hb.cropPosition || 'center center',
      mobileZoom: hb.mobileZoom || hb.cropZoom || '100',
      sortOrder: hb.sortOrder || 0
    }));

    // Synchronize hero section
    if (heroBannerSlides.length > 0) {
      parsedCms.hero = {
        ...(parsedCms.hero || {}),
        slides: heroBannerSlides
      };
    } else if (!parsedCms.hero?.slides || parsedCms.hero.slides.length === 0) {
      parsedCms.hero = {
        ...(parsedCms.hero || {}),
        slides: []
      };
    }

    // Synchronize partners section
    const effectivePartners = (partners && partners.length > 0) 
      ? partners 
      : (parsedCms.partners?.list || parsedCms.partners?.logos || []);

    if (effectivePartners.length > 0) {
      parsedCms.partners = {
        ...(parsedCms.partners || {}),
        list: effectivePartners,
        logos: effectivePartners
      };
    }

    // Synchronize testimonials section
    const effectiveTestimonials = (testimonials && testimonials.length > 0)
      ? testimonials
      : (parsedCms.testimonials?.list || []);

    if (effectiveTestimonials.length > 0) {
      parsedCms.testimonials = {
        ...(parsedCms.testimonials || {}),
        list: effectiveTestimonials
      };
    }

    // Synchronize gallery section
    const effectiveGallery = (gallery && gallery.length > 0)
      ? gallery
      : (parsedCms.gallery?.items || []);

    if (effectiveGallery.length > 0) {
      parsedCms.gallery = {
        ...(parsedCms.gallery || {}),
        items: effectiveGallery
      };
    }

    // Map HeroBenefit table records safely for serialization
    const effectiveHeroBenefits = (heroBenefits || []).map(hb => {
      const title = hb.title || hb.value || '';
      const description = hb.description || hb.label || '';
      return {
        id: hb.id,
        title,
        description,
        value: title,
        label: description,
        image: hb.image || '',
        sortOrder: typeof hb.sortOrder === 'number' ? hb.sortOrder : 0,
        active: hb.active ?? true,
        createdAt: hb.createdAt ? (typeof hb.createdAt === 'string' ? hb.createdAt : hb.createdAt.toISOString()) : null,
        updatedAt: hb.updatedAt ? (typeof hb.updatedAt === 'string' ? hb.updatedAt : hb.updatedAt.toISOString()) : null
      };
    });

    parsedCms.hero = {
      ...(parsedCms.hero || {}),
      slides: heroBannerSlides,
      benefits: effectiveHeroBenefits
    };

    const result = {
      settings: {
        homepageCMS: parsedCms
      },
      categories: formattedCategories,
      featuredProducts: formattedProducts,
      products: formattedProducts,
      latestArticles: articles || [],
      articles: articles || [],
      gallery: effectiveGallery,
      partners: effectivePartners,
      testimonials: effectiveTestimonials,
      heroBanners: heroBannerSlides.length > 0 ? heroBannerSlides : (parsedCms.hero?.slides || []),
      heroBenefits: effectiveHeroBenefits,
      homepageCMS: parsedCms
    };

    setHomeCache(result, 60 * 1000);
    return result;
  } catch (error) {
    logger.error('[HomeLib] Error fetching home data:', error);
    return {
      settings: {},
      categories: [],
      featuredProducts: [],
      products: [],
      latestArticles: [],
      articles: [],
      gallery: [],
      partners: [],
      testimonials: [],
      heroBanners: [],
      heroBenefits: [],
      homepageCMS: getHomepageCms({})
    };
  }
}

export async function getAboutData() {
  const homeData = await getHomeData();
  return {
    benefits: homeData.heroBenefits || [],
    partners: homeData.partners || [],
    settings: homeData.settings || null
  };
}

export async function getFarmerStoriesData() {
  const homeData = await getHomeData();
  const articles = homeData.articles || [];
  const mitraArticles = articles.filter(a => 
    a.showOnKisahMitra === true || 
    (a.category && (a.category.toLowerCase().includes('mitra') || a.category.toLowerCase().includes('petani')))
  );
  return {
    farmers: mitraArticles.length > 0 ? mitraArticles : articles.slice(0, 4),
    gallery: homeData.gallery || []
  };
}

