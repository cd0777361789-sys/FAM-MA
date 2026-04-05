'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [orderForm, setOrderForm] = useState({
    customer_name: '', customer_phone: '', customer_city: '', customer_address: '', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [orderError, setOrderError] = useState('');
  const [countdown, setCountdown] = useState({ hours: 2, minutes: 45, seconds: 30 });

  useEffect(() => {
    const slug = params.slug as string;
    Promise.all([
      fetch(`/api/products/${slug}`).then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([prod, setts]) => {
      if (prod && !prod.error) {
        setProduct(prod);
        const sizes = safeJsonParse<string[]>(prod.sizes, []);
        const colors = safeJsonParse<string[]>(prod.colors, []);
        if (sizes.length > 0) setSelectedSize(sizes[0]);
        if (colors.length > 0) setSelectedColor(colors[0]);
      }
      setSettings(setts || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.slug]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; minutes = 59; seconds = 59; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
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
      else setOrderError(data.error || 'حدث خطأ، يرجى المحاولة مرة أخرى');
    } catch { setOrderError('خطأ في الاتصال'); }
    finally { setSubmitting(false); }
  }, [orderForm, product, quantity, selectedSize, selectedColor, submitting]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FDF8F0' }}>
        <div className="text-center"><div className="w-16 h-16 mx-auto mb-4 rounded-full animate-pulse" style={{ backgroundColor: '#D4A574' }} /><p style={{ color: '#8B5E3C' }}>جاري التحميل...</p></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FDF8F0' }}>
        <div className="text-center"><h1 className="text-3xl font-bold mb-4" style={{ color: '#2C1810' }}>المنتج غير موجود</h1><Link href="/" className="btn-moroccan">العودة للمتجر</Link></div>
      </div>
    );
  }

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

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#FDF8F0' }}>
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center animate-fade-in-up">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#006233' }}>
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#2C1810' }}>تم تأكيد طلبك بنجاح! 🎉</h2>
          <p className="mb-4" style={{ color: '#4A3228' }}>شكراً لثقتك في FAM.MA</p>
          <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: '#FDF8F0' }}>
            <p className="text-sm" style={{ color: '#4A3228' }}>رقم الطلب</p>
            <p className="text-xl font-bold" style={{ color: '#8B5E3C' }}>{orderSuccess}</p>
          </div>
          <p className="text-sm mb-6" style={{ color: '#4A3228' }}>سنتواصل معك قريباً لتأكيد الطلب وموعد التوصيل</p>
          <div className="space-y-3">
            <Link href="/" className="btn-moroccan w-full block text-center">تسوقي المزيد ✦</Link>
            {settings.site_whatsapp && (
              <a href={`https://wa.me/${settings.site_whatsapp.replace(/[^0-9]/g, '')}?text=مرحباً، أريد الاستفسار عن طلبي رقم ${orderSuccess}`} target="_blank" rel="noopener noreferrer" className="block w-full text-center py-3 rounded-lg font-bold" style={{ backgroundColor: '#25D366', color: 'white' }}>
                تواصلي عبر الواتساب 📱
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDF8F0' }}>
      {/* Top Announcement Bar (admin offer badge or default) */}
      <div className="gradient-moroccan text-white text-center py-2 px-4 text-sm font-semibold">
        {offerBadge || '🎉 عرض خاص لفترة محدودة - توصيل مجاني | الدفع عند الاستلام'}
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm py-3 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, #8B5E3C, #C9A94E)' }}>
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="font-bold" style={{ color: '#6B4226' }}>FAM.MA</span>
          </Link>
          <div className="cod-badge">💰 الدفع عند الاستلام</div>
        </div>
      </header>

      {/* Product Hero */}
      <section className="py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Images + Gallery */}
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-white shadow-lg aspect-square">
                {allImages.length > 0 ? (
                  <img src={allImages[activeImage] || allImages[0]} alt={product.name_ar} className="w-full h-full object-cover transition-all duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#F5EDE0' }}>
                    <div className="text-center"><span className="text-8xl">✦</span><p className="mt-4 text-lg" style={{ color: '#D4A574' }}>{product.name_ar}</p></div>
                  </div>
                )}
                {discount > 0 && <div className="absolute top-4 right-4 text-white font-bold px-4 py-2 rounded-full text-lg" style={{ backgroundColor: '#C41E3A' }}>-{discount}%</div>}
                {product.is_new ? <div className="absolute top-4 left-4 text-white font-bold px-4 py-2 rounded-full" style={{ backgroundColor: '#006233' }}>جديد ✨</div> : null}
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {allImages.map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(i)} className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${activeImage === i ? 'border-[#8B5E3C] shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: '#C9A94E' }}>{product.category_name_ar || 'FAM.MA'}</p>
                <h1 className="text-3xl md:text-4xl font-bold font-amiri mb-3" style={{ color: '#2C1810' }}>
                  {product.landing_title_ar || product.name_ar}
                </h1>
                {product.landing_subtitle_ar && <p className="text-lg" style={{ color: '#4A3228' }}>{product.landing_subtitle_ar}</p>}
              </div>

              {offerBadge && (
                <div className="p-3 rounded-xl text-center font-bold text-sm" style={{ background: 'linear-gradient(135deg, #C41E3A, #A01830)', color: 'white' }}>
                  🔥 {offerBadge}
                </div>
              )}

              {/* Price */}
              <div className="p-4 rounded-2xl" style={{ backgroundColor: 'white', border: '2px solid #E8C9A0' }}>
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-3xl font-bold" style={{ color: '#C41E3A' }}>{product.price} د.م</span>
                  {product.compare_price && (
                    <>
                      <span className="text-xl line-through opacity-50" style={{ color: '#4A3228' }}>{product.compare_price} د.م</span>
                      <span className="text-white text-sm font-bold px-3 py-1 rounded-full" style={{ backgroundColor: '#C41E3A' }}>وفري {product.compare_price - product.price} د.م</span>
                    </>
                  )}
                </div>
              </div>

              {/* Countdown */}
              <div className="p-4 rounded-2xl text-center" style={{ backgroundColor: '#2C1810' }}>
                <p className="text-white text-sm mb-2 font-semibold">⏰ العرض ينتهي خلال</p>
                <div className="flex justify-center gap-3" dir="ltr">
                  {[{ value: countdown.hours, label: 'ساعة' }, { value: countdown.minutes, label: 'دقيقة' }, { value: countdown.seconds, label: 'ثانية' }].map((t, i) => (
                    <div key={i} className="text-center px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(201,169,78,0.2)' }}>
                      <div className="text-2xl font-bold" style={{ color: '#C9A94E' }}>{String(t.value).padStart(2, '0')}</div>
                      <div className="text-xs text-white/70">{t.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              {sizes.length > 0 && (
                <div>
                  <label className="block font-bold mb-2" style={{ color: '#2C1810' }}>المقاس:</label>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map(size => (
                      <button key={size} onClick={() => setSelectedSize(size)} className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${selectedSize === size ? 'text-white shadow-md' : 'bg-white'}`} style={selectedSize === size ? { backgroundColor: '#8B5E3C' } : { border: '2px solid #E8C9A0', color: '#4A3228' }}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {colors.length > 0 && (
                <div>
                  <label className="block font-bold mb-2" style={{ color: '#2C1810' }}>اللون:</label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map(color => (
                      <button key={color} onClick={() => setSelectedColor(color)} className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${selectedColor === color ? 'text-white shadow-md' : 'bg-white'}`} style={selectedColor === color ? { backgroundColor: '#8B5E3C' } : { border: '2px solid #E8C9A0', color: '#4A3228' }}>
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block font-bold mb-2" style={{ color: '#2C1810' }}>الكمية:</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-lg bg-white flex items-center justify-center font-bold text-xl" style={{ border: '2px solid #E8C9A0', color: '#8B5E3C' }}>-</button>
                  <span className="text-xl font-bold min-w-[40px] text-center" style={{ color: '#2C1810' }}>{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-lg bg-white flex items-center justify-center font-bold text-xl" style={{ border: '2px solid #E8C9A0', color: '#8B5E3C' }}>+</button>
                  <span className="text-lg font-bold mr-4" style={{ color: '#C41E3A' }}>المجموع: {totalPrice} د.م</span>
                </div>
              </div>

              {/* CTA */}
              <button onClick={() => setShowOrderForm(true)} className="btn-accent w-full text-xl py-5 rounded-xl animate-pulse-gold">
                {product.landing_cta_ar || 'اطلبي الآن - الدفع عند الاستلام 💰'}
              </button>

              {/* Trust signals */}
              <div className="grid grid-cols-2 gap-3">
                {[{ icon: '🚚', text: 'توصيل مجاني' }, { icon: '💰', text: 'الدفع عند الاستلام' }, { icon: '✅', text: 'منتج أصلي 100%' }, { icon: '🔄', text: 'إرجاع سهل' }].map((t, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-white" style={{ border: '1px solid #F5EDE0' }}>
                    <span>{t.icon}</span><span className="text-sm font-semibold" style={{ color: '#4A3228' }}>{t.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features (admin) */}
      {features.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-10">
              <span className="text-sm font-semibold" style={{ color: '#C9A94E' }}>✦ لماذا تختارين هذا المنتج؟ ✦</span>
              <h2 className="text-2xl md:text-3xl font-bold mt-2 font-amiri" style={{ color: '#2C1810' }}>مميزات المنتج</h2>
              <div className="moroccan-divider max-w-xs mx-auto"><span style={{ color: '#C9A94E' }}>◆</span></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: '#FDF8F0' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#006233' }}>
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <p className="font-semibold" style={{ color: '#2C1810' }}>{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Description */}
      {product.description_ar && (
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold font-amiri" style={{ color: '#2C1810' }}>وصف المنتج</h2>
              <div className="moroccan-divider max-w-xs mx-auto"><span style={{ color: '#C9A94E' }}>◆</span></div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <p className="text-lg leading-relaxed whitespace-pre-line" style={{ color: '#4A3228' }}>{product.description_ar}</p>
            </div>
          </div>
        </section>
      )}

      {/* Video (admin) */}
      {videoUrl && (
        <section className="py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold font-amiri" style={{ color: '#2C1810' }}>🎬 شاهدي المنتج</h2>
              <div className="moroccan-divider max-w-xs mx-auto"><span style={{ color: '#C9A94E' }}>◆</span></div>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg aspect-video">
              <iframe src={videoUrl} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" title="فيديو المنتج" />
            </div>
          </div>
        </section>
      )}

      {/* Extra Sections (admin) */}
      {extraSections.map((section, i) => (
        <section key={i} className={`py-12 ${i % 2 === 0 ? '' : 'bg-white'}`}>
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold font-amiri" style={{ color: '#2C1810' }}>{section.title}</h2>
              <div className="moroccan-divider max-w-xs mx-auto"><span style={{ color: '#C9A94E' }}>◆</span></div>
            </div>
            <div className={section.image ? 'grid grid-cols-1 md:grid-cols-2 gap-8 items-center' : ''}>
              {section.image && (
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <img src={section.image} alt={section.title} className="w-full h-auto" />
                </div>
              )}
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <p className="text-lg leading-relaxed whitespace-pre-line" style={{ color: '#4A3228' }}>{section.content}</p>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Testimonials (admin) */}
      {testimonials.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-10">
              <span className="text-sm font-semibold" style={{ color: '#C9A94E' }}>✦ آراء زبوناتنا ✦</span>
              <h2 className="text-2xl md:text-3xl font-bold mt-2 font-amiri" style={{ color: '#2C1810' }}>ماذا قالت زبوناتنا؟</h2>
              <div className="moroccan-divider max-w-xs mx-auto"><span style={{ color: '#C9A94E' }}>◆</span></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testimonials.map((t, i) => (
                <div key={i} className="p-5 rounded-2xl" style={{ backgroundColor: '#FDF8F0' }}>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, s) => (
                      <span key={s} className={s < t.rating ? '' : 'opacity-30'}>⭐</span>
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: '#4A3228' }}>&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: '#8B5E3C' }}>{t.name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#2C1810' }}>{t.name}</p>
                      <p className="text-xs" style={{ color: '#A67B5B' }}>{t.city}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ (admin) */}
      {faqs.length > 0 && (
        <section className="py-12">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-10">
              <span className="text-sm font-semibold" style={{ color: '#C9A94E' }}>✦ أسئلة شائعة ✦</span>
              <h2 className="text-2xl md:text-3xl font-bold mt-2 font-amiri" style={{ color: '#2C1810' }}>الأسئلة المتكررة</h2>
              <div className="moroccan-divider max-w-xs mx-auto"><span style={{ color: '#C9A94E' }}>◆</span></div>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-right">
                    <span className="font-bold text-base" style={{ color: '#2C1810' }}>{faq.question}</span>
                    <span className="text-xl transition-transform flex-shrink-0 mr-3" style={{ color: '#C9A94E', transform: openFaq === i ? 'rotate(180deg)' : '' }}>▼</span>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5">
                      <p className="leading-relaxed" style={{ color: '#4A3228' }}>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* COD Steps */}
      <section className="py-12" style={{ background: 'linear-gradient(135deg, #006233, #008744)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 font-amiri">كيف تطلبين؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: '1', title: 'اختاري المنتج', desc: 'اختاري المقاس واللون المناسب' },
              { num: '2', title: 'أدخلي معلوماتك', desc: 'الاسم ورقم الهاتف والعنوان' },
              { num: '3', title: 'استلمي وادفعي', desc: 'عند التوصيل خلال 24-48 ساعة' },
            ].map((step, i) => (
              <div key={i} className="p-6 rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center text-xl font-bold" style={{ backgroundColor: '#C9A94E', color: '#2C1810' }}>{step.num}</div>
                <h3 className="font-bold text-lg mb-1">{step.title}</h3>
                <p className="text-white/80 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Second CTA */}
      <section className="py-12 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-4 font-amiri" style={{ color: '#2C1810' }}>لا تفوتي الفرصة!</h2>
          <p className="mb-6" style={{ color: '#4A3228' }}>الكمية محدودة - اطلبي الآن قبل نفاد المخزون</p>
          <button onClick={() => setShowOrderForm(true)} className="btn-accent text-xl py-5 px-12 rounded-xl">
            {product.landing_cta_ar || 'اطلبي الآن 💰'}
          </button>
        </div>
      </section>

      {/* Sticky CTA Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-3 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-lg font-bold" style={{ color: '#C41E3A' }}>{totalPrice} د.م</span>
            {product.compare_price && <span className="text-xs line-through mr-2 opacity-50">{product.compare_price * quantity} د.م</span>}
          </div>
          <button onClick={() => setShowOrderForm(true)} className="btn-accent py-3 px-6 text-base rounded-xl flex-1">
            {product.landing_cta_ar || 'اطلبي الآن 💰'}
          </button>
        </div>
      </div>

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center" onClick={() => setShowOrderForm(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white rounded-t-3xl p-6 pb-4 border-b z-10" style={{ borderColor: '#F5EDE0' }}>
              <button onClick={() => setShowOrderForm(false)} className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F5EDE0' }}>✕</button>
              <h2 className="text-xl font-bold text-center" style={{ color: '#2C1810' }}>أكملي طلبك 🛍️</h2>
              <p className="text-sm text-center mt-1" style={{ color: '#4A3228' }}>الدفع عند الاستلام - بدون أي رسوم إضافية</p>
            </div>

            <div className="p-4 mx-6 mt-4 rounded-xl" style={{ backgroundColor: '#FDF8F0' }}>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: '#F5EDE0' }}>
                  {product.main_image ? <img src={product.main_image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">✦</div>}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm" style={{ color: '#2C1810' }}>{product.name_ar}</p>
                  {(selectedSize || selectedColor) && <p className="text-xs mt-0.5" style={{ color: '#4A3228' }}>{[selectedSize, selectedColor].filter(Boolean).join(' | ')}</p>}
                  <p className="text-xs mt-0.5" style={{ color: '#4A3228' }}>الكمية: {quantity}</p>
                </div>
                <div className="text-left"><p className="font-bold" style={{ color: '#C41E3A' }}>{totalPrice} د.م</p></div>
              </div>
            </div>

            <form onSubmit={handleSubmitOrder} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: '#2C1810' }}>الاسم الكامل *</label>
                <input type="text" required value={orderForm.customer_name} onChange={e => setOrderForm(prev => ({ ...prev, customer_name: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-white text-right" style={{ border: '2px solid #E8C9A0', color: '#2C1810' }} placeholder="أدخلي اسمك الكامل" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: '#2C1810' }}>رقم الهاتف *</label>
                <input type="tel" required value={orderForm.customer_phone} onChange={e => setOrderForm(prev => ({ ...prev, customer_phone: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-white" style={{ border: '2px solid #E8C9A0', color: '#2C1810', direction: 'ltr', textAlign: 'right' }} placeholder="06XXXXXXXX" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: '#2C1810' }}>المدينة *</label>
                <select required value={orderForm.customer_city} onChange={e => setOrderForm(prev => ({ ...prev, customer_city: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-white" style={{ border: '2px solid #E8C9A0', color: '#2C1810' }}>
                  <option value="">اختاري مدينتك</option>
                  {MOROCCAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: '#2C1810' }}>العنوان الكامل *</label>
                <textarea required value={orderForm.customer_address} onChange={e => setOrderForm(prev => ({ ...prev, customer_address: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-white" style={{ border: '2px solid #E8C9A0', color: '#2C1810' }} rows={2} placeholder="الحي، الشارع، رقم المنزل..." />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: '#2C1810' }}>ملاحظات (اختياري)</label>
                <input type="text" value={orderForm.notes} onChange={e => setOrderForm(prev => ({ ...prev, notes: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-white" style={{ border: '2px solid #E8C9A0', color: '#2C1810' }} placeholder="أي ملاحظات إضافية..." />
              </div>
              {orderError && <div className="p-3 rounded-xl text-sm font-semibold text-center" style={{ backgroundColor: '#FEE2E2', color: '#C41E3A' }}>{orderError}</div>}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center p-3 rounded-xl" style={{ backgroundColor: '#FDF8F0' }}>
                  <span className="font-semibold text-sm" style={{ color: '#4A3228' }}>المجموع:</span>
                  <span className="text-xl font-bold" style={{ color: '#C41E3A' }}>{totalPrice} د.م</span>
                </div>
                <div className="flex items-center gap-2 text-xs justify-center" style={{ color: '#006233' }}>
                  <span>🚚</span><span className="font-semibold">التوصيل مجاني - الدفع عند الاستلام</span>
                </div>
                <button type="submit" disabled={submitting} className="btn-accent w-full text-lg py-4 rounded-xl disabled:opacity-50">
                  {submitting ? 'جاري إرسال الطلب...' : 'تأكيد الطلب 💰'}
                </button>
                <p className="text-xs text-center" style={{ color: '#4A3228' }}>🔒 معلوماتك محمية ولا نشاركها مع أي طرف ثالث</p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-8 text-center pb-24 md:pb-8" style={{ backgroundColor: '#2C1810' }}>
        <p className="text-white/50 text-sm">© FAM.MA - جميع الحقوق محفوظة</p>
      </footer>

      {/* WhatsApp */}
      {settings.site_whatsapp && (
        <a href={`https://wa.me/${settings.site_whatsapp.replace(/[^0-9]/g, '')}?text=مرحباً، أريد الاستفسار عن ${product.name_ar}`} target="_blank" rel="noopener noreferrer" className="whatsapp-float hidden md:flex" title="تواصلي عبر الواتساب">
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
        </a>
      )}
    </div>
  );
}
