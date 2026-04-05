import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromHeader } from './auth';

export function authenticateAdmin(req: NextRequest): { id: string; username: string } | NextResponse {
  const token = getTokenFromHeader(req.headers.get('authorization'));
  if (!token) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 });
  }
  return decoded;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || `product-${Date.now()}`;
}

export function generateOrderNumber(): string {
  const prefix = 'FAM';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function formatPrice(price: number): string {
  return `${price.toFixed(2)} د.م`;
}

export const MOROCCAN_CITIES = [
  'الدار البيضاء', 'الرباط', 'فاس', 'مراكش', 'طنجة', 'مكناس',
  'أكادير', 'وجدة', 'القنيطرة', 'تطوان', 'آسفي', 'الجديدة',
  'بني ملال', 'خريبكة', 'الناظور', 'سلا', 'تمارة', 'المحمدية',
  'العيون', 'خنيفرة', 'سطات', 'تازة', 'الراشيدية', 'ورزازات',
  'الصويرة', 'إفران', 'شفشاون', 'الحسيمة', 'طاطا', 'تنغير',
  'زاكورة', 'ميدلت', 'فكيك', 'جرادة', 'تاوريرت', 'بركان',
  'أزرو', 'قلعة السراغنة', 'اليوسفية', 'سيدي بنور'
];
