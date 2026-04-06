'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';

const CITIES = [
  'الدار البيضاء','الرباط','فاس','مراكش','طنجة','مكناس','أكادير','وجدة','القنيطرة','تطوان',
  'آسفي','الجديدة','بني ملال','خريبكة','الناظور','سلا','تمارة','المحمدية','العيون','خنيفرة',
  'سطات','تازة','الراشيدية','ورزازات','الصويرة','إفران','شفشاون','الحسيمة','تنغير','زاكورة',
];

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_city: '', customer_address: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [orderError, setOrderError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || items.length === 0) return;
    setOrderError('');
    setSubmitting(true);
    try {
      const cartItems = items.map(i => ({
        product_id: i.id,
        product_name: i.name_ar,
        product_variant: [i.selectedSize, i.selectedColor].filter(Boolean).join(' - '),
        quantity: i.quantity,
        unit_price: i.price,
      }));
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: cartItems,
          product_id: items[0]?.id,
          product_name: items.map(i => i.name_ar).join(' + '),
          product_variant: items.map(i => [i.selectedSize, i.selectedColor].filter(Boolean).join(' - ')).filter(Boolean).join(' | '),
          quantity: totalItems,
          unit_price: totalPrice / totalItems,
          source: 'cart',
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setOrderSuccess(d.order_number);
        clearCart();
      } else {
        setOrderError(d.error || 'حدث خطأ');
      }
    } catch {
      setOrderError('خطأ في الاتصال');
    } finally {
      setSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#FDF8F0' }}>
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #006233, #00A651)' }}>
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 font-amiri" style={{ color: '#2C1810' }}>تم تأكيد طلبك بنجاح!</h1>
          <p className="text-sm mb-1" style={{ color: '#6B5D52' }}>رقم الطلب</p>
          <p className="text-lg font-bold mb-4" style={{ color: '#006233' }}>{orderSuccess}</p>
          <p className="text-sm mb-6" style={{ color: '#A67B5B' }}>سنتواصل معك قريباً لتأكيد الطلب والتوصيل</p>
          <Link href="/" className="inline-block px-8 py-3 rounded-2xl text-sm font-bold text-white" style={{ backgroundColor: '#8B5E3C' }}>
            العودة للمتجر
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDF8F0' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 glass shadow-sm border-b" style={{ borderColor: '#E8C9A020' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 flex items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #8B5E3C, #C9A94E)' }}>
              <span className="text-white font-bold text-base">F</span>
            </div>
            <div className="leading-tight">
              <h1 className="text-lg font-extrabold tracking-tight" style={{ color: '#6B4226' }}>FAM.MA</h1>
            </div>
          </Link>
          <Link href="/" className="text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#F5EDE0] transition" style={{ color: '#8B5E3C' }}>
            ← متابعة التسوق
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold font-amiri mb-6 text-center" style={{ color: '#2C1810' }}>
          🛒 سلة المشتريات {totalItems > 0 && <span className="text-base font-semibold" style={{ color: '#A67B5B' }}>({totalItems} منتج)</span>}
        </h2>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-lg font-semibold mb-2" style={{ color: '#4A3228' }}>سلتك فارغة</p>
            <p className="text-sm mb-6" style={{ color: '#A67B5B' }}>أضيفي منتجات من المتجر لتبدئي التسوق</p>
            <Link href="/" className="inline-block px-8 py-3 rounded-2xl text-sm font-bold text-white" style={{ backgroundColor: '#8B5E3C' }}>
              تصفحي المنتجات
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-3 space-y-3">
              {items.map((item) => {
                const key = `${item.id}_${item.selectedSize || ''}_${item.selectedColor || ''}`;
                return (
                  <div key={key} className="flex gap-3 p-3 rounded-2xl bg-white shadow-sm" style={{ border: '1px solid #F5EDE0' }}>
                    <Link href={`/product/${item.slug}`} className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: '#F5EDE0' }}>
                      {item.main_image ? (
                        <img src={item.main_image} alt={item.name_ar} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><span className="text-2xl opacity-30">✦</span></div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.slug}`} className="font-bold text-sm leading-snug line-clamp-2 hover:underline" style={{ color: '#2C1810' }}>{item.name_ar}</Link>
                      {(item.selectedSize || item.selectedColor) && (
                        <p className="text-[11px] mt-0.5" style={{ color: '#A67B5B' }}>
                          {[item.selectedSize, item.selectedColor].filter(Boolean).join(' — ')}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-extrabold" style={{ color: '#C41E3A' }}>{item.price * item.quantity} <span className="text-xs">د.م</span></span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedSize, item.selectedColor)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition hover:bg-[#F5EDE0]" style={{ border: '1px solid #E8C9A0', color: '#8B5E3C' }}>−</button>
                          <span className="w-8 text-center text-sm font-bold" style={{ color: '#2C1810' }}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedSize, item.selectedColor)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition hover:bg-[#F5EDE0]" style={{ border: '1px solid #E8C9A0', color: '#8B5E3C' }}>+</button>
                          <button onClick={() => removeItem(item.id, item.selectedSize, item.selectedColor)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition hover:bg-red-50 mr-1" style={{ color: '#C41E3A' }}>✕</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <button onClick={clearCart} className="text-xs font-semibold px-3 py-1.5 rounded-lg transition hover:bg-red-50" style={{ color: '#C41E3A' }}>
                🗑️ إفراغ السلة
              </button>
            </div>

            {/* Order Summary + Form */}
            <div className="lg:col-span-2">
              <div className="sticky top-20 space-y-4">
                {/* Summary */}
                <div className="p-4 rounded-2xl bg-white shadow-sm" style={{ border: '1px solid #F5EDE0' }}>
                  <h3 className="font-bold text-sm mb-3" style={{ color: '#2C1810' }}>ملخص الطلب</h3>
                  <div className="space-y-2 text-sm">
                    {items.map(i => (
                      <div key={`${i.id}_${i.selectedSize}_${i.selectedColor}`} className="flex justify-between">
                        <span className="truncate ml-2" style={{ color: '#6B5D52' }}>{i.name_ar} ×{i.quantity}</span>
                        <span className="font-bold flex-shrink-0" style={{ color: '#2C1810' }}>{i.price * i.quantity} د.م</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs pt-1" style={{ color: '#A67B5B' }}>
                      <span>🚚 التوصيل</span>
                      <span className="font-bold" style={{ color: '#006233' }}>مجاني</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 flex justify-between items-center" style={{ borderTop: '2px solid #F5EDE0' }}>
                    <span className="font-bold text-sm" style={{ color: '#2C1810' }}>المجموع</span>
                    <span className="text-xl font-extrabold" style={{ color: '#C41E3A' }}>{totalPrice} <span className="text-sm">د.م</span></span>
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-[10px] font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>💰 الدفع عند الاستلام</span>
                  </div>
                </div>

                {/* Checkout Form */}
                <form onSubmit={submit} className="p-4 rounded-2xl bg-white shadow-sm space-y-3" style={{ border: '1px solid #F5EDE0' }}>
                  <h3 className="font-bold text-sm" style={{ color: '#2C1810' }}>📋 معلومات التوصيل</h3>

                  <input type="text" required placeholder="الاسم الكامل" value={form.customer_name}
                    onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))}
                    className="form-input !py-2.5 text-sm" />

                  <input type="tel" required placeholder="رقم الهاتف (06XXXXXXXX)" value={form.customer_phone}
                    onChange={e => setForm(p => ({ ...p, customer_phone: e.target.value }))}
                    className="form-input !py-2.5 text-sm" dir="ltr" />

                  <select required value={form.customer_city}
                    onChange={e => setForm(p => ({ ...p, customer_city: e.target.value }))}
                    className="form-input !py-2.5 text-sm">
                    <option value="">اختاري المدينة</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>

                  <textarea required placeholder="العنوان الكامل" value={form.customer_address}
                    onChange={e => setForm(p => ({ ...p, customer_address: e.target.value }))}
                    className="form-input !py-2.5 text-sm" rows={2} />

                  <textarea placeholder="ملاحظات (اختياري)" value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    className="form-input !py-2 text-sm" rows={2} />

                  {orderError && <p className="text-xs font-bold text-center" style={{ color: '#C41E3A' }}>{orderError}</p>}

                  <button type="submit" disabled={submitting}
                    className="w-full py-3.5 rounded-2xl text-sm font-extrabold text-white transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #006233, #00A651)' }}>
                    {submitting ? 'جاري الإرسال...' : `✅ تأكيد الطلب — ${totalPrice} د.م`}
                  </button>

                  <div className="flex items-center justify-center gap-3 text-[10px] font-semibold" style={{ color: '#A67B5B' }}>
                    <span>🚚 توصيل مجاني</span>
                    <span>•</span>
                    <span>💰 الدفع عند الاستلام</span>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
