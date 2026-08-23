import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const logs = await prisma.activityLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    return NextResponse.json(logs || []);
  } catch (error) {
    logger.error('GET /api/activity-logs error:', error);
    return NextResponse.json({ error: 'Gagal memuat log aktivitas dari database' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const actionText = typeof body === 'string' ? body : (body.action || JSON.stringify(body));
    const adminName = body.adminName || 'Admin TaniCo';

    const newLog = await prisma.activityLog.create({
      data: {
        adminName,
        action: actionText,
        timestamp: new Date()
      }
    });

    return NextResponse.json(newLog);
  } catch (error) {
    logger.error('POST /api/activity-logs error:', error);
    return NextResponse.json({ error: 'Gagal menambah log aktivitas' }, { status: 500 });
  }
}
