import { formatDate as baseFormatDate } from '@/utils/formatters';
import { logger } from '@/utils/logger';

export function normalizeEmail(email) {
  if (!email) return '';
  return String(email).trim().toLowerCase();
}

export function isActiveProduct(product) {
  if (!product) return false;
  const status = String(product.status || 'active').toLowerCase();
  return status === 'active' || status === 'aktif';
}

export function slugify(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatDate(date, options) {
  return baseFormatDate(date, options);
}
