import { logger } from '@/utils/logger';

export async function uploadFileToSupabase(file, folder = 'general') {
  try {
    if (!file) return null;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Upload gagal');
    }

    const data = await response.json();
    return data.url || data.path;
  } catch (error) {
    logger.error('uploadFileToSupabase error:', error);
    throw error;
  }
}
