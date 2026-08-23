import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const history = await prisma.stockHistory.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
      include: { product: true }
    });
    return NextResponse.json(history || []);
  } catch (error) {
    logger.error('GET /api/admin/stock-history error:', error);
    return NextResponse.json({ error: 'Gagal memuat riwayat stok dari database' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!prisma) return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    const body = await request.json();
    const { productId, productName, type, quantity, notes } = body;

    if (!productId || !type || quantity === undefined) {
      return NextResponse.json({ error: 'Data mutasi stok tidak lengkap' }, { status: 400 });
    }

    const qty = parseInt(quantity, 10);

    const newMutation = await prisma.stockHistory.create({
      data: {
        productId,
        productName: productName || 'Produk',
        type: type || 'RESTOCK',
        quantity: qty,
        notes: notes || 'Logistik Gudang',
        timestamp: new Date()
      }
    });

    // Update product stock accordingly
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (product) {
      let stockChange = qty;
      if (type === 'MUTASI_KELUAR' || type === 'RUSAK') {
        stockChange = -Math.abs(qty);
      } else {
        stockChange = Math.abs(qty);
      }
      const newStock = Math.max(0, (product.stock || 0) + stockChange);
      await prisma.product.update({
        where: { id: productId },
        data: { stock: newStock }
      });
    }

    return NextResponse.json(newMutation, { status: 201 });
  } catch (error) {
    logger.error('POST /api/admin/stock-history error:', error);
    return NextResponse.json({ error: 'Gagal menambah mutasi stok' }, { status: 500 });
  }
}
