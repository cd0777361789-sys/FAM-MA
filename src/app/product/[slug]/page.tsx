'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Product {
  id: string;
  name_ar: string;
  slug: string;
  description_ar: string;
  price: number;
  compare_price: number | null;
  main_image: string | null;
  images: string;
  sizes: string;
  colors: string;
  is_new: number;
  stock: number;
  category_name_ar?: string;
  landing_title_ar?: string;
  landing_subtitle_ar?: string;
  landing_features_ar?: string;
  landing_cta_ar?: string;
  landing_testimonials?: string;
  landing_gallery?: string;
  landing_video_url?: string;
  landing_offer_badge_ar?: string;
  landing_faq_ar?: string;
  landing_extra_sections?: string;
}

interface Testimonial { name: string; city: string; text: string; rating: number; }
interface FAQ { question: string; answer: string; }
interface ExtraSection { title: string; content: string; image?: string; }

const MOROCCAN_CITIES = [
  'الدار البيضاء', 'الرباط', 'فاس', 'مراكش', 'طنجة', 'مكناس',
  'أكادير', 'وجدة', 'القنيطرة', 'تطوان', 'آسفي', 'الجديدة',
  'بني ملال', 'خريبكة', 'الناظور', 'سلا', 'تمارة', 'المحمدية',
  'العيون', 'خنيفرة', 'سطات', 'تازة', 'الراشيدية', 'ورزازات',
  'الصويرة', 'إفران', 'شفشاون', 'الحسيمة', 'تنغير', 'زاكورة',
];

