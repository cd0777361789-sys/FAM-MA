import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateAdmin } from '@/lib/utils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const result = await db.execute({
      sql: `SELECT p.*, c.name_ar as category_name_ar 
            FROM products p LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.id = ? OR p.slug = ?`,
      args: [id, id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'المنتج غير موجود' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch {
    return NextResponse.json({ error: 'خطأ في جلب المنتج' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const data = await req.json();
    const db = await getDb();

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    const allowedFields = [
      'name', 'name_ar', 'description', 'description_ar', 'price', 'compare_price',
      'category_id', 'is_featured', 'is_active', 'is_new', 'stock', 'sku',
      'sizes', 'colors', 'main_image', 'images',
      'landing_title', 'landing_title_ar', 'landing_subtitle', 'landing_subtitle_ar',
      'landing_features', 'landing_features_ar', 'landing_testimonials',
      'landing_cta', 'landing_cta_ar',
      'landing_gallery', 'landing_video_url', 'landing_offer_badge', 'landing_offer_badge_ar',
      'landing_faq', 'landing_faq_ar', 'landing_extra_sections', 'landing_offers',
      'seo_title', 'seo_description', 'sort_order',
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        if (['is_featured', 'is_active', 'is_new'].includes(field)) {
          values.push(data[field] ? 1 : 0);
        } else {
          values.push(data[field]);
        }
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للتحديث' }, { status: 400 });
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await db.execute({ sql: `UPDATE products SET ${fields.join(', ')} WHERE id = ?`, args: values });
    const product = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [id] });
    return NextResponse.json(product.rows[0]);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'خطأ في تحديث المنتج' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const db = await getDb();
    await db.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [id] });
    return NextResponse.json({ message: 'تم حذف المنتج' });
  } catch {
    return NextResponse.json({ error: 'خطأ في حذف المنتج' }, { status: 500 });
  }
}
