import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateAdmin } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute('SELECT * FROM offers ORDER BY created_at DESC');
    return NextResponse.json(result.rows);
  } catch {
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = authenticateAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const data = await req.json();
    const db = await getDb();
    const id = uuidv4();

    await db.execute({
      sql: `INSERT INTO offers (id, title, title_ar, description, description_ar, discount_type, discount_value, 
        banner_image, product_ids, is_active, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, data.title || '', data.title_ar || '', data.description || '', data.description_ar || '',
        data.discount_type || 'percentage', data.discount_value || 0,
        data.banner_image || null, data.product_ids || '[]',
        data.is_active !== false ? 1 : 0, data.start_date || null, data.end_date || null,
      ],
    });

    const offer = await db.execute({ sql: 'SELECT * FROM offers WHERE id = ?', args: [id] });
    return NextResponse.json(offer.rows[0], { status: 201 });
  } catch {
    return NextResponse.json({ error: 'خطأ في إنشاء العرض' }, { status: 500 });
  }
}