function safeJsonParse<T>(str: string | undefined | null, fallback: T): T {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

export default function ProductLandingPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [orderForm, setOrderForm] = useState({ customer_name: '', customer_phone: '', customer_city: '', customer_address: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [orderError, setOrderError] = useState('');
  const [countdown, setCountdown] = useState({ hours: 2, minutes: 45, seconds: 30 });
  const imgRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState(0);

  useEffect(() => {
    const slug = params.slug as string;
    Promise.all([
      fetch(`/api/products/${slug}`).then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([prod, setts]) => {
      if (prod && !prod.error) {
        setProduct(prod);
        const s = safeJsonParse<string[]>(prod.sizes, []);
        const c = safeJsonParse<string[]>(prod.colors, []);
        if (s.length > 0) setSelectedSize(s[0]);
        if (c.length > 0) setSelectedColor(c[0]);
      }
      setSettings(setts || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.slug]);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(p => {
        let { hours, minutes, seconds } = p;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; minutes = 59; seconds = 59; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const handleSubmitOrder = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setOrderError('');
    setSubmitting(true);
    try {
      const variant = [selectedSize, selectedColor].filter(Boolean).join(' - ');
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderForm, product_id: product?.id, product_name: product?.name_ar,
          product_variant: variant, quantity, unit_price: product?.price, source: 'landing',
        }),
      });
      const data = await res.json();
      if (res.ok) setOrderSuccess(data.order_number);
      else setOrderError(data.error || 'حدث خطأ');
    } catch { setOrderError('خطأ في الاتصال'); }
    finally { setSubmitting(false); }
  }, [orderForm, product, quantity, selectedSize, selectedColor, submitting]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FDF8F0' }}>
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-3 rounded-full" style={{ border: '3px solid #E8C9A0', borderTopColor: '#8B5E3C', animation: 'spin 0.6s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p className="text-xs font-semibold" style={{ color: '#8B5E3C' }}>جاري التحميل...</p>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FDF8F0' }}>
      <div className="text-center px-4">
        <div className="text-5xl mb-3">🔍</div>
        <h1 className="text-xl font-bold mb-2" style={{ color: '#2C1810' }}>المنتج غير موجود</h1>
        <Link href="/" className="btn-moroccan px-6 py-2.5 rounded-xl text-sm">العودة للمتجر</Link>
      </div>
    </div>
  );

  const discount = product.compare_price ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100) : 0;
  const sizes: string[] = safeJsonParse(product.sizes, []);
  const colors: string[] = safeJsonParse(product.colors, []);
  const features: string[] = safeJsonParse(product.landing_features_ar, []);
  const testimonials: Testimonial[] = safeJsonParse(product.landing_testimonials, []);
  const galleryImages: string[] = safeJsonParse(product.landing_gallery, []);
  const faqs: FAQ[] = safeJsonParse(product.landing_faq_ar, []);
  const extraSections: ExtraSection[] = safeJsonParse(product.landing_extra_sections, []);
  const offerBadge = product.landing_offer_badge_ar || '';
  const videoUrl = product.landing_video_url || '';
  const totalPrice = product.price * quantity;
  const allImages = [product.main_image, ...galleryImages].filter(Boolean) as string[];

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && activeImage < allImages.length - 1) setActiveImage(activeImage + 1);
      else if (diff < 0 && activeImage > 0) setActiveImage(activeImage - 1);
    }
  };

  if (orderSuccess) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#FDF8F0' }}>
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center animate-scale-in">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#006233' }}>
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-xl font-bold mb-1" style={{ color: '#2C1810' }}>تم تأكيد طلبك بنجاح!</h2>
        <p className="text-sm mb-4" style={{ color: '#4A3228' }}>شكراً لثقتك في FAM.MA</p>
        <div className="p-3 rounded-xl mb-4" style={{ backgroundColor: '#FDF8F0' }}>
          <p className="text-xs" style={{ color: '#4A3228' }}>رقم الطلب</p>
          <p className="text-lg font-bold" style={{ color: '#8B5E3C' }}>{orderSuccess}</p>
        </div>
        <div className="space-y-2">
          <Link href="/" className="btn-moroccan w-full block text-center py-3 rounded-xl text-sm">تسوقي المزيد</Link>
          {settings.site_whatsapp && (
            <a href={`https://wa.me/${settings.site_whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('مرحباً، طلبي رقم ' + orderSuccess)}`} target="_blank" rel="noopener noreferrer" className="block w-full text-center py-3 rounded-xl font-bold text-sm" style={{ backgroundColor: '#25D366', color: 'white' }}>
              تواصلي عبر الواتساب 📱
            </a>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDF8F0' }}>
      {/* Offer Banner */}
      <div className="text-white text-center py-2 px-4 text-[13px] font-semibold" style={{ background: 'linear-gradient(90deg, #2C1810, #6B4226, #8B5E3C, #6B4226, #2C1810)' }}>
        {offerBadge || '🎉 عرض خاص - توصيل مجاني | الدفع عند الاستلام'}
      </div>

      {/* Header */}
      <header className="glass shadow-sm py-2.5 px-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, #8B5E3C, #C9A94E)' }}>
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="font-bold text-sm" style={{ color: '#6B4226' }}>FAM.MA</span>
          </Link>
          <div className="cod-badge text-xs">💰 الدفع عند الاستلام</div>
        </div>
      </header>

      {/* Main product area */}
      <section className="py-5 md:py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-10">
            {/* Images */}
            <div className="space-y-3">
              <div ref={imgRef} className="relative rounded-2xl overflow-hidden bg-white shadow-sm aspect-square" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                {allImages.length > 0 ? (
                  <img src={allImages[activeImage] || allImages[0]} alt={product.name_ar} className="w-full h-full object-cover transition-opacity duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#F5EDE0' }}><span className="text-7xl opacity-20">✦</span></div>
                )}
                {discount > 0 && <div className="absolute top-3 right-3 text-white font-bold px-3 py-1 rounded-xl text-sm z-10" style={{ backgroundColor: '#C41E3A' }}>-{discount}%</div>}
                {product.is_new ? <div className="absolute top-3 left-3 text-white font-bold px-3 py-1 rounded-xl text-xs" style={{ backgroundColor: '#006233' }}>جديد</div> : null}
                {allImages.length > 1 && <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/40 text-white text-[11px] px-2.5 py-0.5 rounded-full backdrop-blur-sm">{activeImage + 1}/{allImages.length}</div>}
              </div>
              {allImages.length > 1 && (
                <>
                  <div className="flex justify-center gap-1.5 md:hidden">
                    {allImages.map((_, i) => <button key={i} onClick={() => setActiveImage(i)} className={`img-dot ${activeImage === i ? 'active' : ''}`} />)}
                  </div>
                  <div className="hidden md:flex gap-2 overflow-x-auto pb-1">
                    {allImages.map((img, i) => (
                      <button key={i} onClick={() => setActiveImage(i)} className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 transition-all ${activeImage === i ? 'ring-2 ring-[#8B5E3C] ring-offset-2' : 'opacity-60 hover:opacity-90'}`}>
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Info */}
            <div className="space-y-4">
              <div>
                {product.category_name_ar && <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-2" style={{ backgroundColor: '#C9A94E20', color: '#C9A94E' }}>{product.category_name_ar}</span>}
                <h1 className="text-2xl md:text-3xl font-bold font-amiri leading-tight" style={{ color: '#2C1810' }}>{product.landing_title_ar || product.name_ar}</h1>
                {product.landing_subtitle_ar && <p className="text-sm mt-1.5" style={{ color: '#4A3228' }}>{product.landing_subtitle_ar}</p>}
              </div>

              {/* Price */}
              <div className="bg-white rounded-2xl p-4 shadow-sm" style={{ border: '1px solid #F5EDE0' }}>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-3xl font-extrabold" style={{ color: '#C41E3A' }}>{product.price} <span className="text-base">د.م</span></span>
                  {product.compare_price && (
                    <>
                      <span className="text-base line-through opacity-40">{product.compare_price} د.م</span>
                      <span className="text-white text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#C41E3A' }}>وفري {product.compare_price - product.price} د.م</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #F5EDE0' }}>
                  <span className="text-xs font-semibold" style={{ color: '#4A3228' }}>⏰ ينتهي خلال</span>
                  <div className="flex gap-1" dir="ltr">
                    {[countdown.hours, countdown.minutes, countdown.seconds].map((v, i) => (
                      <span key={i} className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: '#2C1810', color: '#C9A94E' }}>{String(v).padStart(2, '0')}</span>
                    ))}
                  </div>
                </div>
              </div>

              {offerBadge && <div className="p-2.5 rounded-xl text-center font-bold text-xs" style={{ background: 'linear-gradient(135deg, #C41E3A, #A01830)', color: 'white' }}>🔥 {offerBadge}</div>}

              {sizes.length > 0 && (
                <div>
                  <label className="form-label">المقاس:</label>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map(s => <button key={s} onClick={() => setSelectedSize(s)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${selectedSize === s ? 'text-white shadow-md' : 'bg-white hover:bg-[#F5EDE0]'}`} style={selectedSize === s ? { backgroundColor: '#8B5E3C' } : { border: '1.5px solid #E8C9A0', color: '#4A3228' }}>{s}</button>)}
                  </div>
                </div>
              )}

              {colors.length > 0 && (
                <div>
                  <label className="form-label">اللون:</label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map(c => <button key={c} onClick={() => setSelectedColor(c)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${selectedColor === c ? 'text-white shadow-md' : 'bg-white hover:bg-[#F5EDE0]'}`} style={selectedColor === c ? { backgroundColor: '#8B5E3C' } : { border: '1.5px solid #E8C9A0', color: '#4A3228' }}>{c}</button>)}
                  </div>
                </div>
              )}

              <div>
                <label className="form-label">الكمية:</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-white rounded-xl overflow-hidden" style={{ border: '1.5px solid #E8C9A0' }}>
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center text-lg font-bold hover:bg-[#F5EDE0] transition" style={{ color: '#8B5E3C' }}>−</button>
                    <span className="w-10 text-center text-base font-bold" style={{ color: '#2C1810' }}>{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center text-lg font-bold hover:bg-[#F5EDE0] transition" style={{ color: '#8B5E3C' }}>+</button>
                  </div>
                  <span className="text-lg font-bold" style={{ color: '#C41E3A' }}>{totalPrice} د.م</span>
                </div>
              </div>

              <button onClick={() => setShowOrderForm(true)} className="btn-accent w-full text-base py-4 rounded-2xl animate-pulse-gold">
                {product.landing_cta_ar || 'اطلبي الآن - الدفع عند الاستلام 💰'}
              </button>

              <div className="grid grid-cols-2 gap-2">
                {[{ icon: '🚚', text: 'توصيل مجاني' }, { icon: '💰', text: 'الدفع عند الاستلام' }, { icon: '✅', text: 'منتج أصلي' }, { icon: '↩️', text: 'إرجاع سهل' }].map((t, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-white text-xs" style={{ border: '1px solid #F5EDE0' }}>
                    <span>{t.icon}</span><span className="font-semibold" style={{ color: '#4A3228' }}>{t.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      {features.length > 0 && (
        <section className="py-10 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <SH title="مميزات المنتج" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: '#FDF8F0' }}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#006233' }}>
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: '#2C1810' }}>{f}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {product.description_ar && (
        <section className="py-10"><div className="max-w-4xl mx-auto px-4"><SH title="وصف المنتج" /><div className="bg-white rounded-2xl p-6 shadow-sm"><p className="text-sm leading-[1.9] whitespace-pre-line" style={{ color: '#4A3228' }}>{product.description_ar}</p></div></div></section>
      )}

      {videoUrl && (
        <section className="py-10 bg-white"><div className="max-w-4xl mx-auto px-4"><SH title="شاهدي المنتج" /><div className="rounded-2xl overflow-hidden shadow-sm aspect-video"><iframe src={videoUrl} className="w-full h-full" allowFullScreen title="فيديو" /></div></div></section>
      )}

      {extraSections.map((sec, i) => (
        <section key={i} className={`py-10 ${i % 2 === 0 ? '' : 'bg-white'}`}>
          <div className="max-w-4xl mx-auto px-4">
            <SH title={sec.title} />
            <div className={sec.image ? 'grid grid-cols-1 md:grid-cols-2 gap-6 items-center' : ''}>
              {sec.image && <div className="rounded-2xl overflow-hidden shadow-sm"><img src={sec.image} alt={sec.title} className="w-full h-auto" /></div>}
              <div className="bg-white rounded-2xl p-6 shadow-sm"><p className="text-sm leading-[1.9] whitespace-pre-line" style={{ color: '#4A3228' }}>{sec.content}</p></div>
            </div>
          </div>
        </section>
      ))}

      {testimonials.length > 0 && (
        <section className="py-10 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <SH title="آراء زبوناتنا" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {testimonials.map((t, i) => (
                <div key={i} className="p-4 rounded-2xl" style={{ backgroundColor: '#FDF8F0' }}>
                  <div className="flex gap-0.5 mb-2 text-sm">{[...Array(5)].map((_, s) => <span key={s} className={s < t.rating ? '' : 'opacity-20'}>⭐</span>)}</div>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: '#4A3228' }}>&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid #E8C9A0' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#8B5E3C' }}>{t.name.charAt(0)}</div>
                    <div><p className="text-xs font-bold" style={{ color: '#2C1810' }}>{t.name}</p><p className="text-[10px]" style={{ color: '#A67B5B' }}>{t.city}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {faqs.length > 0 && (
        <section className="py-10">
          <div className="max-w-3xl mx-auto px-4">
            <SH title="الأسئلة المتكررة" />
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 text-right">
                    <span className="font-bold text-sm" style={{ color: '#2C1810' }}>{faq.question}</span>
                    <svg className={`w-4 h-4 flex-shrink-0 mr-3 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="#C9A94E" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {openFaq === i && <div className="px-4 pb-4"><p className="text-sm leading-relaxed" style={{ color: '#4A3228' }}>{faq.answer}</p></div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* COD Steps */}
      <section className="py-10" style={{ background: 'linear-gradient(135deg, #006233, #008744)' }}>
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-xl font-bold mb-5 font-amiri">كيف تطلبين؟</h2>
          <div className="grid grid-cols-3 gap-3">
            {[{ n: '1', t: 'اختاري', d: 'المقاس واللون' }, { n: '2', t: 'بياناتك', d: 'الاسم والعنوان' }, { n: '3', t: 'استلمي', d: 'خلال 24-48h' }].map((s, i) => (
              <div key={i} className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <div className="w-9 h-9 mx-auto mb-2 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: '#C9A94E', color: '#2C1810' }}>{s.n}</div>
                <h3 className="font-bold text-xs">{s.t}</h3>
                <p className="text-white/60 text-[10px]">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Second CTA */}
      <section className="py-10 text-center">
        <div className="max-w-md mx-auto px-4">
          <h2 className="text-lg font-bold mb-2 font-amiri" style={{ color: '#2C1810' }}>لا تفوتي الفرصة!</h2>
          <p className="text-sm mb-4" style={{ color: '#4A3228' }}>الكمية محدودة</p>
          <button onClick={() => setShowOrderForm(true)} className="btn-accent text-base py-4 px-10 rounded-2xl">{product.landing_cta_ar || 'اطلبي الآن 💰'}</button>
        </div>
      </section>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden" style={{ background: 'linear-gradient(to top, rgba(253,248,240,0.98) 80%, rgba(253,248,240,0))' }}>
        <div className="flex items-center gap-2 px-4 pb-4 pt-6">
          <div className="flex-shrink-0 text-center leading-tight">
            <span className="text-lg font-extrabold block" style={{ color: '#C41E3A' }}>{totalPrice}</span>
            <span className="text-[10px] font-semibold" style={{ color: '#A67B5B' }}>د.م</span>
          </div>
          <button onClick={() => setShowOrderForm(true)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-md active:scale-[0.98] transition-all" style={{ background: 'linear-gradient(135deg, #C41E3A, #A01830)' }}>
            {product.landing_cta_ar || 'اطلبي الآن 💰'}
          </button>
        </div>
      </div>

      {/* Order Form */}
      {showOrderForm && (
        <div className="modal-overlay" onClick={() => setShowOrderForm(false)}>
          <div className="modal-backdrop" />
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white z-10 p-5 pb-3 border-b flex items-center justify-between" style={{ borderColor: '#F5EDE0', borderRadius: '24px 24px 0 0' }}>
              <div><h2 className="text-base font-bold" style={{ color: '#2C1810' }}>أكملي طلبك</h2><p className="text-[11px]" style={{ color: '#A67B5B' }}>الدفع عند الاستلام</p></div>
              <button onClick={() => setShowOrderForm(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F5EDE0]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#4A3228" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-3 mx-5 mt-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: '#FDF8F0' }}>
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-[#F5EDE0]">
                {product.main_image ? <img src={product.main_image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">✦</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs truncate" style={{ color: '#2C1810' }}>{product.name_ar}</p>
                <p className="text-[10px]" style={{ color: '#4A3228' }}>{[selectedSize, selectedColor].filter(Boolean).join(' | ')} · الكمية: {quantity}</p>
              </div>
              <p className="font-bold text-sm flex-shrink-0" style={{ color: '#C41E3A' }}>{totalPrice} د.م</p>
            </div>
            <form onSubmit={handleSubmitOrder} className="p-5 space-y-3">
              <div><label className="form-label">الاسم الكامل *</label><input type="text" required value={orderForm.customer_name} onChange={e => setOrderForm(p => ({ ...p, customer_name: e.target.value }))} className="form-input" placeholder="أدخلي اسمك الكامل" /></div>
              <div><label className="form-label">رقم الهاتف *</label><input type="tel" required value={orderForm.customer_phone} onChange={e => setOrderForm(p => ({ ...p, customer_phone: e.target.value }))} className="form-input" style={{ direction: 'ltr', textAlign: 'right' }} placeholder="06XXXXXXXX" /></div>
              <div><label className="form-label">المدينة *</label><select required value={orderForm.customer_city} onChange={e => setOrderForm(p => ({ ...p, customer_city: e.target.value }))} className="form-input"><option value="">اختاري مدينتك</option>{MOROCCAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="form-label">العنوان الكامل *</label><textarea required value={orderForm.customer_address} onChange={e => setOrderForm(p => ({ ...p, customer_address: e.target.value }))} className="form-input" rows={2} placeholder="الحي، الشارع، رقم المنزل..." /></div>
              <div><label className="form-label">ملاحظات (اختياري)</label><input type="text" value={orderForm.notes} onChange={e => setOrderForm(p => ({ ...p, notes: e.target.value }))} className="form-input" placeholder="أي ملاحظات..." /></div>
              {orderError && <div className="p-3 rounded-xl text-xs font-semibold text-center" style={{ backgroundColor: '#FEE2E2', color: '#C41E3A' }}>{orderError}</div>}
              <div className="pt-2 space-y-3">
                <div className="flex justify-between items-center p-3 rounded-xl" style={{ backgroundColor: '#FDF8F0' }}>
                  <span className="text-xs font-semibold" style={{ color: '#4A3228' }}>المجموع (توصيل مجاني):</span>
                  <span className="text-lg font-bold" style={{ color: '#C41E3A' }}>{totalPrice} د.م</span>
                </div>
                <button type="submit" disabled={submitting} className="btn-accent w-full text-base py-4 rounded-xl disabled:opacity-50">{submitting ? 'جاري الإرسال...' : 'تأكيد الطلب 💰'}</button>
                <p className="text-[10px] text-center" style={{ color: '#A67B5B' }}>🔒 معلوماتك محمية</p>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="py-5 text-center pb-20 md:pb-5" style={{ backgroundColor: '#2C1810' }}><p className="text-white/30 text-xs">© FAM.MA - جميع الحقوق محفوظة</p></footer>


    </div>
  );
}

function SH({ title }: { title: string }) {
  return (
    <div className="text-center mb-8">
      <h2 className="text-xl md:text-2xl font-bold font-amiri" style={{ color: '#2C1810' }}>{title}</h2>
      <div className="moroccan-divider max-w-[160px] mx-auto"><span style={{ color: '#C9A94E', fontSize: '10px' }}>◆</span></div>
    </div>
  );
}
