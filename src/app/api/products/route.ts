import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateAdmin, slugify } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute(`
      SELECT p.*, c.name_ar as category_name_ar 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.sort_order ASC, p.created_at DESC
    `);
    return NextResponse.json(result.rows);
  } catch {
    return NextResponse.json({ error: 'خطأ في جلب المنتجات' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = authenticateAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const data = await req.json();
    const db = await getDb();
    const id = uuidv4();
    const slug = slugify(data.name || data.name_ar || 'product');

    const existingSlug = await db.execute({ sql: 'SELECT id FROM products WHERE slug = ?', args: [slug] });
    const finalSlug = existingSlug.rows.length > 0 ? `${slug}-${Date.now().toString(36)}` : slug;

    await db.execute({
      sql: `INSERT INTO products (id, name, name_ar, slug, description, description_ar, price, compare_price,
        category_id, is_featured, is_active, is_new, stock, sku, sizes, colors, main_image, images,
        landing_title, landing_title_ar, landing_subtitle, landing_subtitle_ar,
        landing_features, landing_features_ar, landing_testimonials, landing_cta, landing_cta_ar,
        landing_gallery, landing_video_url, landing_offer_badge, landing_offer_badge_ar,
        landing_faq, landing_faq_ar, landing_extra_sections, landing_offers, landing_detail_images,
        seo_title, seo_description, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, data.name || '', data.name_ar || '', finalSlug,
        data.description || '', data.description_ar || '',
        data.price || 0, data.compare_price || null,
        data.category_id || null, data.is_featured ? 1 : 0, data.is_active !== false ? 1 : 0,
        data.is_new ? 1 : 0, data.stock || 0, data.sku || null,
        data.sizes || '[]', data.colors || '[]',
        data.main_image || null, data.images || '[]',
        data.landing_title || '', data.landing_title_ar || '',
        data.landing_subtitle || '', data.landing_subtitle_ar || '',
        data.landing_features || '[]', data.landing_features_ar || '[]',
        data.landing_testimonials || '[]',
        data.landing_cta || '', data.landing_cta_ar || '',
        data.landing_gallery || '[]', data.landing_video_url || '',
        data.landing_offer_badge || '', data.landing_offer_badge_ar || '',
        data.landing_faq || '[]', data.landing_faq_ar || '[]',
        data.landing_extra_sections || '[]',
        data.landing_offers || '[]',
        data.landing_detail_images || '[]',
        data.seo_title || '', data.seo_description || '',
        data.sort_order || 0,
      ],
    });

    const product = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [id] });
    return NextResponse.json(product.rows[0], { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'خطأ في إنشاء المنتج' }, { status: 500 });
  }
}
