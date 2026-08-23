import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { getCacheItem, setCacheItem } from '@/lib/cache';

export async function getWebsiteSettings() {
  return {
    id: "default",
    logoText: "TaniCo",
    tagline: "Murni Organik",
    websiteName: "TaniCo — Sayur Segar Organik",
    address: "Jl. Raya Pemali No. 45, Kecamatan Pemali, Kabupaten Bangka, Provinsi Kepulauan Bangka Belitung 33251",
    googleMapsUrl: "https://maps.google.com",
    whatsappNumber: "+628127300400",
    instagramUrl: "https://instagram.com/tanico.bangka",
    facebookUrl: "https://facebook.com/TaniCoBangka",
    emailAddress: "halo@tanico.id",
    operationalHours: "Setiap Hari: 07.00 - 17.00 WIB",
    footerText: "© 2026 TaniCo. Hak Cipta Dilindungi.",
    seoKeywords: "sayur organik, sayur segar bangka, tanico, sayur sehat",
    homepageCMS: "{}",
    contactsCMS: "{}"
  };
}

export async function getWebsiteData() {

  if (!prisma) {
    return {
      settings: { id: "default", homepageCMS: "{}" },
      adminProfile: { id: "default", name: "Admin TaniCo", email: "admin@tanico.id", role: "Super Admin", avatar: "" },
      categories: [],
      products: [],
      orders: [],
      reviews: [],
      activityLogs: [],
      stockHistory: [],
      gallery: [],
      partners: [],
      testimonials: [],
      contactMessages: [],
      articles: [],
      totalUsers: 0
    };
  }

  try {
    const [
      adminProfileObj,
      categoriesList,
      productsList,
      ordersList,
      reviewsList,
      activityLogsList,
      stockHistoryList,
      galleryList,
      partnersList,
      testimonialsList,
      contactMessagesList,
      articlesList,
      totalUsersCount
    ] = await Promise.all([
      prisma.adminProfile.findUnique({ where: { id: "default" } }).catch(() => null),
      prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }).catch(() => []),
      prisma.product.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []),
      prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' }, take: 200 }).catch(() => []),
      prisma.review.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }).catch(() => []),
      prisma.activityLog.findMany({ orderBy: { timestamp: 'desc' }, take: 100 }).catch(() => []),
      prisma.stockHistory.findMany({ orderBy: { timestamp: 'desc' }, take: 100 }).catch(() => []),
      prisma.gallery.findMany().catch(() => []),
      prisma.partner.findMany({ orderBy: { sortOrder: 'asc' } }).catch(() => []),
      prisma.testimonial.findMany().catch(() => []),
      prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }).catch(() => []),
      prisma.article.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []),
      prisma.user.count().catch(() => 0)
    ]);

    const formattedProducts = (productsList || []).map(p => ({
      ...p,
      image: p.image || ''
    }));

    const settings = {
      id: "default",
      logoText: "TaniCo",
      tagline: "Murni Organik",
      websiteName: "TaniCo — Sayur Segar Organik",
      address: "Jl. Raya Pemali No. 45, Kecamatan Pemali, Kabupaten Bangka, Provinsi Kepulauan Bangka Belitung 33251",
      googleMapsUrl: "https://maps.google.com",
      whatsappNumber: "+628127300400",
      instagramUrl: "https://instagram.com/tanico.bangka",
      facebookUrl: "https://facebook.com/TaniCoBangka",
      emailAddress: "halo@tanico.id",
      operationalHours: "Setiap Hari: 07.00 - 17.00 WIB",
      footerText: "© 2026 TaniCo. Hak Cipta Dilindungi.",
      seoKeywords: "sayur organik, sayur segar bangka, tanico, sayur sehat",
      homepageCMS: "{}",
      contactsCMS: "{}"
    };

    return {
      settings,
      adminProfile: adminProfileObj || { id: "default", name: "Admin TaniCo", email: "admin@tanico.id", role: "Super Admin", avatar: "" },
      categories: categoriesList || [],
      products: formattedProducts,
      orders: ordersList || [],
      reviews: reviewsList || [],
      activityLogs: activityLogsList || [],
      stockHistory: stockHistoryList || [],
      gallery: galleryList || [],
      partners: partnersList || [],
      testimonials: testimonialsList || [],
      contactMessages: contactMessagesList || [],
      articles: articlesList || [],
      totalUsers: totalUsersCount || 0
    };
  } catch (error) {
    logger.error("[SettingsLib] Error fetching initial website data:", error);
    return {
      settings: { id: "default", homepageCMS: "{}" },
      adminProfile: { id: "default", name: "Admin TaniCo", email: "admin@tanico.id", role: "Super Admin", avatar: "" },
      categories: [],
      products: [],
      orders: [],
      reviews: [],
      activityLogs: [],
      stockHistory: [],
      gallery: [],
      partners: [],
      testimonials: [],
      contactMessages: [],
      articles: [],
      totalUsers: 0
    };
  }
}
