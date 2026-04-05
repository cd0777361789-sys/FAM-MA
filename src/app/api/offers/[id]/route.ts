import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateAdmin } from '@/lib/utils';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const data = await req.json();
    const db = await getDb();

    await db.execute({
      sql: `UPDATE offers SET title = ?, title_ar = ?, description = ?, description_ar = ?,
        discount_type = ?, discount_value = ?, banner_image = ?, product_ids = ?,
        is_active = ?, start_date = ?, end_date = ? WHERE id = ?`,
      args: [
        data.title || '', data.title_ar || '', data.description || '', data.description_ar || '',
        data.discount_type || 'percentage', data.discount_value || 0,
        data.banner_image || null, data.product_ids || '[]',
        data.is_active ? 1 : 0, data.start_date || null, data.end_date || null, id,
      ],
    });

    const offer = await db.execute({ sql: 'SELECT * FROM offers WHERE id = ?', args: [id] });
    return NextResponse.json(offer.rows[0]);
  } catch {
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const db = await getDb();
    await db.execute({ sql: 'DELETE FROM offers WHERE id = ?', args: [id] });
    return NextResponse.json({ message: 'تم الحذف' });
  } catch {
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}
