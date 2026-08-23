import { NextResponse } from 'next/server';
import { getHomeData } from '@/lib/home';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store'
};

export async function GET() {
  try {
    const freshData = await getHomeData();

    return NextResponse.json(freshData, {
      headers: NO_CACHE_HEADERS
    });
  } catch (error) {
    logger.error('API GET /api/home unhandled error:', error);
    return NextResponse.json({ error: 'Gagal memuat data homepage' }, { status: 500 });
  }
}



