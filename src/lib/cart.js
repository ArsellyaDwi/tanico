import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export async function getUserCart(userId) {
  if (!userId || !prisma) return [];

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    if (!cart || !cart.items) return [];

    return cart.items.map(item => ({
      id: item.productId,
      productId: item.productId,
      quantity: item.quantity,
      ...(item.product || {})
    }));
  } catch (error) {
    if (error?.name === 'PrismaClientInitializationError' || error?.message?.includes('Initialization') || error?.message?.includes('Environment variable not found') || error?.message?.includes('connect')) {
      logger.warn('[CartLib] Prisma DB unavailable, returning empty cart.');
    } else {
      logger.error('[CartLib] Error getting user cart:', error);
    }
    return [];
  }
}

export async function saveUserCart(userId, productId, quantity, setQuantity = false) {
  if (!userId || !productId) return { success: false, error: 'User ID dan Product ID wajib diisi' };

  try {
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } }
    });

    const newQty = setQuantity
      ? quantity
      : (existingItem ? existingItem.quantity + quantity : quantity);

    if (newQty <= 0) {
      if (existingItem) {
        await prisma.cartItem.delete({ where: { id: existingItem.id } });
      }
    } else {
      await prisma.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId } },
        create: { cartId: cart.id, productId, quantity: newQty },
        update: { quantity: newQty }
      });
    }

    return { success: true };
  } catch (error) {
    logger.error('[CartLib] Error saving user cart:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteUserCartItem(userId, productId) {
  if (!userId || !productId) return { success: false };

  try {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id, productId }
      });
    }
    return { success: true };
  } catch (error) {
    logger.error('[CartLib] Error deleting cart item:', error);
    return { success: false, error: error.message };
  }
}
