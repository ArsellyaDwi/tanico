import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/utils/session';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { ensureSupabaseImageUrl, cleanupOldImageIfReplaced } from '@/lib/supabaseStorage';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    if (!(await verifyAdminSession(request))) {
      return NextResponse.json({ error: 'Akses ditolak. Memerlukan hak akses administrator.' }, { status: 403 });
    }
    if (!prisma) return NextResponse.json({});
    let profile = await prisma.adminProfile.findUnique({
      where: { id: 'default' }
    });

    if (!profile) {
      profile = await prisma.adminProfile.create({
        data: {
          id: 'default',
          name: 'Admin TaniCo',
          email: 'admin@tanico.id',
          role: 'Super Admin',
          avatar: '/avatars/admin.jpg'
        }
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    logger.error('GET /api/admin/profile error:', error);
    return NextResponse.json({}, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    if (!(await verifyAdminSession(request))) {
      return NextResponse.json({ error: 'Akses ditolak. Memerlukan hak akses administrator.' }, { status: 403 });
    }
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();

    const existing = await prisma.adminProfile.findUnique({
      where: { id: 'default' }
    });

    const oldAvatar = existing?.avatar;
    if (body.avatar) {
      body.avatar = await ensureSupabaseImageUrl(body.avatar, `admin_avatar.jpg`, 'tanico-public');
    }

    const updated = await prisma.adminProfile.upsert({
      where: { id: 'default' },
      update: body,
      create: {
        id: 'default',
        name: body.name || 'Admin TaniCo',
        email: body.email || 'admin@tanico.id',
        role: body.role || 'Super Admin',
        avatar: body.avatar || '/avatars/admin.jpg'
      }
    });

    if (oldAvatar && body.avatar && oldAvatar !== body.avatar) {
      await cleanupOldImageIfReplaced(oldAvatar, body.avatar, { model: 'AdminProfile', id: 'default' });
    }

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/admin/profile error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui profil admin' }, { status: 500 });
  }
}
