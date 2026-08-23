import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma.js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }) 
  : null;

const VALID_BUCKETS = new Set([
  'hero',
  'products',
  'categories',
  'articles',
  'gallery',
  'partners',
  'testimonials',
  'tanico-public'
]);

/**
 * Extract bucket and storage path from a Supabase Storage public/signed URL
 */
export function extractStoragePathAndBucket(url) {
  if (!url || typeof url !== 'string') return null;
  const regex = /\/storage\/v1\/object\/(?:public\/|sign\/)?([^/]+)\/(.+?)(?:\?.*)?$/;
  const match = url.match(regex);
  if (match) {
    const bucket = match[1];
    const path = decodeURIComponent(match[2]);
    return { bucket, path };
  }
  return null;
}

/**
 * Check if a URL points to an object in Supabase Storage
 */
export function isSupabaseStorageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (!url.includes('/storage/v1/object/')) return false;
  const extracted = extractStoragePathAndBucket(url);
  return !!(extracted && extracted.bucket && extracted.path);
}

/**
 * Delete a single file from Supabase Storage.
 * Safely ignores external URLs, local asset paths, or placeholders.
 */
export async function deleteFileFromSupabase(urlOrPath, bucketParam = null) {
  if (!supabase) {
    return { success: false, error: 'Supabase client is not initialized.' };
  }

  let bucket = bucketParam;
  let path = urlOrPath;

  if (typeof urlOrPath === 'string' && (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://'))) {
    if (!isSupabaseStorageUrl(urlOrPath)) {
      return { success: true, skipped: true, reason: 'External or non-Supabase URL' };
    }
    const extracted = extractStoragePathAndBucket(urlOrPath);
    if (!extracted) {
      return { success: false, error: 'Could not extract bucket and path from URL' };
    }
    bucket = extracted.bucket;
    path = extracted.path;
  }

  if (!bucket || !path) {
    return { success: false, error: 'Invalid bucket or path for deletion' };
  }

  try {
    const { data, error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.error(`[SupabaseStorage] Error deleting ${path} from ${bucket}:`, error);
      return { success: false, error: error.message };
    }
    return { success: true, data, deletedPath: path, bucket };
  } catch (err) {
    console.error(`[SupabaseStorage] Exception deleting ${path} from ${bucket}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Batch delete files from Supabase Storage
 */
export async function deleteFilesFromSupabase(urlsOrPaths) {
  if (!urlsOrPaths || !Array.isArray(urlsOrPaths) || urlsOrPaths.length === 0) {
    return { success: true, count: 0 };
  }

  const byBucket = {};
  for (const item of urlsOrPaths) {
    if (!item) continue;
    if (typeof item === 'string' && (item.startsWith('http://') || item.startsWith('https://'))) {
      if (!isSupabaseStorageUrl(item)) continue;
      const extracted = extractStoragePathAndBucket(item);
      if (extracted) {
        if (!byBucket[extracted.bucket]) byBucket[extracted.bucket] = [];
        byBucket[extracted.bucket].push(extracted.path);
      }
    } else if (typeof item === 'object' && item.bucket && item.path) {
      if (!byBucket[item.bucket]) byBucket[item.bucket] = [];
      byBucket[item.bucket].push(item.path);
    }
  }

  const results = [];
  for (const [bucket, paths] of Object.entries(byBucket)) {
    if (paths.length > 0) {
      try {
        const { data, error } = await supabase.storage.from(bucket).remove(paths);
        if (error) {
          console.error(`[SupabaseStorage] Error batch deleting from ${bucket}:`, error);
        } else {
          results.push({ bucket, deleted: paths.length, data });
        }
      } catch (err) {
        console.error(`[SupabaseStorage] Exception batch deleting from ${bucket}:`, err);
      }
    }
  }

  return { success: true, results };
}

/**
 * Batch check whether an array of image URLs are still referenced in any database table.
 * If excluded is provided, records matching the excluded entity are excluded from consideration.
 * e.g. excluded = { model: 'Product', id: 'prod_123' } or { model: 'Testimonial', ids: ['id1', 'id2'] }
 *
 * Runs a single parallel batch query across all active tables using { in: validUrls },
 * reducing N * 10 sequential queries to 1 roundtrip.
 */
export async function getReferencedUrlsInDatabase(urls, excluded = null) {
  if (!urls || !Array.isArray(urls) || urls.length === 0 || !prisma) {
    return new Set();
  }

  const validUrls = Array.from(new Set(urls.filter(u => typeof u === 'string' && isSupabaseStorageUrl(u))));
  if (validUrls.length === 0) return new Set();

  const exModel = excluded?.model;
  const exId = excluded?.id;
  const exIds = Array.isArray(excluded?.ids) ? excluded.ids : (exId ? [exId] : []);

  const excludeFilter = (modelName) => {
    if (exModel === modelName && exIds.length > 0) {
      return { id: { notIn: exIds } };
    }
    return {};
  };

  const referencedUrls = new Set();

  try {
    const [
      prodMatches,
      catMatches,
      bannerMatches,
      benefitMatches,
      partnerMatches,
      galleryMatches,
      testimMatches,
      articleMatches,
      userMatches,
      adminMatches
    ] = await Promise.all([
      // 1. Product (image)
      prisma.product.findMany({
        where: {
          image: { in: validUrls },
          ...excludeFilter('Product')
        },
        select: { image: true }
      }).catch(() => []),

      // 2. Category (image, banner, heroImage, ogImage)
      prisma.category.findMany({
        where: {
          OR: [
            { image: { in: validUrls } },
            { banner: { in: validUrls } },
            { heroImage: { in: validUrls } },
            { ogImage: { in: validUrls } }
          ],
          ...excludeFilter('Category')
        },
        select: { image: true, banner: true, heroImage: true, ogImage: true }
      }).catch(() => []),

      // 3. HeroBanner (image, desktopImage, mobileImage)
      prisma.heroBanner.findMany({
        where: {
          OR: [
            { image: { in: validUrls } },
            { desktopImage: { in: validUrls } },
            { mobileImage: { in: validUrls } }
          ],
          ...excludeFilter('HeroBanner')
        },
        select: { image: true, desktopImage: true, mobileImage: true }
      }).catch(() => []),

      // 4. HeroBenefit (image)
      prisma.heroBenefit.findMany({
        where: {
          image: { in: validUrls },
          ...excludeFilter('HeroBenefit')
        },
        select: { image: true }
      }).catch(() => []),

      // 5. Partner (logo)
      prisma.partner.findMany({
        where: {
          logo: { in: validUrls },
          ...excludeFilter('Partner')
        },
        select: { logo: true }
      }).catch(() => []),

      // 6. Gallery (image)
      prisma.gallery.findMany({
        where: {
          image: { in: validUrls },
          ...excludeFilter('Gallery')
        },
        select: { image: true }
      }).catch(() => []),

      // 7. Testimonial (avatar)
      prisma.testimonial.findMany({
        where: {
          avatar: { in: validUrls },
          ...excludeFilter('Testimonial')
        },
        select: { avatar: true }
      }).catch(() => []),

      // 8. Article (image)
      prisma.article.findMany({
        where: {
          image: { in: validUrls },
          ...excludeFilter('Article')
        },
        select: { image: true }
      }).catch(() => []),

      // 9. User (avatar)
      prisma.user.findMany({
        where: {
          avatar: { in: validUrls },
          ...excludeFilter('User')
        },
        select: { avatar: true }
      }).catch(() => []),

      // 10. AdminProfile (avatar)
      prisma.adminProfile.findMany({
        where: {
          avatar: { in: validUrls },
          ...excludeFilter('AdminProfile')
        },
        select: { avatar: true }
      }).catch(() => [])
    ]);

    prodMatches.forEach(p => p.image && referencedUrls.add(p.image));
    catMatches.forEach(c => {
      if (c.image) referencedUrls.add(c.image);
      if (c.banner) referencedUrls.add(c.banner);
      if (c.heroImage) referencedUrls.add(c.heroImage);
      if (c.ogImage) referencedUrls.add(c.ogImage);
    });
    bannerMatches.forEach(b => {
      if (b.image) referencedUrls.add(b.image);
      if (b.desktopImage) referencedUrls.add(b.desktopImage);
      if (b.mobileImage) referencedUrls.add(b.mobileImage);
    });
    benefitMatches.forEach(b => b.image && referencedUrls.add(b.image));
    partnerMatches.forEach(p => p.logo && referencedUrls.add(p.logo));
    galleryMatches.forEach(g => g.image && referencedUrls.add(g.image));
    testimMatches.forEach(t => t.avatar && referencedUrls.add(t.avatar));
    articleMatches.forEach(a => a.image && referencedUrls.add(a.image));
    userMatches.forEach(u => u.avatar && referencedUrls.add(u.avatar));
    adminMatches.forEach(ap => ap.avatar && referencedUrls.add(ap.avatar));

    return referencedUrls;
  } catch (error) {
    console.error('[SupabaseStorage] Error batch checking referenced URLs in database:', error);
    // Safe fallback: treat all as referenced to protect active assets
    return new Set(validUrls);
  }
}

/**
 * Check whether an image URL is still referenced in any database table.
 * If excluded is provided, that specific entity record is excluded.
 * e.g. excluded = { model: 'Product', id: 'prod_123' }
 */
export async function isFileStillReferencedInDatabase(url, excluded = null) {
  if (!url || typeof url !== 'string' || !prisma) return false;
  if (!isSupabaseStorageUrl(url)) return false;

  try {
    const referencedSet = await getReferencedUrlsInDatabase([url], excluded);
    return referencedSet.has(url);
  } catch (error) {
    console.error('[SupabaseStorage] Error checking database reference for URL:', error);
    return true;
  }
}

/**
 * Automatically cleans up an old image if it is being replaced with a new image.
 * Guarantees shared image protection.
 * Runs non-blocking by default so admin responses are not delayed by storage latency.
 */
export async function cleanupOldImageIfReplaced(oldUrl, newUrl, excluded = null, options = {}) {
  if (!oldUrl || typeof oldUrl !== 'string') return { skipped: true, reason: 'No old URL' };
  if (oldUrl === newUrl) return { skipped: true, reason: 'URL unchanged' };
  if (!isSupabaseStorageUrl(oldUrl)) return { skipped: true, reason: 'Old URL not in Supabase Storage' };

  const isNonBlocking = options.nonBlocking !== false;

  const performCleanup = async () => {
    try {
      const referencedSet = await getReferencedUrlsInDatabase([oldUrl], excluded);
      if (referencedSet.has(oldUrl)) {
        return { skipped: true, reason: 'File still referenced by other record (shared protection)' };
      }
      return await deleteFileFromSupabase(oldUrl);
    } catch (error) {
      console.error('[SupabaseStorage] cleanupOldImageIfReplaced error:', error);
      return { success: false, error: error.message };
    }
  };

  if (isNonBlocking) {
    // Dispatch in background without blocking the HTTP response
    Promise.resolve().then(() => performCleanup()).catch(err => {
      console.error('[SupabaseStorage] Background cleanupOldImageIfReplaced exception:', err);
    });
    return { success: true, queued: true, oldUrl };
  }

  return await performCleanup();
}

/**
 * Automatically cleans up image(s) when an entity record is deleted.
 * Guarantees shared image protection and batches database checks + storage deletes.
 * Runs non-blocking by default so admin responses are not delayed.
 */
export async function cleanupDeletedEntityImages(urls, excluded = null, options = {}) {
  if (!urls) return { skipped: true };
  const list = Array.isArray(urls) ? urls : [urls];
  const validUrls = list
    .map(item => (typeof item === 'string' ? item : item?.url))
    .filter(u => u && typeof u === 'string' && isSupabaseStorageUrl(u));

  if (validUrls.length === 0) {
    return { skipped: true, reason: 'No valid Supabase Storage URLs to delete' };
  }

  const isNonBlocking = options.nonBlocking !== false;

  const performBatchCleanup = async () => {
    try {
      // 1. Batch check which URLs are still referenced elsewhere in the database
      const referencedSet = await getReferencedUrlsInDatabase(validUrls, excluded);

      // 2. Filter unreferenced URLs that are safe to delete
      const unreferencedUrls = validUrls.filter(u => !referencedSet.has(u));

      if (unreferencedUrls.length === 0) {
        return { success: true, count: 0, reason: 'All images are still referenced by other records' };
      }

      // 3. Batch delete unreferenced files from Supabase Storage
      const delResult = await deleteFilesFromSupabase(unreferencedUrls);
      return { success: true, count: unreferencedUrls.length, details: delResult };
    } catch (error) {
      console.error('[SupabaseStorage] cleanupDeletedEntityImages batch error:', error);
      return { success: false, error: error.message };
    }
  };

  if (isNonBlocking) {
    // Dispatch in background without blocking the HTTP response
    Promise.resolve().then(() => performBatchCleanup()).catch(err => {
      console.error('[SupabaseStorage] Background cleanupDeletedEntityImages exception:', err);
    });
    return { success: true, queued: true, count: validUrls.length };
  }

  return await performBatchCleanup();
}

/**
 * Audit orphan files in Supabase Storage across all buckets.
 */
export async function auditStorageOrphanFiles() {
  if (!supabase || !prisma) {
    throw new Error('Supabase client or Prisma is not available');
  }

  // 1. Gather all image URLs from database
  const allDbUrls = new Set();

  const [
    products,
    categories,
    heroBanners,
    heroBenefits,
    partners,
    galleries,
    testimonials,
    articles,
    users,
    adminProfiles
  ] = await Promise.all([
    prisma.product.findMany({ select: { image: true } }),
    prisma.category.findMany({ select: { image: true, banner: true, heroImage: true, ogImage: true } }),
    prisma.heroBanner.findMany({ select: { image: true, desktopImage: true, mobileImage: true } }),
    prisma.heroBenefit.findMany({ select: { image: true } }),
    prisma.partner.findMany({ select: { logo: true } }),
    prisma.gallery.findMany({ select: { image: true } }),
    prisma.testimonial.findMany({ select: { avatar: true } }),
    prisma.article.findMany({ select: { image: true } }),
    prisma.user.findMany({ select: { avatar: true } }),
    prisma.adminProfile.findMany({ select: { avatar: true } })
  ]);

  products.forEach(p => p.image && allDbUrls.add(p.image));
  categories.forEach(c => {
    if (c.image) allDbUrls.add(c.image);
    if (c.banner) allDbUrls.add(c.banner);
    if (c.heroImage) allDbUrls.add(c.heroImage);
    if (c.ogImage) allDbUrls.add(c.ogImage);
  });
  heroBanners.forEach(hb => {
    if (hb.image) allDbUrls.add(hb.image);
    if (hb.desktopImage) allDbUrls.add(hb.desktopImage);
    if (hb.mobileImage) allDbUrls.add(hb.mobileImage);
  });
  heroBenefits.forEach(hb => hb.image && allDbUrls.add(hb.image));
  partners.forEach(p => p.logo && allDbUrls.add(p.logo));
  galleries.forEach(g => g.image && allDbUrls.add(g.image));
  testimonials.forEach(t => t.avatar && allDbUrls.add(t.avatar));
  articles.forEach(a => a.image && allDbUrls.add(a.image));
  users.forEach(u => u.avatar && allDbUrls.add(u.avatar));
  adminProfiles.forEach(ap => ap.avatar && allDbUrls.add(ap.avatar));

  const dbPathsByBucket = {};
  for (const url of allDbUrls) {
    if (isSupabaseStorageUrl(url)) {
      const extracted = extractStoragePathAndBucket(url);
      if (extracted) {
        if (!dbPathsByBucket[extracted.bucket]) dbPathsByBucket[extracted.bucket] = new Set();
        dbPathsByBucket[extracted.bucket].add(extracted.path);
      }
    }
  }

  // 2. Scan each storage bucket
  const auditReport = {
    totalStorageFiles: 0,
    referencedFilesCount: 0,
    orphanFilesCount: 0,
    skippedFilesCount: 0,
    buckets: {},
    orphanFiles: []
  };

  for (const bucketName of VALID_BUCKETS) {
    try {
      const { data: fileList, error } = await supabase.storage.from(bucketName).list('', { limit: 1000 });
      if (error) {
        auditReport.buckets[bucketName] = { error: error.message };
        continue;
      }

      const dbPaths = dbPathsByBucket[bucketName] || new Set();
      let bucketReferenced = 0;
      let bucketOrphan = 0;
      let bucketSkipped = 0;

      for (const file of fileList || []) {
        if (!file.name || file.name === '.emptyFolderPlaceholder') {
          bucketSkipped++;
          continue;
        }

        auditReport.totalStorageFiles++;

        if (dbPaths.has(file.name)) {
          bucketReferenced++;
          auditReport.referencedFilesCount++;
        } else {
          bucketOrphan++;
          auditReport.orphanFilesCount++;
          auditReport.orphanFiles.push({
            bucket: bucketName,
            name: file.name,
            size: file.metadata?.size,
            createdAt: file.created_at
          });
        }
      }

      auditReport.buckets[bucketName] = {
        totalFiles: (fileList || []).length,
        referenced: bucketReferenced,
        orphan: bucketOrphan,
        skipped: bucketSkipped
      };
    } catch (err) {
      auditReport.buckets[bucketName] = { error: err.message };
    }
  }

  auditReport.skippedFilesCount = Object.values(auditReport.buckets)
    .reduce((sum, b) => sum + (b.skipped || 0), 0);

  return auditReport;
}

/**
 * Upload base64 string to Supabase Storage and return public URL.
 */
export async function uploadBase64ToSupabase(base64Data, filename = 'image.jpg', bucketName = 'tanico-public') {
  if (!supabase) {
    throw new Error('Supabase client is not initialized. Please check environment variables.');
  }

  if (!base64Data || typeof base64Data !== 'string') {
    return { success: false, error: 'Invalid base64 data' };
  }

  const bucket = VALID_BUCKETS.has(bucketName) ? bucketName : 'tanico-public';

  try {
    let mimeType = 'image/jpeg';
    let base64Body = base64Data;

    if (base64Data.startsWith('data:')) {
      const parts = base64Data.split(';base64,');
      const mimePart = parts[0].replace('data:', '');
      if (mimePart) mimeType = mimePart;
      base64Body = parts[1] || '';
    }

    const buffer = Buffer.from(base64Body, 'base64');

    // Clean up filename
    const cleanName = filename.toLowerCase().replace(/[^a-z0-9._-]/g, '_');
    const extMatch = mimeType.match(/image\/(png|jpeg|jpg|webp|gif|svg\+xml)/);
    let ext = 'jpg';
    if (extMatch) {
      ext = extMatch[1] === 'svg+xml' ? 'svg' : extMatch[1];
    }
    
    let targetFileName = cleanName;
    if (!targetFileName.endsWith(`.${ext}`) && !targetFileName.endsWith('.jpg') && !targetFileName.endsWith('.jpeg') && !targetFileName.endsWith('.png') && !targetFileName.endsWith('.webp')) {
      targetFileName = `${targetFileName}.${ext}`;
    }

    // Add unique timestamp prefix to prevent overwrite conflicts
    const timestamp = Date.now();
    const filePath = `${timestamp}_${targetFileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (error) {
      console.error(`[SupabaseStorage] Upload error for bucket '${bucket}':`, error);
      return { success: false, error: error.message };
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    const pubUrl = publicUrlData?.publicUrl || '';
    
    return {
      success: true,
      url: pubUrl,
      publicUrl: pubUrl,
      path: filePath,
      bucket
    };
  } catch (err) {
    console.error('[SupabaseStorage] Upload exception:', err);
    return { success: false, error: err.message || 'Error uploading file' };
  }
}

/**
 * Upload raw File or Buffer to Supabase Storage
 */
export async function uploadBufferToSupabase(buffer, mimeType = 'image/jpeg', filename = 'file.jpg', bucketName = 'tanico-public') {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }

  const bucket = VALID_BUCKETS.has(bucketName) ? bucketName : 'tanico-public';

  try {
    const cleanName = filename.toLowerCase().replace(/[^a-z0-9._-]/g, '_');
    const timestamp = Date.now();
    const filePath = `${timestamp}_${cleanName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (error) {
      return { success: false, error: error.message };
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    const pubUrl = publicUrlData?.publicUrl || '';

    return {
      success: true,
      url: pubUrl,
      publicUrl: pubUrl,
      path: filePath,
      bucket
    };
  } catch (err) {
    return { success: false, error: err.message || 'Error uploading buffer' };
  }
}

export async function ensureSupabaseImageUrl(imageVal, defaultFilename = 'image.jpg', bucket = 'tanico-public') {
  if (!imageVal || typeof imageVal !== 'string') return imageVal || '';
  if (imageVal.startsWith('data:image')) {
    try {
      const res = await uploadBase64ToSupabase(imageVal, defaultFilename, bucket);
      if (res.success && res.url) {
        return res.url;
      }
    } catch (err) {
      console.warn('[SupabaseStorage] ensureSupabaseImageUrl fallback:', err.message);
    }
  }
  return imageVal;
}

export async function cleanAllBase64InObject(obj, defaultBucket = 'tanico-public') {
  if (!obj) return obj;
  if (typeof obj === 'string') {
    if (obj.startsWith('data:image')) {
      return await ensureSupabaseImageUrl(obj, 'cms_image.jpg', defaultBucket);
    }
    const trimmed = obj.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          const cleaned = await cleanAllBase64InObject(parsed, defaultBucket);
          return JSON.stringify(cleaned);
        }
      } catch (e) {
        // Not valid JSON, return original string
      }
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return await Promise.all(obj.map(item => cleanAllBase64InObject(item, defaultBucket)));
  }
  if (typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = await cleanAllBase64InObject(value, defaultBucket);
    }
    return cleaned;
  }
  return obj;
}

