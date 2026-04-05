import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateAdmin } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const auth = authenticateAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const db = await getDb();

    const [totalR, pendingR, confirmedR, deliveredR, revenueR, productsR, recentR, topR] = await Promise.all([
      db.execute('SELECT COUNT(*) as count FROM orders'),
      db.execute("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'"),
      db.execute("SELECT COUNT(*) as count FROM orders WHERE status = 'confirmed'"),
      db.execute("SELECT COUNT(*) as count FROM orders WHERE status = 'delivered'"),
      db.execute("SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE status IN ('confirmed', 'shipped', 'delivered')"),
      db.execute('SELECT COUNT(*) as count FROM products WHERE is_active = 1'),
      db.execute('SELECT * FROM orders ORDER BY created_at DESC LIMIT 10'),
      db.execute('SELECT product_name, COUNT(*) as order_count, SUM(total_price) as revenue FROM orders GROUP BY product_name ORDER BY order_count DESC LIMIT 5'),
    ]);

    return NextResponse.json({
      stats: {
        totalOrders: totalR.rows[0].count,
        pendingOrders: pendingR.rows[0].count,
        confirmedOrders: confirmedR.rows[0].count,
        deliveredOrders: deliveredR.rows[0].count,
        totalRevenue: revenueR.rows[0].total,
        totalProducts: productsR.rows[0].count,
      },
      recentOrders: recentR.rows,
      topProducts: topR.rows,
    });
  } catch {
    return NextResponse.json({ error: 'خطأ في جلب الإحصائيات' }, { status: 500 });
  }
}
