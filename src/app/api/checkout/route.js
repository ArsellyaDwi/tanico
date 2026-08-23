import { NextResponse } from 'next/server';
import { createCheckoutOrder } from '@/lib/dbActions';
import { checkoutSchema, getZodErrorMessage } from '@/utils/validators';
import { isRateLimited, getClientIp } from '@/utils/rateLimit';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    // Rate limit: Max 10 checkout orders per minute per IP
    if (isRateLimited(`checkout_${ip}`, 10, 60 * 1000)) {
      return NextResponse.json(
        { error: 'Terlalu banyak pesanan dalam waktu singkat. Silakan tunggu sebentar.' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Zod validation
    const parseResult = checkoutSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = getZodErrorMessage(parseResult.error, 'Data checkout tidak valid.');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { customerName, phone, address, subdistrict, paymentMethod, voucherCode, items } = parseResult.data;

    const order = await createCheckoutOrder({
      customerName,
      phone,
      address,
      subdistrict,
      paymentMethod,
      voucherCode,
      items
    });

    logger.info(`New order created successfully: ${order.id}`);

    return NextResponse.json({ success: true, order });
  } catch (error) {
    logger.error('API POST /api/checkout error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server saat memproses checkout.' }, { status: 500 });
  }
}
