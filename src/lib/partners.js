import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { ensureSupabaseImageUrl } from '@/lib/supabaseStorage';
import crypto from 'crypto';

export async function savePartners(partnersArray) {
  if (!Array.isArray(partnersArray)) return { success: false, error: 'Input harus berupa array' };

  try {
    const validIds = partnersArray.map(p => p.id).filter(Boolean);

    if (validIds.length === 0) {
      await prisma.partner.deleteMany({});
    } else {
      await prisma.partner.deleteMany({
        where: { id: { notIn: validIds } }
      }).catch(() => {});
    }

    const processedPartners = await Promise.all(
      partnersArray.map(async (p, idx) => {
        const pId = p.id || crypto.randomUUID();
        const logoUrl = await ensureSupabaseImageUrl(p.logo || p.image, `partner_${pId}.jpg`, 'partners');
        return { ...p, id: pId, logoUrl, sortOrder: Number(p.sortOrder ?? p.order ?? (idx + 1)) || (idx + 1) };
      })
    );

    const operations = processedPartners.map((p) => {
      const pLogo = p.logoUrl || p.logo || p.image || '';
      const pDesc = p.description || p.desc || '';
      const pWeb = p.website || p.url || '';
      const pLoc = p.location || '';
      return prisma.partner.upsert({
        where: { id: p.id },
        create: {
          id: p.id,
          name: p.name || '',
          logo: pLogo,
          location: pLoc,
          description: pDesc,
          website: pWeb,
          active: p.active !== false,
          sortOrder: p.sortOrder
        },
        update: {
          name: p.name || '',
          logo: pLogo,
          location: pLoc,
          description: pDesc,
          website: pWeb,
          active: p.active !== false,
          sortOrder: p.sortOrder
        }
      });
    });

    await prisma.$transaction(operations);
    return { success: true };
  } catch (error) {
    logger.error('[PartnersLib] Error saving partners:', error);
    return { success: false, error: error.message };
  }
}
