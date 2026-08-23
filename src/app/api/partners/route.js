import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { 
  ensureSupabaseImageUrl, 
  cleanupOldImageIfReplaced, 
  cleanupDeletedEntityImages 
} from '@/lib/supabaseStorage';
import { clearHomeCache } from '@/lib/cache';
import { savePartners } from '@/lib/partners';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json([], {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      });
    }
    const partners = await prisma.partner.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    return NextResponse.json(partners || [], {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error) {
    logger.error('GET /api/partners error:', error);
    return NextResponse.json([], {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Check if bulk sync request from Homepage CMS
    if (body.list && Array.isArray(body.list)) {
      const result = await savePartners(body.list);
      clearHomeCache();
      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Gagal menyimpan daftar mitra' }, { status: 500 });
      }
      const updated = await prisma.partner.findMany({ orderBy: { sortOrder: 'asc' } });
      return NextResponse.json(updated);
    }

    if (Array.isArray(body)) {
      const result = await savePartners(body);
      clearHomeCache();
      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Gagal menyimpan daftar mitra' }, { status: 500 });
      }
      const updated = await prisma.partner.findMany({ orderBy: { sortOrder: 'asc' } });
      return NextResponse.json(updated);
    }

    const { name, logo, location, description, website, active, sortOrder } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nama mitra wajib diisi' }, { status: 400 });
    }

    const cleanLogo = logo ? await ensureSupabaseImageUrl(logo, `partner_${Date.now()}.jpg`, 'partners') : '';

    const newPartner = await prisma.partner.create({
      data: {
        name,
        logo: cleanLogo || logo || '',
        location: location || '',
        description: description || '',
        website: website || '',
        active: active !== false,
        sortOrder: Number(sortOrder) || 0
      }
    });

    clearHomeCache();
    return NextResponse.json(newPartner);
  } catch (error) {
    logger.error('POST /api/partners error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan mitra: ' + (error.message || '') }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id') || body.id;

    if (!id) {
      return NextResponse.json({ error: 'ID mitra diperlukan' }, { status: 400 });
    }

    const existing = await prisma.partner.findUnique({
      where: { id }
    });

    let { name, logo, location, description, website, active, sortOrder } = body;

    if (logo) {
      logo = await ensureSupabaseImageUrl(logo, `partner_${id}.jpg`, 'partners');
    }

    const updated = await prisma.partner.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(logo !== undefined && { logo }),
        ...(location !== undefined && { location }),
        ...(description !== undefined && { description }),
        ...(website !== undefined && { website }),
        ...(active !== undefined && { active }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) })
      }
    });

    if (existing?.logo && logo && existing.logo !== logo) {
      await cleanupOldImageIfReplaced(existing.logo, logo, { model: 'Partner', id });
    }

    clearHomeCache();
    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/partners error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui mitra' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json({ error: 'ID mitra diperlukan' }, { status: 400 });
    }

    const existing = await prisma.partner.findUnique({
      where: { id }
    });

    await prisma.partner.delete({ where: { id } });

    if (existing?.logo) {
      await cleanupDeletedEntityImages([existing.logo], { model: 'Partner', id });
    }

    clearHomeCache();
    return NextResponse.json({ success: true, message: 'Mitra berhasil dihapus' });
  } catch (error) {
    logger.error('DELETE /api/partners error:', error);
    return NextResponse.json({ error: 'Gagal menghapus mitra' }, { status: 500 });
  }
}
