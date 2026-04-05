import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateAdmin } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC');
    return NextResponse.json(result.rows);
  } catch {
    return NextResponse.json({ error: 'خطأ في جلب الفئات' }, { status: 500 });
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
      sql: `INSERT INTO categories (id, name, name_ar, slug, image, description, description_ar, sort_order, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, data.name || '', data.name_ar || '', data.slug || data.name?.toLowerCase().replace(/\s+/g, '-') || id,
        data.image || null, data.description || '', data.description_ar || '',
        data.sort_order || 0, data.is_active !== false ? 1 : 0,
      ],
    });

    const category = await db.execute({ sql: 'SELECT * FROM categories WHERE id = ?', args: [id] });
    return NextResponse.json(category.rows[0], { status: 201 });
  } catch {
    return NextResponse.json({ error: 'خطأ في إنشاء الفئة' }, { status: 500 });
  }
}
