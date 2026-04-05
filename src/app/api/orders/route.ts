import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateAdmin, generateOrderNumber } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  const auth = authenticateAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM orders';
    let countQuery = 'SELECT COUNT(*) as count FROM orders';
    const args: (string | number)[] = [];
    const countArgs: string[] = [];

    if (status && status !== 'all') {
      query += ' WHERE status = ?';
      countQuery += ' WHERE status = ?';
      args.push(status);
      countArgs.push(status);
    }

    const totalResult = await db.execute({ sql: countQuery, args: countArgs });
    const total = Number((totalResult.rows[0] as unknown as { count: number }).count);

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    args.push(limit, offset);

    const result = await db.execute({ sql: query, args });
    return NextResponse.json({ orders: result.rows, total, page, limit, pages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ error: 'خطأ في جلب الطلبات' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.customer_name || !data.customer_phone || !data.customer_city || !data.customer_address) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    const phoneRegex = /^(\+212|0)([ \-]?)([5-7]\d{8})$/;
    if (!phoneRegex.test(data.customer_phone.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'رقم الهاتف غير صالح' }, { status: 400 });
    }

    const db = await getDb();
    const id = uuidv4();
    const orderNumber = generateOrderNumber();
    const quantity = data.quantity || 1;
    const unitPrice = data.unit_price || 0;
    const totalPrice = unitPrice * quantity;

    await db.execute({
      sql: `INSERT INTO orders (id, order_number, customer_name, customer_phone, customer_city, 
        customer_address, product_id, product_name, product_variant, quantity, unit_price, 
        total_price, status, notes, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      args: [
        id, orderNumber, data.customer_name, data.customer_phone.replace(/\s/g, ''),
        data.customer_city, data.customer_address,
        data.product_id || null, data.product_name || '',
        data.product_variant || '', quantity, unitPrice, totalPrice,
        data.notes || '', data.source || 'landing',
      ],
    });

    return NextResponse.json({ order_number: orderNumber, message: 'تم تأكيد طلبك بنجاح! سنتواصل معك قريباً' }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'خطأ في إنشاء الطلب' }, { status: 500 });
  }
}
