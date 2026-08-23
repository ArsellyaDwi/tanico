import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { updateUserProfile } from '@/lib/dbActions';
import { isRateLimited, getClientIp } from '@/utils/rateLimit';
import { logger } from '@/utils/logger';
import {
  ensureSupabaseImageUrl,
  cleanupOldImageIfReplaced
} from '@/lib/supabaseStorage';

export const dynamic = 'force-dynamic';

async function getUserFromRequest(request) {
  try {
    const token = request.cookies.get('tanico_session')?.value;
    if (!token) return null;

    const secret = new TextEncoder().encode(process.env.SESSION_SECRET || process.env.SUPABASE_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function GET(request) {
  try {
    const session = await getUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Sesi tidak valid atau telah berakhir.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar || '',
      phone: user.phone || '',
      address: user.address || '',
      provider: user.provider || 'Email',
      status: user.status || 'Aktif',
      role: user.role?.name || user.role || 'CUSTOMER'
    });
  } catch (error) {
    logger.error('API GET /api/auth/profile error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(`profile_update_${ip}`, 15, 60 * 1000)) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Silakan tunggu sebentar.' }, { status: 429 });
    }

    const session = await getUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Sesi tidak valid atau telah berakhir.' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...profileData } = body;
    if (!id) {
      return NextResponse.json({ error: 'ID pengguna wajib disertakan' }, { status: 400 });
    }

    const role = (session.role || '').toUpperCase();
    if (session.id !== id && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Anda tidak berhak mengubah profil pengguna lain.' }, { status: 403 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, avatar: true }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    const cleanData = {};
    Object.keys(profileData).forEach(key => {
      if (profileData[key] !== undefined && profileData[key] !== null) {
        cleanData[key] = profileData[key];
      }
    });

    if (cleanData.avatar) {
      cleanData.avatar = await ensureSupabaseImageUrl(cleanData.avatar, `user_${id}_${Date.now()}.jpg`, 'tanico-public');
    }

    const updated = await updateUserProfile(id, cleanData);
    if (!updated) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    if (existingUser?.avatar && cleanData.avatar && existingUser.avatar !== cleanData.avatar) {
      await cleanupOldImageIfReplaced(existingUser.avatar, cleanData.avatar, { model: 'User', id });
    }

    return NextResponse.json({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      avatar: updated.avatar || '',
      phone: updated.phone || '',
      address: updated.address || '',
      provider: updated.provider || 'Email',
      status: updated.status || 'Aktif',
      role: updated.role
    });

  } catch (error) {
    logger.error('API PUT /api/auth/profile error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}