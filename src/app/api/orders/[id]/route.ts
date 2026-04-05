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

    const allowedStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];
    if (data.status && !allowedStatuses.includes(data.status)) {
      return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 });
    }

    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (data.status) { fields.push('status = ?'); values.push(data.status); }
    if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await db.execute({ sql: `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, args: values });
    const order = await db.execute({ sql: 'SELECT * FROM orders WHERE id = ?', args: [id] });
    return NextResponse.json(order.rows[0]);
  } catch {
    return NextResponse.json({ error: 'خطأ في تحديث الطلب' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const db = await getDb();
    await db.execute({ sql: 'DELETE FROM orders WHERE id = ?', args: [id] });
    return NextResponse.json({ message: 'تم حذف الطلب' });
  } catch {
    return NextResponse.json({ error: 'خطأ في حذف الطلب' }, { status: 500 });
  }
}
