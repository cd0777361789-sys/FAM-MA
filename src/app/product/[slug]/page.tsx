'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Product {
  id: string; name_ar: string; slug: string; description_ar: string;
  price: number; compare_price: number | null; main_image: string | null;
  images: string; sizes: string; colors: string; is_new: number; stock: number;
  category_name_ar?: string; landing_title_ar?: string; landing_subtitle_ar?: string;
  landing_features_ar?: string; landing_cta_ar?: string; landing_testimonials?: string;
  landing_gallery?: string; landing_video_url?: string; landing_offer_badge_ar?: string;
  landing_faq_ar?: string; landing_extra_sections?: string; landing_offers?: string;
  landing_detail_images?: string; landing_settings?: string;
}
interface Testimonial { name: string; city: string; text: string; rating: number; }
interface FAQ { question: string; answer: string; }
interface ExtraSection { title: string; content: string; image?: string; }
interface Offer { title: string; description: string; discount: string; active: boolean; }

const CITIES = [
  'الدار البيضاء','الرباط','فاس','مراكش','طنجة','مكناس','أكادير','وجدة','القنيطرة','تطوان',
  'آسفي','الجديدة','بني ملال','خريبكة','الناظور','سلا','تمارة','المحمدية','العيون','خنيفرة',
  'سطات','تازة','الراشيدية','ورزازات','الصويرة','إفران','شفشاون','الحسيمة','تنغير','زاكورة',
];
const PROOF_NAMES = ['فاطمة','نجاة','سعاد','كريمة','حسناء','مريم','زينب','أمينة','خديجة','ليلى','سلمى','هند','رانيا','إيمان','وفاء'];
const PROOF_CITIES = ['الدار البيضاء','الرباط','مراكش','فاس','طنجة','أكادير','مكناس','تطوان','القنيطرة','سلا'];

function jp<T>(s: string | undefined | null, f: T): T { if (!s) return f; try { return JSON.parse(s); } catch { return f; } }

// ============ Intersection Observer Hook ============
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ============ Animated Counter ============
function AnimCounter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const { ref, visible } = useInView();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.max(1, Math.floor(end / 40));
    const t = setInterval(() => { start += step; if (start >= end) { setVal(end); clearInterval(t); } else setVal(start); }, 30);
    return () => clearInterval(t);
  }, [visible, end]);
  return <span ref={ref}>{val}{suffix}</span>;
}

