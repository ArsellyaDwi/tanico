import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export async function getUserWishlist(userId) {
  if (!userId || !prisma) return [];

  try {
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });

    if (!wishlist || !wishlist.items) return [];

    return wishlist.items.map(item => ({
      id: item.productId,
      productId: item.productId,
      createdAt: item.createdAt,
      ...(item.product || {})
    }));
  } catch (error) {
    if (error?.name === 'PrismaClientInitializationError' || error?.message?.includes('connect')) {
      logger.warn('[WishlistLib] Prisma DB unavailable, returning empty wishlist.');
    } else {
      logger.error('[WishlistLib] Error getting user wishlist:', error);
    }
    return [];
  }
}

export async function addUserWishlistItem(userId, productId) {
  if (!userId || !productId || !prisma) return { success: false, error: 'User ID dan Product ID wajib diisi' };

  try {
    let wishlist = await prisma.wishlist.findUnique({ where: { userId } });
    if (!wishlist) {
      wishlist = await prisma.wishlist.create({ data: { userId } });
    }

    const existingItem = await prisma.wishlistItem.findUnique({
      where: { wishlistId_productId: { wishlistId: wishlist.id, productId } }
    });

    if (existingItem) {
      return { success: true, message: 'Produk sudah ada di wishlist' };
    }

    await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId
      }
    });

    return { success: true };
  } catch (error) {
    logger.error('[WishlistLib] Error adding wishlist item:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteUserWishlistItem(userId, productId) {
  if (!userId || !productId || !prisma) return { success: false };

  try {
    const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
    if (!wishlist) return { success: true };

    await prisma.wishlistItem.deleteMany({
      where: {
        wishlistId: wishlist.id,
        productId
      }
    });

    return { success: true };
  } catch (error) {
    logger.error('[WishlistLib] Error deleting wishlist item:', error);
    return { success: false, error: error.message };
  }
}
