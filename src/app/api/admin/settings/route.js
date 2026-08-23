import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { clearHomeCache } from '@/lib/cache';
import { cleanAllBase64InObject } from '@/lib/supabaseStorage';

export const dynamic = 'force-dynamic';

const DEFAULT_SETTINGS = {
  id: 'default',
  logoText: 'TaniCo',
  tagline: 'Murni Organik',
  websiteName: 'TaniCo — Sayur Segar Organik',
  address: 'Jl. Raya Pemali No. 45, Kecamatan Pemali, Kabupaten Bangka, Provinsi Kepulauan Bangka Belitung 33251',
  googleMapsUrl: 'https://maps.google.com',
  whatsappNumber: '+628127300400',
  instagramUrl: 'https://instagram.com/tanico.bangka',
  facebookUrl: 'https://facebook.com/TaniCoBangka',
  emailAddress: 'halo@tanico.id',
  operationalHours: 'Setiap Hari: 07.00 - 17.00 WIB',
  footerText: '© 2026 TaniCo. Hak Cipta Dilindungi.',
  seoKeywords: 'sayur organik, sayur segar bangka, tanico, sayur sehat',
  homepageCMS: '{}',
  contactsCMS: '{}'
};

export async function GET(request) {
  try {
    return NextResponse.json(DEFAULT_SETTINGS);
  } catch (error) {
    logger.error('GET /api/admin/settings error:', error);
    return NextResponse.json(DEFAULT_SETTINGS, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const rawBody = await request.json();
    const body = await cleanAllBase64InObject(rawBody, 'hero');

    const ALLOWED_SETTING_FIELDS = [
      'logoText',
      'tagline',
      'websiteName',
      'address',
      'googleMapsUrl',
      'whatsappNumber',
      'instagramUrl',
      'facebookUrl',
      'emailAddress',
      'operationalHours',
      'footerText',
      'seoKeywords',
      'homepageCMS',
      'contactsCMS'
    ];

    const cleanSettingsData = {};
    for (const field of ALLOWED_SETTING_FIELDS) {
      if (body[field] !== undefined) {
        cleanSettingsData[field] = body[field];
      }
    }

    if (body.siteName && !cleanSettingsData.websiteName) {
      cleanSettingsData.websiteName = body.siteName;
    }

    const settings = {
      ...DEFAULT_SETTINGS,
      ...cleanSettingsData
    };

    // Sync partners list in homepageCMS into Partner database table if present
    try {
      let parsedCms = null;
      if (body.homepageCMS) {
        parsedCms = typeof body.homepageCMS === 'string' ? JSON.parse(body.homepageCMS) : body.homepageCMS;
      }
      const partnerList = parsedCms?.partners?.list || parsedCms?.partners?.logos;
      if (Array.isArray(partnerList) && partnerList.length > 0) {
        for (let i = 0; i < partnerList.length; i++) {
          const p = partnerList[i];
          if (p && p.name) {
            const pId = p.id || `partner_cms_${i}`;
            const pLogo = p.logo || p.image || '';
            const pDesc = p.description ?? p.desc ?? '';
            const pWeb = p.website ?? p.url ?? '';
            const pLoc = p.location || '';
            const pOrder = p.order || (i + 1);
            const pActive = p.active !== false;

            await prisma.partner.upsert({
              where: { id: pId },
              update: {
                name: p.name,
                logo: pLogo,
                location: pLoc,
                description: pDesc,
                website: pWeb,
                active: pActive,
                sortOrder: pOrder
              },
              create: {
                id: pId,
                name: p.name,
                logo: pLogo,
                location: pLoc,
                description: pDesc,
                website: pWeb,
                active: pActive,
                sortOrder: pOrder
              }
            }).catch(e => logger.warn('[SettingsSync] Partner upsert error:', e.message));
          }
        }
      }

      // Sync hero slides in homepageCMS into HeroBanner database table if present
      const heroSlides = parsedCms?.hero?.slides;
      if (Array.isArray(heroSlides)) {
        const slideIds = heroSlides.map(s => s.id).filter(id => id && typeof id === 'string' && !id.startsWith('hero-new-') && !id.startsWith('hero-cms-') && !id.startsWith('hero-1'));
        
        // Delete any HeroBanner records not in the current slides list
        const existingBanners = await prisma.heroBanner.findMany({ select: { id: true } });
        const existingIds = new Set(existingBanners.map(b => b.id));
        const validIdsInDb = slideIds.filter(id => existingIds.has(id));
        
        if (existingBanners.length > 0 && validIdsInDb.length >= 0) {
          await prisma.heroBanner.deleteMany({
            where: { id: { notIn: validIdsInDb } }
          }).catch(e => logger.warn('[SettingsSync] HeroBanner delete error:', e.message));
        }

        for (let i = 0; i < heroSlides.length; i++) {
          const s = heroSlides[i];
          if (s && (s.title || s.image || s.desktopImage)) {
            const sActive = s.active !== false;
            const sTitle = s.title || 'Slide Hero';
            const sImage = s.image || s.desktopImage || '';
            const sData = {
              title: sTitle,
              badge: s.badge || '',
              subtitle: s.subtitle || '',
              description: s.description || '',
              buttonText: s.buttonText || '',
              buttonLink: s.buttonLink || '',
              image: sImage,
              desktopImage: s.desktopImage || sImage,
              mobileImage: s.mobileImage || sImage,
              active: sActive,
              background: s.background || '#ECF6ED',
              overlay: Number(s.overlay) || 0,
              cropPosition: s.cropPosition || 'center center',
              cropZoom: String(s.cropZoom || '100'),
              desktopCrop: s.desktopCrop || s.cropPosition || 'center center',
              desktopZoom: String(s.desktopZoom || s.cropZoom || '100'),
              mobileCrop: s.mobileCrop || s.cropPosition || 'center center',
              mobileZoom: String(s.mobileZoom || s.cropZoom || '100'),
              sortOrder: s.sortOrder ?? s.order ?? (i + 1)
            };

            if (s.id && existingIds.has(s.id)) {
              await prisma.heroBanner.update({
                where: { id: s.id },
                data: sData
              }).catch(e => logger.warn('[SettingsSync] HeroBanner update error:', e.message));
            } else {
              await prisma.heroBanner.create({
                data: sData
              }).catch(e => logger.warn('[SettingsSync] HeroBanner create error:', e.message));
            }
          }
        }
      }
    } catch (syncErr) {
      logger.warn('[SettingsSync] Failed to sync to database tables:', syncErr.message);
    }

    clearHomeCache();

    return NextResponse.json(settings);
  } catch (error) {
    logger.error('POST /api/admin/settings error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan pengaturan' }, { status: 500 });
  }
}

export async function PUT(request) {
  return POST(request);
}
