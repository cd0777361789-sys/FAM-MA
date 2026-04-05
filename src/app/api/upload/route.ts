import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/utils';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const auth = authenticateAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'لم يتم رفع ملف' }, { status: 400 });
    }

    const isImage = IMAGE_TYPES.includes(file.type) || file.name.match(/\.(jpg|jpeg|png|webp|gif|heic|heif)$/i) !== null;
    const isVideo = VIDEO_TYPES.includes(file.type) || file.name.match(/\.(mp4|webm|mov)$/i) !== null;

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: 'نوع الملف غير مدعوم. الأنواع المدعومة: JPEG, PNG, WebP, GIF, HEIC, MP4, WebM' }, { status: 400 });
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      const limitMB = maxSize / (1024 * 1024);
      return NextResponse.json({ error: `حجم الملف كبير جداً (الحد الأقصى ${limitMB} ميغابايت)` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const resourceType = isVideo ? 'video' : 'image';

    const result = await new Promise<{ secure_url: string; resource_type: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'fam-ma', resource_type: resourceType },
        (error, result) => {
          if (error || !result) reject(error || new Error('Upload failed'));
          else resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({
      url: result.secure_url,
      resource_type: result.resource_type,
      filename: file.name,
    });
  } catch (e) {
    console.error('Upload error:', e);
    const errObj = e as { message?: string; http_code?: number };
    const message = errObj?.message || 'خطأ غير معروف';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