export default function ProductLandingPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [orderForm, setOrderForm] = useState({ customer_name: '', customer_phone: '', customer_city: '', customer_address: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [orderError, setOrderError] = useState('');
  const [countdown, setCountdown] = useState({ h: 2, m: 45, s: 30 });
  const [touchX, setTouchX] = useState(0);
  const [liveViewers, setLiveViewers] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [toast, setToast] = useState<{ name: string; city: string; ago: string } | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [stockLeft, setStockLeft] = useState(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [testimonialTouchX, setTestimonialTouchX] = useState(0);
  const orderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const slug = params.slug as string;
    Promise.all([
      fetch(`/api/products/${slug}`).then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([p, s]) => {
      if (p && !p.error) {
        setProduct(p);
        const sz = jp<string[]>(p.sizes, []);
        const cl = jp<string[]>(p.colors, []);
        if (sz.length) setSelectedSize(sz[0]);
        if (cl.length) setSelectedColor(cl[0]);
        setStockLeft(Math.max(3, Math.min(p.stock || 12, 15)));
        // Initialize countdown from landing_settings
        const ls = jp<Record<string, unknown>>(p.landing_settings, {});
        const ch = typeof ls.countdown_hours === 'number' ? ls.countdown_hours : 2;
        const cm = typeof ls.countdown_minutes === 'number' ? ls.countdown_minutes : 45;
        setCountdown({ h: ch, m: cm, s: 30 });
      }
      setSettings(s || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.slug]);

  // Timer
  useEffect(() => {
    if (!product) return;
    const ls = jp<Record<string, unknown>>(product.landing_settings, {});
    if (ls.countdown_enabled === false) return;
    const t = setInterval(() => setCountdown(p => {
      let { h, m, s } = p; s--;
      if (s < 0) { s = 59; m--; } if (m < 0) { m = 59; h--; } if (h < 0) { h = 23; m = 59; s = 59; }
      return { h, m, s };
    }), 1000);
    return () => clearInterval(t);
  }, [product]);

  // Live numbers
  useEffect(() => {
    setLiveViewers(Math.floor(Math.random() * 20) + 23);
    setTodayOrders(Math.floor(Math.random() * 30) + 40);
    const t = setInterval(() => setLiveViewers(p => Math.max(15, p + (Math.random() > 0.5 ? 1 : -1))), 7000);
    return () => clearInterval(t);
  }, []);

  // Social proof toasts
  useEffect(() => {
    if (!product) return;
    const ls = jp<Record<string, unknown>>(product.landing_settings, {});
    if (ls.toast_enabled === false) return;
    const customNames = Array.isArray(ls.proof_names) && ls.proof_names.length > 0
      ? (ls.proof_names as string[]).filter(Boolean)
      : null;
    const names = customNames && customNames.length > 0 ? customNames : PROOF_NAMES;
    const fire = () => {
      const name = names[Math.floor(Math.random() * names.length)];
      const city = PROOF_CITIES[Math.floor(Math.random() * PROOF_CITIES.length)];
      const agos = ['دقيقتين', '5 دقائق', '8 دقائق', '12 دقيقة', 'ربع ساعة', '20 دقيقة'];
      setToast({ name, city, ago: agos[Math.floor(Math.random() * agos.length)] });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4500);
    };
    const t1 = setTimeout(fire, 6000);
    const t2 = setInterval(fire, 22000);
    return () => { clearTimeout(t1); clearInterval(t2); };
  }, [product]);

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setOrderError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderForm, product_id: product?.id, product_name: product?.name_ar,
          product_variant: [selectedSize, selectedColor].filter(Boolean).join(' - '),
          quantity, unit_price: product?.price, source: 'landing',
        }),
      });
      const d = await res.json();
      if (res.ok) setOrderSuccess(d.order_number); else setOrderError(d.error || 'حدث خطأ');
    } catch { setOrderError('خطأ في الاتصال'); }
    finally { setSubmitting(false); }
  }, [orderForm, product, quantity, selectedSize, selectedColor, submitting]);

  const scrollToOrder = () => orderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // ===== LOADING =====
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #2C1810, #1a0f09)' }}>
      <div className="text-center">
        <div className="landing-loader" /><p className="text-xs font-bold mt-4" style={{ color: '#C9A94E' }}>FAM.MA</p>
      </div>
    </div>
  );

  // ===== NOT FOUND ===== 
  if (!product) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDF8F0' }}>
      <div className="text-center px-4">
        <div className="text-6xl mb-4">✦</div>
        <h1 className="text-xl font-bold mb-3 font-amiri" style={{ color: '#2C1810' }}>المنتج غير موجود</h1>
        <Link href="/" className="btn-moroccan px-8 py-3 rounded-2xl text-sm">العودة للمتجر</Link>
      </div>
    </div>
  );

  const discount = product.compare_price ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100) : 0;
  const sizes: string[] = jp(product.sizes, []);
  const colors: string[] = jp(product.colors, []);
  const features: string[] = jp(product.landing_features_ar, []);
  const testimonials: Testimonial[] = jp(product.landing_testimonials, []);
  const gallery: string[] = jp(product.landing_gallery, []);
  const faqs: FAQ[] = jp(product.landing_faq_ar, []);
  const extras: ExtraSection[] = jp(product.landing_extra_sections, []);
  const activeOffers: Offer[] = jp<Offer[]>(product.landing_offers, []).filter(o => o.active);
  const detailImages: string[] = jp(product.landing_detail_images, []);
  const videoUrl = product.landing_video_url || '';
  const hasVideo = !!videoUrl;
  const allImages = [product.main_image, ...gallery].filter(Boolean) as string[];
  const total = product.price * quantity;

  const swipeStart = (e: React.TouchEvent) => setTouchX(e.touches[0].clientX);
  const swipeEnd = (e: React.TouchEvent) => {
    const d = touchX - e.changedTouches[0].clientX;
    if (Math.abs(d) > 50) {
      if (d > 0 && activeImg < allImages.length - 1) setActiveImg(activeImg + 1);
      else if (d < 0 && activeImg > 0) setActiveImg(activeImg - 1);
    }
  };

  // ===== SUCCESS =====
  if (orderSuccess) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(180deg, #FDF8F0 0%, #F5EDE0 100%)' }}>
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center landing-reveal">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #006233, #00A651)' }}>
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-2xl font-bold mb-2 font-amiri" style={{ color: '#2C1810' }}>تم تأكيد طلبك بنجاح!</h2>
        <p className="text-sm mb-6" style={{ color: '#4A3228' }}>شكراً لثقتك — سنتواصل معك خلال دقائق</p>
        <div className="py-5 px-6 rounded-2xl mb-6" style={{ background: 'linear-gradient(135deg, #FDF8F0, #F5EDE0)', border: '2px dashed #C9A94E' }}>
          <p className="text-[11px] mb-1" style={{ color: '#A67B5B' }}>رقم الطلب</p>
          <p className="text-3xl font-extrabold tracking-wider" style={{ color: '#8B5E3C' }}>{orderSuccess}</p>
        </div>
        <Link href="/" className="block w-full py-3.5 rounded-2xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #8B5E3C, #6B4226)' }}>تسوقي المزيد ←</Link>
        {settings.site_whatsapp && (
          <a href={`https://wa.me/${settings.site_whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('مرحباً، طلبي رقم ' + orderSuccess)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full mt-3 py-3.5 rounded-2xl font-bold text-sm text-white" style={{ background: '#25D366' }}>
            تواصلي عبر الواتساب
          </a>
        )}
      </div>
    </div>
  );

  // ============================================================
  // =================== MAIN FUNNEL PAGE ======================
  // ============================================================
  return (
    <div className="landing-page">
      {/* ===== SOCIAL PROOF TOAST ===== */}
      {jp<Record<string, unknown>>(product.landing_settings, {}).toast_enabled !== false && (
      <div className={`landing-toast ${showToast ? 'active' : ''}`}>
        {toast && (
          <>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #006233, #00A651)' }}>✓</div>
            <div className="min-w-0">
              <p className="text-[12px] font-bold truncate" style={{ color: '#2C1810' }}>{toast.name} من {toast.city}</p>
              <p className="text-[10px]" style={{ color: '#A67B5B' }}>اشترت هذا المنتج منذ {toast.ago}</p>
            </div>
          </>
        )}
      </div>
      )}

      {/* ===== LIGHTBOX ===== */}
      {lightbox !== null && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center text-xl z-10 hover:bg-white/20 transition">✕</button>
          <img src={allImages[lightbox]} alt="" className="max-w-[92vw] max-h-[88vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
          {allImages.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setLightbox(Math.max(0, lightbox - 1)); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center text-lg hover:bg-white/20">→</button>
              <button onClick={e => { e.stopPropagation(); setLightbox(Math.min(allImages.length - 1, lightbox + 1)); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center text-lg hover:bg-white/20">←</button>
            </>
          )}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">{lightbox + 1} / {allImages.length}</div>
        </div>
      )}

      {/* ===== ANNOUNCEMENT BAR ===== */}
      <div className="landing-announcement">
        <div className="landing-announcement-shine" />
        <p className="relative z-10 text-[11px] md:text-[12px] font-bold">
          {product.landing_offer_badge_ar || '🔥 عرض حصري لمدة محدودة — توصيل مجاني لجميع مدن المغرب'}
        </p>
      </div>

      {/* ===== NAV ===== */}
      <nav className="landing-nav">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-12">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9A94E, #8B5E3C)' }}><span className="text-white text-[11px] font-extrabold">F</span></div>
            <span className="text-[13px] font-bold" style={{ color: '#2C1810' }}>FAM.MA</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="landing-live-badge"><span className="landing-live-dot" />{liveViewers} يشاهدن</div>
            <button onClick={scrollToOrder} className="hidden md:block px-4 py-1.5 rounded-lg text-[11px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #C41E3A, #A01830)' }}>اطلبي الآن</button>
          </div>
        </div>
      </nav>

      {/* ===== CINEMATIC HERO ===== */}
      <section className="landing-hero">
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
            
            {/* ---- MEDIA ---- */}
            <div className="lg:col-span-7 space-y-3">
              {/* Main image */}
              <div className="landing-main-image" onTouchStart={swipeStart} onTouchEnd={swipeEnd}>
                {allImages.length > 0 ? (
                  <img src={allImages[activeImg]} alt={product.name_ar} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setLightbox(activeImg)} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: '#F5EDE0' }}><span className="text-8xl opacity-10">✦</span></div>
                )}
                {/* Badges */}
                {discount > 0 && <div className="landing-badge-discount">-{discount}%</div>}
                {product.is_new ? <div className="landing-badge-new">جديد</div> : null}
                {/* Arrows */}
                {allImages.length > 1 && (
                  <>
                    <button onClick={() => setActiveImg(Math.max(0, activeImg - 1))} className="landing-img-arrow right-3">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={() => setActiveImg(Math.min(allImages.length - 1, activeImg + 1))} className="landing-img-arrow left-3">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                      {allImages.map((_, i) => <button key={i} onClick={() => setActiveImg(i)} className={`landing-dot ${activeImg === i ? 'active' : ''}`} />)}
                    </div>
                  </>
                )}
                {/* Video play overlay */}
                {hasVideo && (
                  <button onClick={() => setVideoPlaying(true)} className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-[11px] font-bold backdrop-blur-md" style={{ background: 'rgba(196,30,58,0.85)' }}>
                    <svg className="w-3.5 h-3.5" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    شاهدي الفيديو
                  </button>
                )}
              </div>
              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 landing-thumb-strip">
                  {allImages.map((img, i) => (
                    <button key={i} onClick={() => setActiveImg(i)} className={`landing-thumb ${activeImg === i ? 'active' : ''}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  {hasVideo && (
                    <button onClick={() => setVideoPlaying(true)} className="landing-thumb video-thumb">
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl"><svg className="w-5 h-5" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
                      {allImages[0] && <img src={allImages[0]} alt="" className="w-full h-full object-cover" />}
                    </button>
                  )}
                </div>
              )}
              {/* Mobile social badges */}
              <div className="flex items-center justify-center gap-3 lg:hidden">
                <div className="landing-live-badge"><span className="landing-live-dot" />{liveViewers} يشاهدن الآن</div>
                <div className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-full" style={{ background: '#DCFCE7', color: '#166534' }}>✓ {todayOrders} طلب اليوم</div>
              </div>
            </div>

            {/* ---- PRODUCT INFO ---- */}
            <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-5">
              {/* Title block */}
              <div>
                {product.category_name_ar && <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full mb-2.5 tracking-wide uppercase" style={{ background: '#C9A94E15', color: '#C9A94E', border: '1px solid #C9A94E30' }}>{product.category_name_ar}</span>}
                <h1 className="text-[22px] md:text-[28px] font-extrabold leading-[1.3] font-amiri" style={{ color: '#2C1810' }}>{product.landing_title_ar || product.name_ar}</h1>
                {product.landing_subtitle_ar && <p className="text-[13px] mt-2 leading-relaxed" style={{ color: '#6B5D52' }}>{product.landing_subtitle_ar}</p>}
                <div className="flex items-center gap-2.5 mt-3">
                  <div className="flex">{[1,2,3,4,5].map(s => <span key={s} className="text-[13px]">★</span>)}</div>
                  <span className="text-[11px] font-semibold" style={{ color: '#A67B5B' }}>({todayOrders}+ تقييم)</span>
                </div>
              </div>

              {/* Price card */}
              <div className="landing-price-card">
                <div className="flex items-baseline gap-3">
                  <span className="text-[32px] font-black leading-none" style={{ color: '#C41E3A' }}>{product.price}<span className="text-sm font-bold mr-1">د.م</span></span>
                  {product.compare_price && (
                    <span className="text-sm line-through" style={{ color: '#BDB3A8' }}>{product.compare_price} د.م</span>
                  )}
                </div>
                {discount > 0 && (
                  <span className="inline-block mt-2 text-[11px] font-extrabold px-3 py-1 rounded-full text-white" style={{ background: 'linear-gradient(135deg, #C41E3A, #8B1A2B)' }}>🔥 وفّري {product.compare_price! - product.price} درهم</span>
                )}
                {/* Timer */}
                {jp<Record<string, unknown>>(product.landing_settings, {}).countdown_enabled !== false && (
                <div className="flex items-center gap-2.5 mt-4 pt-4" style={{ borderTop: '1px solid #F0E8DC' }}>
                  <span className="text-[11px] font-bold" style={{ color: '#C41E3A' }}>⏰ العرض ينتهي</span>
                  <div className="flex gap-1" dir="ltr">
                    {[{ v: countdown.h, l: 'سا' }, { v: countdown.m, l: 'دق' }, { v: countdown.s, l: 'ثا' }].map((t, i) => (
                      <div key={i} className="landing-timer-digit">
                        <span>{String(t.v).padStart(2, '0')}</span>
                        <small>{t.l}</small>
                      </div>
                    ))}
                  </div>
                </div>
                )}
                {/* Stock bar */}
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid #F0E8DC' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-extrabold" style={{ color: '#C41E3A' }}>⚡ يتبقى فقط</span>
                    <span className="text-[12px] font-black" style={{ color: '#2C1810' }}>{stockLeft} قطع</span>
                  </div>
                  <div className="landing-stock-bar"><div className="landing-stock-fill" style={{ width: `${(stockLeft / 15) * 100}%` }} /></div>
                </div>
              </div>

              {/* Options */}
              {sizes.length > 0 && (
                <div>
                  <p className="text-[12px] font-bold mb-2" style={{ color: '#2C1810' }}>المقاس</p>
                  <div className="flex flex-wrap gap-2">{sizes.map(s => (
                    <button key={s} onClick={() => setSelectedSize(s)} className={`landing-option ${selectedSize === s ? 'active' : ''}`}>{s}</button>
                  ))}</div>
                </div>
              )}
              {colors.length > 0 && (
                <div>
                  <p className="text-[12px] font-bold mb-2" style={{ color: '#2C1810' }}>اللون</p>
                  <div className="flex flex-wrap gap-2">{colors.map(c => (
                    <button key={c} onClick={() => setSelectedColor(c)} className={`landing-option ${selectedColor === c ? 'active' : ''}`}>{c}</button>
                  ))}</div>
                </div>
              )}

              {/* Qty */}
              <div className="flex items-center gap-4">
                <div className="landing-qty">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)}>+</button>
                </div>
                <div>
                  <span className="text-xl font-black block" style={{ color: '#C41E3A' }}>{total} د.م</span>
                  {quantity > 1 && <span className="text-[10px]" style={{ color: '#A67B5B' }}>{product.price} × {quantity}</span>}
                </div>
              </div>

              {/* CTA */}
              <button onClick={scrollToOrder} className="landing-cta">
                <span className="landing-cta-glow" />
                <span className="relative z-10 flex items-center justify-center gap-2 text-[15px]">
                  {product.landing_cta_ar || '🛒 اطلبي الآن — الدفع عند الاستلام'}
                </span>
              </button>

              {/* Trust row */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { i: '🚚', t: 'توصيل مجاني', d: 'لجميع المدن' },
                  { i: '💰', t: 'الدفع عند الاستلام', d: 'بدون أي مخاطرة' },
                  { i: '🛡️', t: 'ضمان 7 أيام', d: 'إرجاع مجاني' },
                  { i: '✅', t: 'منتج أصلي', d: 'جودة مضمونة' },
                ].map((x, i) => (
                  <div key={i} className="landing-trust-item">
                    <span className="text-base">{x.i}</span>
                    <div>
                      <p className="text-[11px] font-bold" style={{ color: '#2C1810' }}>{x.t}</p>
                      <p className="text-[9px]" style={{ color: '#A67B5B' }}>{x.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== VIDEO THEATER ===== */}
      {hasVideo && videoPlaying && (
        <div className="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center p-4" onClick={() => setVideoPlaying(false)}>
          <button onClick={() => setVideoPlaying(false)} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center text-xl z-10 hover:bg-white/20">✕</button>
          <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {videoUrl.includes('youtube') || videoUrl.includes('vimeo') ? (
              <iframe src={videoUrl + (videoUrl.includes('?') ? '&' : '?') + 'autoplay=1'} className="w-full h-full" allowFullScreen allow="autoplay" title="video" />
            ) : (
              <video src={videoUrl} className="w-full h-full object-contain bg-black" controls autoPlay playsInline />
            )}
          </div>
        </div>
      )}

      {/* ===== SOCIAL STATS BAR ===== */}
      <section className="landing-stats-bar">
        <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl md:text-3xl font-black" style={{ color: '#C9A94E' }}><AnimCounter end={todayOrders} suffix="+" /></div>
            <p className="text-[10px] md:text-[11px] mt-1 font-semibold" style={{ color: '#A67B5B' }}>طلب اليوم</p>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black" style={{ color: '#C9A94E' }}><AnimCounter end={98} suffix="%" /></div>
            <p className="text-[10px] md:text-[11px] mt-1 font-semibold" style={{ color: '#A67B5B' }}>نسبة الرضا</p>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-black" style={{ color: '#C9A94E' }}><AnimCounter end={5000} suffix="+" /></div>
            <p className="text-[10px] md:text-[11px] mt-1 font-semibold" style={{ color: '#A67B5B' }}>زبونة سعيدة</p>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      {features.length > 0 && (
        <FadeSection className="py-12 md:py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <SectionTitle title="لماذا تختارين هذا المنتج؟" sub="مميزات لا تجدينها في أي مكان آخر" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
              {features.map((f, i) => (
                <div key={i} className="landing-feature-card" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="landing-feature-num">{i + 1}</div>
                  <p className="text-[13px] font-semibold leading-relaxed flex-1" style={{ color: '#2C1810' }}>{f}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeSection>
      )}

      {/* ===== SPECIAL OFFERS ===== */}
      {activeOffers.length > 0 && (
        <FadeSection className="py-12 md:py-16" style={{ background: 'linear-gradient(135deg, #FDF8F0, #FFF7ED)' }}>
          <div className="max-w-4xl mx-auto px-4">
            <SectionTitle title="🏷️ عروض خاصة" sub="استفيدي من العروض الحصرية" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              {activeOffers.map((offer, i) => (
                <div key={i} className="relative rounded-2xl p-5 overflow-hidden" style={{ background: 'linear-gradient(135deg, #FFFFFF, #FDF8F0)', border: '2px solid #C9A94E', boxShadow: '0 4px 20px rgba(201,169,78,0.15)' }}>
                  <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'linear-gradient(90deg, #C9A94E, #C41E3A, #C9A94E)' }} />
                  {offer.discount && (
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-extrabold text-white" style={{ background: 'linear-gradient(135deg, #C41E3A, #A01830)', boxShadow: '0 2px 8px rgba(196,30,58,0.3)' }}>
                      {offer.discount}
                    </div>
                  )}
                  <div className="pt-2">
                    <h3 className="text-[15px] font-bold mb-2" style={{ color: '#2C1810' }}>{offer.title}</h3>
                    <p className="text-[12px] leading-[1.8]" style={{ color: '#6B5D52' }}>{offer.description}</p>
                  </div>
                  <button onClick={scrollToOrder} className="mt-4 w-full py-2.5 rounded-xl text-[12px] font-bold text-white transition hover:opacity-90" style={{ background: 'linear-gradient(135deg, #C41E3A, #A01830)' }}>
                    اطلبي الآن واستفيدي من العرض
                  </button>
                </div>
              ))}
            </div>
          </div>
        </FadeSection>
      )}

      {/* ===== DESCRIPTION ===== */}
      {product.description_ar && (
        <FadeSection className="py-12 md:py-16">
          <div className="max-w-3xl mx-auto px-4">
            <SectionTitle title="تفاصيل المنتج" />
            <div className="landing-desc-card">
              <p className="text-[13px] leading-[2.2] whitespace-pre-line" style={{ color: '#4A3228' }}>{product.description_ar}</p>
            </div>
          </div>
        </FadeSection>
      )}

      {/* ===== DETAIL IMAGES ===== */}
      {detailImages.length > 0 && (
        <FadeSection className="py-12 md:py-16 bg-white">
          <div className="max-w-3xl mx-auto px-4">
            <SectionTitle title="تفاصيل و مميزات المنتج" sub="صور عن قرب لجودة المنتج" />
            <div className="flex flex-col gap-4 mt-8">
              {detailImages.map((img, i) => (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ border: '2px solid #F0E8DC', boxShadow: '0 6px 24px rgba(139,94,60,0.1)' }}>
                  <img src={img} alt={`تفاصيل ${product.name_ar} ${i + 1}`} className="w-full h-auto" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </FadeSection>
      )}

      {/* ===== GALLERY GRID ===== */}
      {allImages.length > 1 && (
        <FadeSection className="py-12 md:py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <SectionTitle title="معرض الصور" sub="اضغطي على أي صورة للتكبير" />
            <div className="landing-gallery-grid mt-8">
              {allImages.map((img, i) => (
                <div key={i} onClick={() => setLightbox(i)} className={`landing-gallery-item ${i === 0 ? 'lg:row-span-2 lg:col-span-2' : ''}`}>
                  <img src={img} alt={`${product.name_ar} ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                  <div className="landing-gallery-overlay"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg></div>
                </div>
              ))}
            </div>
          </div>
        </FadeSection>
      )}

      {/* ===== EXTRA SECTIONS ===== */}
      {extras.map((sec, i) => (
        <FadeSection key={i} className={`py-12 md:py-16 ${i % 2 === 0 ? '' : 'bg-white'}`}>
          <div className="max-w-4xl mx-auto px-4">
            <SectionTitle title={sec.title} />
            <div className={sec.image ? 'grid grid-cols-1 md:grid-cols-2 gap-6 items-center mt-8' : 'mt-8'}>
              {sec.image && <div className="rounded-2xl overflow-hidden shadow-lg"><img src={sec.image} alt={sec.title} className="w-full h-auto" /></div>}
              <div className="landing-desc-card !mt-0"><p className="text-[13px] leading-[2] whitespace-pre-line" style={{ color: '#4A3228' }}>{sec.content}</p></div>
            </div>
          </div>
        </FadeSection>
      ))}

      {/* ===== TESTIMONIALS ===== */}
      {testimonials.length > 0 && (
        <FadeSection className="py-12 md:py-16 overflow-hidden" style={{ background: 'linear-gradient(180deg, #FFFFFF, #FDF8F0)' }}>
          <div className="max-w-5xl mx-auto px-4">
            <SectionTitle title="ماذا تقول زبوناتنا؟" sub={`أكثر من ${todayOrders * 10}+ تقييم إيجابي`} />
            {/* Carousel */}
            <div className="mt-8 relative">
              <div className="overflow-hidden"
                onTouchStart={e => setTestimonialTouchX(e.touches[0].clientX)}
                onTouchEnd={e => {
                  const d = testimonialTouchX - e.changedTouches[0].clientX;
                  if (Math.abs(d) > 50) {
                    if (d > 0) setTestimonialIdx(Math.min(testimonials.length - 1, testimonialIdx + 1));
                    else setTestimonialIdx(Math.max(0, testimonialIdx - 1));
                  }
                }}
              >
                <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(${testimonialIdx * (100 / Math.min(testimonials.length, 1))}%)` }}>
                  {testimonials.map((t, i) => (
                    <div key={i} className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0 px-2">
                      <div className="landing-testimonial-card">
                        <div className="flex gap-0.5 mb-3">{[...Array(5)].map((_, s) => <span key={s} className={`text-[13px] ${s < t.rating ? '' : 'opacity-20'}`}>★</span>)}</div>
                        <p className="text-[12px] leading-[1.9] mb-4" style={{ color: '#4A3228' }}>&ldquo;{t.text}&rdquo;</p>
                        <div className="flex items-center gap-2.5 pt-3 mt-auto" style={{ borderTop: '1px solid #F0E8DC' }}>
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold" style={{ background: 'linear-gradient(135deg, #8B5E3C, #C9A94E)' }}>{t.name[0]}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold truncate" style={{ color: '#2C1810' }}>{t.name}</p>
                            <p className="text-[9px]" style={{ color: '#A67B5B' }}>📍 {t.city}</p>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: '#DCFCE7', color: '#166534' }}>✓ مشترية</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {testimonials.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-5">
                  {testimonials.map((_, i) => <button key={i} onClick={() => setTestimonialIdx(i)} className={`w-2 h-2 rounded-full transition-all ${testimonialIdx === i ? 'w-6' : ''}`} style={{ background: testimonialIdx === i ? '#8B5E3C' : '#E8C9A0' }} />)}
                </div>
              )}
            </div>
          </div>
        </FadeSection>
      )}

      {/* ===== GUARANTEE ===== */}
      <FadeSection className="py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="landing-guarantee">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9A94E, #E0C976)', boxShadow: '0 8px 24px rgba(201,169,78,0.3)' }}>
              <span className="text-3xl">🛡️</span>
            </div>
            <h3 className="text-xl font-bold mb-3 font-amiri" style={{ color: '#2C1810' }}>ضمان الرضا الكامل 100%</h3>
            <p className="text-[13px] max-w-lg mx-auto leading-[1.9]" style={{ color: '#6B5D52' }}>نحن واثقون من جودة منتجاتنا. إذا لم يناسبك المنتج لأي سبب، يمكنك إرجاعه خلال 7 أيام واسترجاع أموالك كاملة بدون أي أسئلة.</p>
            <div className="flex flex-wrap justify-center gap-5 mt-6">
              {['✓ ضمان الجودة', '✓ إرجاع مجاني', '✓ توصيل آمن', '✓ دعم 24/7'].map((g, i) => (
                <span key={i} className="text-[11px] font-bold" style={{ color: '#006233' }}>{g}</span>
              ))}
            </div>
          </div>
        </div>
      </FadeSection>

      {/* ===== FAQ ===== */}
      {faqs.length > 0 && (
        <FadeSection className="py-12 md:py-16 bg-white">
          <div className="max-w-3xl mx-auto px-4">
            <SectionTitle title="أسئلة شائعة" />
            <div className="mt-8 space-y-2.5">
              {faqs.map((faq, i) => (
                <div key={i} className="landing-faq-item">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 text-right">
                    <span className="text-[13px] font-bold flex-1" style={{ color: '#2C1810' }}>{faq.question}</span>
                    <div className={`landing-faq-icon ${openFaq === i ? 'open' : ''}`}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </button>
                  <div className={`landing-faq-answer ${openFaq === i ? 'open' : ''}`}>
                    <div className="px-4 pb-4"><p className="text-[12px] leading-[1.9]" style={{ color: '#6B5D52' }}>{faq.answer}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeSection>
      )}

      {/* ===== HOW TO ORDER ===== */}
      <section className="py-12 md:py-16" style={{ background: 'linear-gradient(135deg, #2C1810, #1a0f09)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-1 font-amiri">كيف تطلبين؟</h2>
          <p className="text-white/30 text-[11px] mb-8">3 خطوات سهلة</p>
          <div className="grid grid-cols-3 gap-3 md:gap-6">
            {[
              { n: '١', icon: '🖱️', t: 'اختاري', d: 'حددي المقاس و اللون' },
              { n: '٢', icon: '📝', t: 'أكملي الطلب', d: 'أدخلي بياناتك' },
              { n: '٣', icon: '📦', t: 'استلمي وادفعي', d: '24-48 ساعة' },
            ].map((s, i) => (
              <div key={i} className="landing-step-card">
                <div className="landing-step-num">{s.n}</div>
                <span className="text-2xl md:text-3xl block mt-3 mb-2">{s.icon}</span>
                <h3 className="font-bold text-[12px] text-white mb-0.5">{s.t}</h3>
                <p className="text-white/30 text-[10px]">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== INLINE ORDER FORM ===== */}
      <section className="py-12 md:py-16" style={{ background: 'linear-gradient(180deg, #FDF8F0, #F5EDE0)' }} ref={orderRef}>
        <div className="max-w-xl mx-auto px-4">
          <div className="landing-order-card">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold font-amiri mb-1" style={{ color: '#2C1810' }}>أكملي طلبك الآن</h2>
              <p className="text-[11px]" style={{ color: '#A67B5B' }}>💰 الدفع عند الاستلام — توصيل مجاني</p>
            </div>
            {/* Product summary */}
            <div className="flex items-center gap-3 p-3 rounded-xl mb-5" style={{ background: '#FDF8F0' }}>
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-sm" style={{ background: '#F5EDE0' }}>
                {product.main_image ? <img src={product.main_image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm">✦</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold truncate" style={{ color: '#2C1810' }}>{product.name_ar}</p>
                <p className="text-[10px]" style={{ color: '#A67B5B' }}>{[selectedSize, selectedColor].filter(Boolean).join(' · ')}{quantity > 1 ? ` · ×${quantity}` : ''}</p>
              </div>
              <div className="text-left flex-shrink-0">
                <p className="text-[15px] font-black" style={{ color: '#C41E3A' }}>{total} د.م</p>
                {product.compare_price && <p className="text-[10px] line-through" style={{ color: '#BDB3A8' }}>{product.compare_price * quantity} د.م</p>}
              </div>
            </div>
            {/* Form */}
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="landing-label">الاسم الكامل *</label>
                <input type="text" required value={orderForm.customer_name} onChange={e => setOrderForm(p => ({ ...p, customer_name: e.target.value }))} className="landing-input" placeholder="مثال: فاطمة المحمدي" />
              </div>
              <div>
                <label className="landing-label">رقم الهاتف *</label>
                <input type="tel" required value={orderForm.customer_phone} onChange={e => setOrderForm(p => ({ ...p, customer_phone: e.target.value }))} className="landing-input" style={{ direction: 'ltr', textAlign: 'right' }} placeholder="06XXXXXXXX" />
              </div>
              <div>
                <label className="landing-label">المدينة *</label>
                <select required value={orderForm.customer_city} onChange={e => setOrderForm(p => ({ ...p, customer_city: e.target.value }))} className="landing-input">
                  <option value="">اختاري مدينتك</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="landing-label">العنوان الكامل *</label>
                <textarea required value={orderForm.customer_address} onChange={e => setOrderForm(p => ({ ...p, customer_address: e.target.value }))} className="landing-input" rows={2} placeholder="الحي، الشارع، رقم المنزل..." />
              </div>
              <div>
                <label className="landing-label">ملاحظات <span className="text-[10px] font-normal">(اختياري)</span></label>
                <input type="text" value={orderForm.notes} onChange={e => setOrderForm(p => ({ ...p, notes: e.target.value }))} className="landing-input" placeholder="أي ملاحظات إضافية..." />
              </div>
              {orderError && <div className="p-3 rounded-xl text-[12px] font-bold text-center" style={{ background: '#FEE2E2', color: '#C41E3A' }}>{orderError}</div>}
              
              {/* Summary */}
              <div className="rounded-xl overflow-hidden mt-2" style={{ border: '1px solid #F0E8DC' }}>
                <div className="flex justify-between p-3" style={{ background: '#FDF8F0' }}>
                  <span className="text-[12px] font-semibold" style={{ color: '#4A3228' }}>المنتج ({quantity}×)</span>
                  <span className="text-[12px] font-bold" style={{ color: '#2C1810' }}>{total} د.م</span>
                </div>
                <div className="flex justify-between p-3 bg-white">
                  <span className="text-[12px]" style={{ color: '#A67B5B' }}>التوصيل</span>
                  <span className="text-[12px] font-bold" style={{ color: '#006233' }}>مجاني ✓</span>
                </div>
                <div className="flex justify-between p-3" style={{ background: 'linear-gradient(135deg, #2C1810, #4A3228)' }}>
                  <span className="text-[13px] font-bold text-white">المجموع</span>
                  <span className="text-[17px] font-black text-white">{total} د.م</span>
                </div>
              </div>

              <button type="submit" disabled={submitting} className="landing-cta w-full !rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed">
                <span className="landing-cta-glow" />
                <span className="relative z-10 text-[15px]">{submitting ? '⏳ جاري الإرسال...' : '✅ تأكيد الطلب — الدفع عند الاستلام'}</span>
              </button>

              <div className="flex items-center justify-center gap-4 text-[10px] pt-1" style={{ color: '#A67B5B' }}>
                <span>🔒 بياناتك آمنة</span>
                <span>💰 ادفعي عند الاستلام</span>
                <span>🚚 توصيل مجاني</span>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ===== STICKY MOBILE CTA ===== */}
      <div className="landing-sticky-cta">
        <div className="flex items-center gap-3 px-4 pb-3 pt-5">
          <button onClick={scrollToOrder} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-extrabold text-white active:scale-[0.97] transition-all" style={{ background: 'linear-gradient(135deg, #C41E3A, #8B1A2B)', boxShadow: '0 4px 16px rgba(196,30,58,0.3)' }}>
            <span>اطلبي الآن</span>
            <span className="opacity-80">·</span>
            <span>{total} د.م</span>
          </button>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <footer className="py-8 text-center pb-24 md:pb-8" style={{ background: '#1a0f09' }}>
        <p className="text-white/20 text-[11px]">© {new Date().getFullYear()} FAM.MA — جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
}

// ============ Section Components ============
function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="text-center">
      <h2 className="text-lg md:text-xl font-bold font-amiri" style={{ color: '#2C1810' }}>{title}</h2>
      {sub && <p className="text-[11px] mt-1" style={{ color: '#A67B5B' }}>{sub}</p>}
      <div className="landing-divider" />
    </div>
  );
}

function FadeSection({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const { ref, visible } = useInView(0.1);
  return <section ref={ref} className={`${className} ${visible ? 'landing-visible' : 'landing-hidden'}`} style={style}>{children}</section>;
}
