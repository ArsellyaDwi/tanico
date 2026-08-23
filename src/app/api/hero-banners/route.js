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

export async function GET(request) {
  try {
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('all') === 'true';

    const where = includeInactive ? {} : { active: true };
    const banners = await prisma.heroBanner.findMany({
      where,
      orderBy: { sortOrder: 'asc' }
    });

    return NextResponse.json(banners);
  } catch (error) {
    logger.error('GET /api/hero-banners error:', error);
    return NextResponse.json({ error: 'Gagal memuat banner hero dari database' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();

    // Bulk Sync Mode
    if (Array.isArray(body.slides)) {
      const slides = body.slides;
      const existingBanners = await prisma.heroBanner.findMany();
      const existingMap = new Map(existingBanners.map(b => [b.id, b]));

      const incomingValidIds = new Set();
      slides.forEach(s => {
        if (s.id && existingMap.has(s.id)) {
          incomingValidIds.add(s.id);
        }
      });

      // Delete banners removed by Admin
      const idsToDelete = Array.from(existingMap.keys()).filter(id => !incomingValidIds.has(id));
      if (idsToDelete.length > 0) {
        const deletedBanners = idsToDelete.map(id => existingMap.get(id)).filter(Boolean);
        await prisma.heroBanner.deleteMany({
          where: { id: { in: idsToDelete } }
        });
        const urlsToDelete = [];
        deletedBanners.forEach(b => {
          if (b.image) urlsToDelete.push(b.image);
          if (b.desktopImage) urlsToDelete.push(b.desktopImage);
          if (b.mobileImage) urlsToDelete.push(b.mobileImage);
        });
        if (urlsToDelete.length > 0) {
          await cleanupDeletedEntityImages(urlsToDelete, { model: 'HeroBanner' });
        }
      }

      // Upsert / Create slides
      for (let i = 0; i < slides.length; i++) {
        const s = slides[i];
        const sTitle = s.title || `Slide ${i + 1}`;
        const rawDesk = s.desktopImage || s.image || '';
        const rawMob = s.mobileImage || '';
        const sImage = rawDesk ? await ensureSupabaseImageUrl(rawDesk, `hero_slide_${i}.jpg`, 'hero') : '';
        const sDesk = sImage;
        const sMob = rawMob ? await ensureSupabaseImageUrl(rawMob, `hero_slide_mob_${i}.jpg`, 'hero') : sImage;

        const sData = {
          title: sTitle,
          subtitle: s.subtitle || '',
          badge: s.badge || '',
          description: s.description || '',
          buttonText: s.buttonText || '',
          buttonLink: s.buttonLink || '',
          image: sImage,
          desktopImage: sDesk,
          mobileImage: sMob,
          active: s.active !== false,
          background: s.background || '#ECF6ED',
          overlay: Number(s.overlay) || 0,
          cropPosition: s.cropPosition || 'center center',
          cropZoom: String(s.cropZoom || '100'),
          desktopCrop: s.desktopCrop || s.cropPosition || 'center center',
          desktopZoom: String(s.desktopZoom || s.cropZoom || '100'),
          mobileCrop: s.mobileCrop || s.cropPosition || 'center center',
          mobileZoom: String(s.mobileZoom || s.cropZoom || '100'),
          sortOrder: Number(s.sortOrder) || i
        };

        if (s.id && existingMap.has(s.id)) {
          const old = existingMap.get(s.id);
          await prisma.heroBanner.update({
            where: { id: s.id },
            data: sData
          });
          if (old?.image && sImage && old.image !== sImage) {
            await cleanupOldImageIfReplaced(old.image, sImage, { model: 'HeroBanner', id: s.id });
          }
          if (old?.desktopImage && sDesk && old.desktopImage !== sDesk) {
            await cleanupOldImageIfReplaced(old.desktopImage, sDesk, { model: 'HeroBanner', id: s.id });
          }
          if (old?.mobileImage && sMob && old.mobileImage !== sMob) {
            await cleanupOldImageIfReplaced(old.mobileImage, sMob, { model: 'HeroBanner', id: s.id });
          }
        } else {
          await prisma.heroBanner.create({
            data: sData
          });
        }
      }

      clearHomeCache();
      const updatedBanners = await prisma.heroBanner.findMany({
        orderBy: { sortOrder: 'asc' }
      });
      return NextResponse.json(updatedBanners);
    }

    // Single Create Mode
    const rawImage = body.image || body.desktopImage || '';
    const rawMobImage = body.mobileImage || '';
    const cleanImg = rawImage ? await ensureSupabaseImageUrl(rawImage, `hero_slide_${Date.now()}.jpg`, 'hero') : '';
    const cleanDeskImg = cleanImg;
    const cleanMobImg = rawMobImage ? await ensureSupabaseImageUrl(rawMobImage, `hero_slide_mob_${Date.now()}.jpg`, 'hero') : cleanImg;

    const newBanner = await prisma.heroBanner.create({
      data: {
        title: body.title || 'Hero Banner',
        subtitle: body.subtitle || '',
        badge: body.badge || '',
        description: body.description || '',
        buttonText: body.buttonText || '',
        buttonLink: body.buttonLink || '',
        image: cleanImg,
        desktopImage: cleanDeskImg,
        mobileImage: cleanMobImg,
        active: body.active !== false,
        background: body.background || '#ECF6ED',
        overlay: Number(body.overlay) || 0,
        cropPosition: body.cropPosition || 'center center',
        cropZoom: String(body.cropZoom || '100'),
        desktopCrop: body.desktopCrop || 'center center',
        desktopZoom: String(body.desktopZoom || '100'),
        mobileCrop: body.mobileCrop || 'center center',
        mobileZoom: String(body.mobileZoom || '100'),
        sortOrder: Number(body.sortOrder) || 0
      }
    });

    clearHomeCache();
    return NextResponse.json(newBanner, { status: 201 });
  } catch (error) {
    logger.error('POST /api/hero-banners error:', error);
    return NextResponse.json({ error: 'Gagal membuat hero banner' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {

    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID Hero Banner diperlukan' }, { status: 400 });
    }

    let cleanImage = data.image;
    if (cleanImage) {
      cleanImage = await ensureSupabaseImageUrl(cleanImage, `hero_slide_${id}.jpg`, 'hero');
    }
    let cleanDesk = data.desktopImage;
    if (cleanDesk) {
      cleanDesk = await ensureSupabaseImageUrl(cleanDesk, `hero_slide_desk_${id}.jpg`, 'hero');
    }
    let cleanMob = data.mobileImage;
    if (cleanMob) {
      cleanMob = await ensureSupabaseImageUrl(cleanMob, `hero_slide_mob_${id}.jpg`, 'hero');
    }

    const existing = await prisma.heroBanner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Hero banner tidak ditemukan' }, { status: 404 });
    }

    const updated = await prisma.heroBanner.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.subtitle !== undefined && { subtitle: data.subtitle }),
        ...(data.badge !== undefined && { badge: data.badge }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.buttonText !== undefined && { buttonText: data.buttonText }),
        ...(data.buttonLink !== undefined && { buttonLink: data.buttonLink }),
        ...(cleanImage !== undefined && { image: cleanImage }),
        ...(cleanDesk !== undefined && { desktopImage: cleanDesk }),
        ...(cleanMob !== undefined && { mobileImage: cleanMob }),
        ...(data.active !== undefined && { active: Boolean(data.active) }),
        ...(data.background !== undefined && { background: data.background }),
        ...(data.overlay !== undefined && { overlay: Number(data.overlay) }),
        ...(data.cropPosition !== undefined && { cropPosition: data.cropPosition }),
        ...(data.cropZoom !== undefined && { cropZoom: String(data.cropZoom) }),
        ...(data.desktopCrop !== undefined && { desktopCrop: data.desktopCrop }),
        ...(data.desktopZoom !== undefined && { desktopZoom: String(data.desktopZoom) }),
        ...(data.mobileCrop !== undefined && { mobileCrop: data.mobileCrop }),
        ...(data.mobileZoom !== undefined && { mobileZoom: String(data.mobileZoom) }),
        ...(data.sortOrder !== undefined && { sortOrder: Number(data.sortOrder) })
      }
    });

    if (existing?.image && cleanImage && existing.image !== cleanImage) {
      await cleanupOldImageIfReplaced(existing.image, cleanImage, { model: 'HeroBanner', id });
    }
    if (existing?.desktopImage && cleanDesk && existing.desktopImage !== cleanDesk) {
      await cleanupOldImageIfReplaced(existing.desktopImage, cleanDesk, { model: 'HeroBanner', id });
    }
    if (existing?.mobileImage && cleanMob && existing.mobileImage !== cleanMob) {
      await cleanupOldImageIfReplaced(existing.mobileImage, cleanMob, { model: 'HeroBanner', id });
    }

    clearHomeCache();
    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/hero-banners error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui hero banner' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {

    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID Hero Banner diperlukan' }, { status: 400 });
    }

    const existing = await prisma.heroBanner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Hero banner tidak ditemukan' }, { status: 404 });
    }

    await prisma.heroBanner.delete({ where: { id } });

    const urls = [existing.image, existing.desktopImage, existing.mobileImage].filter(Boolean);
    if (urls.length > 0) {
      await cleanupDeletedEntityImages(urls, { model: 'HeroBanner', id });
    }

    clearHomeCache();
    return NextResponse.json({ success: true, message: 'Hero banner berhasil dihapus' });
  } catch (error) {
    logger.error('DELETE /api/hero-banners error:', error);
    return NextResponse.json({ error: 'Gagal menghapus hero banner' }, { status: 500 });
  }
}
