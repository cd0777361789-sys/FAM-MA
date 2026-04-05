import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { comparePassword, generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.execute({ sql: 'SELECT * FROM admins WHERE username = ?', args: [username] });
    const admin = result.rows[0] as unknown as { id: string; username: string; password: string } | undefined;

    if (!admin || !comparePassword(password, admin.password as string)) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
    }

    const token = generateToken({ id: admin.id as string, username: admin.username as string });
    return NextResponse.json({ token, username: admin.username });
  } catch {
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
