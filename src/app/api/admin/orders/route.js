import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where = {};
    if (status) where.status = status;

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        user: true
      }
    });

    return NextResponse.json(orders || []);
  } catch (error) {
    logger.error('GET /api/admin/orders error:', error);
    return NextResponse.json({ error: 'Gagal memuat pesanan dari database' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();
    const { customerName, phone, address, totalAmount, items, status, paymentMethod, notes, userId } = body;

    const orderId = body.id || 'ORD-' + Math.floor(100000 + Math.random() * 900000);

    const newOrder = await prisma.order.create({
      data: {
        id: orderId,
        customerName: customerName || 'Pelanggan',
        phone: phone || '-',
        address: address || '-',
        totalAmount: parseFloat(totalAmount || 0),
        status: status || 'Menunggu',
        paymentMethod: paymentMethod || 'wa',
        notes: notes || '',
        userId: userId || null,
        items: items && Array.isArray(items) ? {
          create: items.map(item => ({
            productId: item.productId || null,
            name: item.name || 'Produk',
            price: parseFloat(item.price || 0),
            quantity: parseInt(item.quantity || 1, 10),
            unit: item.unit || '1 kg',
            image: item.image || '/placeholder-vegetable.jpg'
          }))
        } : undefined
      },
      include: { items: true, user: true }
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    logger.error('POST /api/admin/orders error:', error);
    return NextResponse.json({ error: 'Gagal membuat pesanan' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();

    if (Array.isArray(body)) {
      const updatedList = [];
      for (const item of body) {
        if (item.id) {
          const res = await prisma.order.update({
            where: { id: item.id },
            data: {
              status: item.status,
              notes: item.notes
            }
          });
          updatedList.push(res);
        }
      }
      return NextResponse.json(updatedList);
    }

    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'ID pesanan diperlukan' }, { status: 400 });

    const updated = await prisma.order.update({
      where: { id },
      data,
      include: { items: true }
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/admin/orders error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui pesanan' }, { status: 500 });
  }
}
