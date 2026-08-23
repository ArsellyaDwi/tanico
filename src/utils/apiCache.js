const cache = new Map();

export function getApiCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item.value;
}

export function setApiCache(key, value, ttlSeconds = 60) {
  cache.set(key, {
    value,
    expiry: Date.now() + ttlSeconds * 1000
  });
}

export function clearApiCache(prefix) {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}
