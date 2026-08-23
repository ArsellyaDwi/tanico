import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter')
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  phone: z.string().optional()
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2, 'Nama pemesan wajib diisi'),
  customerPhone: z.string().min(8, 'Nomor telepon wajib valid'),
  shippingAddress: z.string().min(5, 'Alamat pengiriman wajib diisi'),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive()
  })).min(1, 'Keranjang belanja tidak boleh kosong')
});

export function getZodErrorMessage(error, defaultMessage = 'Validasi gagal') {
  if (!error || !error.issues || error.issues.length === 0) {
    return defaultMessage;
  }
  return error.issues.map(issue => issue.message).join(', ');
}
