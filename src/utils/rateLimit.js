const rateLimitMap = new Map();

export function isRateLimited(key, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (record.count >= maxRequests) {
    return true;
  }

  record.count += 1;
  return false;
}

export function getClientIp(request) {
  if (!request) return '127.0.0.1';
  const forwarded = request.headers?.get ? request.headers.get('x-forwarded-for') : request.headers?.['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  const realIp = request.headers?.get ? request.headers.get('x-real-ip') : request.headers?.['x-real-ip'];
  if (realIp) return String(realIp).trim();
  return '127.0.0.1';
}
