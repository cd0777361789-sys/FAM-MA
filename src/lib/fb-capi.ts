import fetch from 'node-fetch';
import { getDb } from './db';

export async function sendFacebookPurchaseEvent({
  eventId,
  eventTime,
  value,
  currency,
  customer,
  orderNumber,
}: {
  eventId: string;
  eventTime: number;
  value: number;
  currency: string;
  customer: { name: string; phone: string; city: string; address: string };
  orderNumber: string;
}) {
  // جلب التوكن من إعدادات الموقع
  const db = await getDb();
  const result = await db.execute({ sql: 'SELECT value FROM site_settings WHERE key = ?', args: ['fb_capi_token'] });
  const token = result.rows[0]?.value;
  if (!token) return;

  // إعداد بيانات الحدث
  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: eventTime,
        event_id: eventId,
        action_source: 'website',
        event_source_url: '',
        user_data: {
          // يمكن تحسين التشفير لاحقاً
          fn: customer.name,
          ph: customer.phone,
          ct: customer.city,
          st: '',
          country: 'MA',
        },
        custom_data: {
          currency,
          value,
          order_number: orderNumber,
        },
      },
    ],
    access_token: token,
  };

  // إرسال الطلب إلى Facebook Conversion API
  await fetch('https://graph.facebook.com/v19.0/1594179298355815/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
