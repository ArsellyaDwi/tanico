import { NextResponse } from 'next/server';
import { logger } from '@/utils/logger';
import { clearHomeCache, getCacheItem, setCacheItem } from '@/lib/cache';

export const dynamic = 'force-dynamic';

const DEFAULT_SETTINGS = {
  id: 'default',
  logoText: 'TaniCo',
  tagline: 'Murni Organik',
  websiteName: 'TaniCo — Sayur Segar Organik',
  address: 'Jl. Raya Pemali No. 45, Bangka',
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

export async function GET() {
  try {
    return NextResponse.json(DEFAULT_SETTINGS, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    });
  } catch (error) {
    logger.error('GET /api/settings error:', error);
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const result = {
      ...DEFAULT_SETTINGS,
      ...body
    };

    clearHomeCache();
    return NextResponse.json(result);
  } catch (error) {
    logger.error('POST /api/settings error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan pengaturan' }, { status: 500 });
  }
}

export async function PUT(request) {
  return POST(request);
}
