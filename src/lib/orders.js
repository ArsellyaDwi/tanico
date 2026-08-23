import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export async function createCheckoutOrder({
  customerName,
  phone,
  address,
  subdistrict = '',
  paymentMethod = 'tf',
  voucherCode = '',
  items = [],
  userId = null,
  notes = '',
  customerEmail = ''
}) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Keranjang belanja Anda kosong.');
  }
  if (!customerName || !phone || !address) {
    throw new Error('Nama penerima, nomor telepon, dan alamat wajib diisi.');
  }

  if (!prisma) {
    throw new Error('Koneksi database tidak tersedia.');
  }

  try {
    const productIds = items.map(item => item.productId || item.id).filter(Boolean);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    let calculatedTotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const pid = item.productId || item.id;
      const dbProd = productMap.get(pid);
      const qty = Math.max(1, parseInt(item.quantity || 1, 10));
      
      const itemPrice = dbProd ? (dbProd.discountPrice || dbProd.price) : Number(item.price || 0);
      const itemName = dbProd ? dbProd.name : (item.name || '');
      const itemUnit = dbProd ? dbProd.unit : (item.unit || '');
      const itemImage = dbProd 
        ? (dbProd.image || '') 
        : (item.image || '');

      calculatedTotal += itemPrice * qty;

      orderItemsData.push({
        productId: dbProd ? dbProd.id : (pid || null),
        name: itemName,
        price: itemPrice,
        quantity: qty,
        unit: itemUnit,
        image: itemImage
      });
    }

    const orderId = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const order = await prisma.order.create({
      data: {
        id: orderId,
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        subdistrict: (subdistrict || '').trim(),
        notes: (notes || '').trim(),
        totalAmount: calculatedTotal,
        status: 'Menunggu',
        paymentMethod: paymentMethod || 'tf',
        customerEmail: (customerEmail || '').trim(),
        userId: userId || null,
        voucherCode: (voucherCode || '').trim(),
        items: {
          create: orderItemsData
        }
      },
      include: {
        items: true,
        user: true
      }
    });

    // If customer was logged in, clean up their cart
    if (userId) {
      const cart = await prisma.cart.findUnique({ where: { userId } });
      if (cart) {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } }).catch(() => {});
      }
    }

    return order;
  } catch (error) {
    logger.error('[OrdersLib] Error creating checkout order:', error);
    throw error;
  }
}

