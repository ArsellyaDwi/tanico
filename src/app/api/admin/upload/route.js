import { NextResponse } from 'next/server';
import { uploadBase64ToSupabase, uploadBufferToSupabase } from '@/lib/supabaseStorage';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      const bucket = formData.get('bucket') || 'tanico-public';
      const customFilename = formData.get('filename') || file?.name || 'upload.jpg';

      if (!file) {
        return NextResponse.json({ error: 'File tidak ditemukan dalam request form-data' }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = file.type || 'image/jpeg';

      const result = await uploadBufferToSupabase(buffer, mimeType, customFilename, bucket);

      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Gagal mengupload file ke Storage' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        url: result.url || result.publicUrl,
        publicUrl: result.url || result.publicUrl,
        path: result.path,
        bucket: result.bucket
      });
    } else {
      const body = await request.json();
      const { base64, filename, bucket } = body;

      if (!base64) {
        return NextResponse.json({ error: 'Data base64 tidak ditemukan dalam payload' }, { status: 400 });
      }

      const result = await uploadBase64ToSupabase(base64, filename || 'image.jpg', bucket || 'tanico-public');

      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Gagal mengupload base64 ke Storage' }, { status: 500 });
      }

      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error in POST /api/admin/upload:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
