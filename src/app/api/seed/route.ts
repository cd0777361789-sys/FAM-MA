import { NextResponse } from 'next/server';
import { seed } from '@/lib/seed';

export async function GET() {
  try {
    await seed();
    return NextResponse.json({ message: 'Database seeded successfully' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Seed failed', details: String(e) }, { status: 500 });
  }
}
