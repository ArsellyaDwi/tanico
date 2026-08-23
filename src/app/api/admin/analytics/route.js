import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    if (!prisma) {
      return NextResponse.json({
        totalRevenue: 0,
        monthlyRevenue: [],
        topCategories: [],
        orderStatusDistribution: [],
        customerGrowth: []
      });
    }

    const [orders, categories, users, products] = await Promise.all([
      prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } }),
      prisma.category.findMany({ include: { _count: { select: { products: true } } } }),
      prisma.user.findMany({ select: { createdAt: true } }),
      prisma.product.findMany({ orderBy: { soldCount: 'desc' }, take: 10 })
    ]);

    const totalRevenue = orders
      .filter(o => o.status !== 'Batal')
      .reduce((acc, o) => acc + (o.totalAmount || 0), 0);

    const statusMap = {};
    orders.forEach(o => {
      statusMap[o.status] = (statusMap[o.status] || 0) + 1;
    });
    const orderStatusDistribution = Object.keys(statusMap).map(status => ({
      status,
      count: statusMap[status]
    }));

    const topCategories = categories.map(c => ({
      id: c.id,
      name: c.name,
      productCount: c._count?.products || 0
    }));

    return NextResponse.json({
      totalRevenue,
      totalOrdersCount: orders.length,
      totalUsersCount: users.length,
      topSellingProducts: products,
      orderStatusDistribution,
      topCategories
    });
  } catch (error) {
    logger.error('GET /api/admin/analytics error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data analitik' }, { status: 500 });
  }
}