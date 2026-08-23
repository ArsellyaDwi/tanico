import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { clearHomeCache } from '@/lib/cache';
import { 
  ensureSupabaseImageUrl, 
  cleanupOldImageIfReplaced, 
  cleanupDeletedEntityImages 
} from '@/lib/supabaseStorage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store'
};

export async function GET(request) {
  try {
    if (!prisma) {
      return new NextResponse(JSON.stringify({ error: 'Database tidak tersedia' }), {
        status: 500,
        headers: NO_CACHE_HEADERS
      });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('all') === 'true';

    const where = includeInactive ? {} : { active: true };
    const benefits = await prisma.heroBenefit.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    const formatted = (Array.isArray(benefits) ? benefits : []).map(b => {
      const title = b.title || b.value || '';
      const description = b.description || b.label || '';
      return {
        id: b.id,
        title,
        description,
        value: title,
        label: description,
        image: b.image || '',
        sortOrder: typeof b.sortOrder === 'number' ? b.sortOrder : 0,
        active: b.active !== false,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt
      };
    });

    return new NextResponse(JSON.stringify(formatted), {
      status: 200,
      headers: NO_CACHE_HEADERS
    });
  } catch (error) {
    logger.error('GET /api/hero-benefits error:', error);
    return new NextResponse(JSON.stringify({ error: 'Gagal memuat manfaat hero dari database' }), {
      status: 500,
      headers: NO_CACHE_HEADERS
    });
  }
}

export async function POST(request) {
  try {

    if (!prisma) {
      return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    const body = await request.json().catch(() => ({}));

    // Bulk Sync Mode (if array or { benefits: [...] } passed)
    const items = Array.isArray(body) ? body : (Array.isArray(body.benefits) ? body.benefits : null);

    if (items) {
      if (!Array.isArray(items)) {
        return NextResponse.json({ error: 'Format data benefits tidak valid' }, { status: 400, headers: NO_CACHE_HEADERS });
      }

      const existingBenefits = await prisma.heroBenefit.findMany({ select: { id: true } });
      const existingIds = new Set(existingBenefits.map(b => b.id));

      const processedData = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const title = (item.title || item.value || '').trim();
        const description = (item.description || item.label || '').trim();
        const rawImg = typeof item.image === 'string' ? item.image.trim() : '';
        const cleanImg = rawImg ? await ensureSupabaseImageUrl(rawImg, `hero_benefit_${i}_${Date.now()}.jpg`, 'hero') : '';

        processedData.push({
          id: item.id && existingIds.has(item.id) ? item.id : undefined,
          title,
          description,
          value: title,
          label: description,
          image: cleanImg,
          sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : i,
          active: item.active !== false
        });
      }

      await prisma.$transaction(async (tx) => {
        for (const data of processedData) {
          if (data.id) {
            await tx.heroBenefit.update({
              where: { id: data.id },
              data: {
                title: data.title,
                description: data.description,
                value: data.value,
                label: data.label,
                image: data.image,
                sortOrder: data.sortOrder,
                active: data.active
              }
            });
          } else {
            await tx.heroBenefit.create({
              data: {
                title: data.title,
                description: data.description,
                value: data.value,
                label: data.label,
                image: data.image,
                sortOrder: data.sortOrder,
                active: data.active
              }
            });
          }
        }
      });

      clearHomeCache();
      const allBenefits = await prisma.heroBenefit.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
      });

      const formatted = allBenefits.map(b => {
        const title = b.title || b.value || '';
        const description = b.description || b.label || '';
        return {
          id: b.id,
          title,
          description,
          value: title,
          label: description,
          image: b.image || '',
          sortOrder: b.sortOrder,
          active: b.active
        };
      });

      return NextResponse.json(formatted, { headers: NO_CACHE_HEADERS });
    }

    // Single item create mode
    const title = (body.title || body.value || '').trim();
    const description = (body.description || body.label || '').trim();

    if (!title || !description) {
      return NextResponse.json({ error: 'Title dan description wajib diisi' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const rawImage = typeof body.image === 'string' ? body.image.trim() : '';
    const cleanImg = rawImage ? await ensureSupabaseImageUrl(rawImage, `hero_benefit_${Date.now()}.jpg`, 'hero') : '';

    const newBenefit = await prisma.heroBenefit.create({
      data: {
        title,
        description,
        value: title,
        label: description,
        image: cleanImg,
        sortOrder: Number(body.sortOrder) || 0,
        active: body.active !== false
      }
    });

    clearHomeCache();
    return NextResponse.json({
      id: newBenefit.id,
      title: newBenefit.title || newBenefit.value,
      description: newBenefit.description || newBenefit.label,
      value: newBenefit.title || newBenefit.value,
      label: newBenefit.description || newBenefit.label,
      image: newBenefit.image,
      sortOrder: newBenefit.sortOrder,
      active: newBenefit.active
    }, { status: 201, headers: NO_CACHE_HEADERS });
  } catch (error) {
    logger.error('POST /api/hero-benefits error:', error);
    return NextResponse.json({ error: 'Gagal membuat kartu manfaat' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function PUT(request) {
  try {

    if (!prisma) {
      return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const id = searchParams.get('id') || body.id;

    if (!id) {
      return NextResponse.json({ error: 'ID Kartu Manfaat diperlukan' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const existing = await prisma.heroBenefit.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Kartu manfaat tidak ditemukan' }, { status: 404, headers: NO_CACHE_HEADERS });
    }

    const updateData = {};
    if (body.title !== undefined || body.value !== undefined) {
      const val = String(body.title !== undefined ? body.title : body.value).trim();
      updateData.title = val;
      updateData.value = val;
    }
    if (body.description !== undefined || body.label !== undefined) {
      const lbl = String(body.description !== undefined ? body.description : body.label).trim();
      updateData.description = lbl;
      updateData.label = lbl;
    }
    if (body.sortOrder !== undefined) updateData.sortOrder = Number(body.sortOrder);
    if (body.active !== undefined) updateData.active = Boolean(body.active);

    if (body.image !== undefined) {
      if (body.image) {
        updateData.image = await ensureSupabaseImageUrl(body.image, `hero_benefit_${id}_${Date.now()}.jpg`, 'hero');
      } else {
        updateData.image = '';
      }
    }

    const updated = await prisma.heroBenefit.update({
      where: { id },
      data: updateData
    });

    if (existing?.image && updateData.image && existing.image !== updateData.image) {
      await cleanupOldImageIfReplaced(existing.image, updateData.image, { model: 'HeroBenefit', id });
    }

    clearHomeCache();
    return NextResponse.json({
      id: updated.id,
      title: updated.title || updated.value,
      description: updated.description || updated.label,
      value: updated.title || updated.value,
      label: updated.description || updated.label,
      image: updated.image,
      sortOrder: updated.sortOrder,
      active: updated.active
    }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    logger.error('PUT /api/hero-benefits error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui kartu manfaat' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function DELETE(request) {
  try {

    if (!prisma) {
      return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const id = searchParams.get('id') || body.id;

    if (!id) {
      return NextResponse.json({ error: 'ID Kartu Manfaat diperlukan' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const existing = await prisma.heroBenefit.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Kartu manfaat tidak ditemukan' }, { status: 404, headers: NO_CACHE_HEADERS });
    }

    await prisma.heroBenefit.delete({ where: { id } });

    if (existing?.image) {
      await cleanupDeletedEntityImages([existing.image], { model: 'HeroBenefit', id });
    }

    clearHomeCache();
    return NextResponse.json({ success: true, message: 'Kartu manfaat berhasil dihapus' }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    logger.error('DELETE /api/hero-benefits error:', error);
    return NextResponse.json({ error: 'Gagal menghapus kartu manfaat' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
