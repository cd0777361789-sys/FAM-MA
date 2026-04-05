import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateAdmin } from '@/lib/utils';

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute('SELECT * FROM site_settings');
    const settingsObj: Record<string, string> = {};
    for (const s of result.rows) {
      settingsObj[s.key as string] = s.value as string;
    }
    return NextResponse.json(settingsObj);
  } catch {
    return NextResponse.json({ error: 'خطأ في جلب الإعدادات' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = authenticateAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const data = await req.json();
    const db = await getDb();

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        await db.execute({
          sql: 'INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)',
          args: [key, value],
        });
      }
    }

    return NextResponse.json({ message: 'تم تحديث الإعدادات' });
  } catch {
    return NextResponse.json({ error: 'خطأ في تحديث الإعدادات' }, { status: 500 });
  }
}
