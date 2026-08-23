import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });

    const where = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 200
    });

    return NextResponse.json(orders || []);
  } catch (error) {
    logger.error('GET /api/orders error:', error);
    return NextResponse.json({ error: 'Gagal memuat pesanan dari database' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const orderData = Array.isArray(body) ? body[0] : body;

    const {
      id,
      customerName,
      phone,
      address,
      subdistrict,
      notes,
      totalAmount,
      status,
      paymentMethod,
      customerEmail,
      userId,
      voucherCode,
      items
    } = orderData || {};

    if (!customerName || !phone || !address) {
      return NextResponse.json({ error: 'Nama, nomor telepon, dan alamat wajib diisi' }, { status: 400 });
    }

    const orderId = id || `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newOrder = await prisma.order.create({
      data: {
        id: orderId,
        customerName,
        phone,
        address,
        subdistrict: subdistrict || '',
        notes: notes || '',
        totalAmount: Number(totalAmount) || 0,
        status: status || 'Menunggu',
        paymentMethod: paymentMethod || 'wa',
        customerEmail: customerEmail || '',
        userId: userId || null,
        voucherCode: voucherCode || '',
        items: {
          create: (items || []).map(item => ({
            productId: item.productId || item.id || null,
            name: item.name || 'Produk',
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
            unit: item.unit || 'kg',
            image: item.image || ''
          }))
        }
      },
      include: { items: true }
    });

    return NextResponse.json(newOrder);
  } catch (error) {
    logger.error('POST /api/orders error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan pesanan' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id') || body.id;

    if (!id) {
      return NextResponse.json({ error: 'ID pesanan diperlukan' }, { status: 400 });
    }

    const { status, notes, address, phone, customerName } = body;

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(customerName !== undefined && { customerName })
      },
      include: { items: true }
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('PUT /api/orders error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui pesanan' }, { status: 500 });
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
      return NextResponse.json({ error: 'ID pesanan diperlukan' }, { status: 400 });
    }

    await prisma.order.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Pesanan berhasil dihapus' });
  } catch (error) {
    logger.error('DELETE /api/orders error:', error);
    return NextResponse.json({ error: 'Gagal menghapus pesanan' }, { status: 500 });
  }
}
