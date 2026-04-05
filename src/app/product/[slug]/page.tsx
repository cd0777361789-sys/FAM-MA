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

const SOCIAL_PROOF_NAMES = ['فاطمة', 'نجاة', 'سعاد', 'كريمة', 'حسناء', 'مريم', 'زينب', 'أمينة', 'خديجة', 'ليلى', 'سلمى', 'هند', 'رانيا', 'إيمان', 'وفاء'];
const SOCIAL_PROOF_CITIES = ['الدار البيضاء', 'الرباط', 'مراكش', 'فاس', 'طنجة', 'أكادير', 'مكناس', 'تطوان', 'القنيطرة', 'سلا'];

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
  const [touchStart, setTouchStart] = useState(0);
  const [viewingNow, setViewingNow] = useState(0);
  const [recentOrders, setRecentOrders] = useState(0);
  const [socialProof, setSocialProof] = useState<{ name: string; city: string; time: string } | null>(null);
  const [showSocialProof, setShowSocialProof] = useState(false);
  const [mediaTab, setMediaTab] = useState<'images' | 'video'>('images');
  const [playingVideo, setPlayingVideo] = useState(false);
  const [stockLeft, setStockLeft] = useState(0);
  const imgRef = useRef<HTMLDivElement>(null);

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
        setStockLeft(Math.max(3, Math.min(prod.stock || 12, 15)));
      }
      setSettings(setts || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.slug]);

  // Countdown timer
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

  // Live viewers simulation
  useEffect(() => {
    setViewingNow(Math.floor(Math.random() * 15) + 18);
    setRecentOrders(Math.floor(Math.random() * 20) + 35);
    const t = setInterval(() => {
      setViewingNow(p => p + (Math.random() > 0.5 ? 1 : -1));
    }, 8000);
    return () => clearInterval(t);
  }, []);

  // Social proof notifications
  useEffect(() => {
    const show = () => {
      const name = SOCIAL_PROOF_NAMES[Math.floor(Math.random() * SOCIAL_PROOF_NAMES.length)];
      const city = SOCIAL_PROOF_CITIES[Math.floor(Math.random() * SOCIAL_PROOF_CITIES.length)];
      const times = ['منذ دقيقتين', 'منذ 5 دقائق', 'منذ 8 دقائق', 'منذ 12 دقيقة', 'منذ ربع ساعة'];
      const time = times[Math.floor(Math.random() * times.length)];
      setSocialProof({ name, city, time });
      setShowSocialProof(true);
      setTimeout(() => setShowSocialProof(false), 4000);
    };
    const t1 = setTimeout(show, 5000);
    const t2 = setInterval(show, 25000);
    return () => { clearTimeout(t1); clearInterval(t2); };
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
  const hasVideo = !!videoUrl;

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && activeImage < allImages.length - 1) setActiveImage(activeImage + 1);
      else if (diff < 0 && activeImage > 0) setActiveImage(activeImage - 1);
    }
  };

  const scrollToOrder = () => setShowOrderForm(true);

  // ============ SUCCESS PAGE ============
  if (orderSuccess) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#FDF8F0' }}>
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center animate-scale-in">
        <div className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #006233, #00A651)' }}>
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-2xl font-bold mb-1 font-amiri" style={{ color: '#2C1810' }}>تم تأكيد طلبك بنجاح! 🎉</h2>
        <p className="text-sm mb-5" style={{ color: '#4A3228' }}>شكراً لثقتك في FAM.MA — سنتواصل معك قريباً</p>
        <div className="p-4 rounded-2xl mb-5" style={{ backgroundColor: '#FDF8F0', border: '2px dashed #C9A94E' }}>
          <p className="text-xs mb-1" style={{ color: '#4A3228' }}>رقم الطلب</p>
          <p className="text-2xl font-extrabold" style={{ color: '#8B5E3C' }}>{orderSuccess}</p>
          <p className="text-[10px] mt-1" style={{ color: '#A67B5B' }}>احتفظي بهذا الرقم للمتابعة</p>
        </div>
        <div className="space-y-2">
          <Link href="/" className="btn-moroccan w-full block text-center py-3 rounded-xl text-sm">تسوقي المزيد</Link>
          {settings.site_whatsapp && (
            <a href={`https://wa.me/${settings.site_whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('مرحباً، طلبي رقم ' + orderSuccess)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full text-center py-3 rounded-xl font-bold text-sm" style={{ backgroundColor: '#25D366', color: 'white' }}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
              تواصلي عبر الواتساب
            </a>
          )}
        </div>
      </div>
    </div>
  );

  // ============ MAIN LANDING PAGE ============
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDF8F0' }}>
      {/* ===== Social Proof Toast ===== */}
      <div className={`social-proof-toast ${showSocialProof ? 'show' : ''}`}>
        {socialProof && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #006233, #00A651)' }}>✓</div>
            <div>
              <p className="text-xs font-bold" style={{ color: '#2C1810' }}>{socialProof.name} من {socialProof.city}</p>
              <p className="text-[10px]" style={{ color: '#A67B5B' }}>طلبت هذا المنتج {socialProof.time}</p>
            </div>
          </div>
        )}
      </div>

      {/* ===== Urgency Top Banner ===== */}
      <div className="relative overflow-hidden text-white text-center py-2 px-4" style={{ background: 'linear-gradient(90deg, #C41E3A, #8B1A2B, #C41E3A)' }}>
        <div className="shimmer absolute inset-0" />
        <p className="text-[12px] font-bold relative z-10">
          {offerBadge || '🔥 عرض محدود — توصيل مجاني لجميع المدن | الدفع عند الاستلام'}
        </p>
      </div>

      {/* ===== Header ===== */}
      <header className="glass shadow-sm py-2.5 px-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, #8B5E3C, #C9A94E)' }}>
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="font-bold text-sm" style={{ color: '#6B4226' }}>FAM.MA</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#FEE2E2', color: '#C41E3A' }}>
              <span className="live-dot" />
              {viewingNow} يشاهدن الآن
            </div>
            <div className="cod-badge text-xs">💰 عند الاستلام</div>
          </div>
        </div>
      </header>

      {/* ===== HERO: Product Media + Info ===== */}
      <section className="py-4 md:py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-10">

            {/* === Media Column === */}
            <div className="space-y-3">
              {/* Media Tabs (if video exists) */}
              {hasVideo && (
                <div className="flex gap-1.5 mb-1">
                  <button onClick={() => { setMediaTab('images'); setPlayingVideo(false); }} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${mediaTab === 'images' ? 'text-white shadow-sm' : ''}`} style={mediaTab === 'images' ? { backgroundColor: '#8B5E3C' } : { backgroundColor: 'white', color: '#4A3228', border: '1px solid #E8C9A0' }}>
                    📸 الصور {allImages.length > 0 && <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{allImages.length}</span>}
                  </button>
                  <button onClick={() => { setMediaTab('video'); setPlayingVideo(true); }} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${mediaTab === 'video' ? 'text-white shadow-sm' : ''}`} style={mediaTab === 'video' ? { backgroundColor: '#C41E3A' } : { backgroundColor: 'white', color: '#4A3228', border: '1px solid #E8C9A0' }}>
                    🎥 الفيديو
                  </button>
                </div>
              )}

              {/* Image Gallery */}
              {(mediaTab === 'images' || !hasVideo) && (
                <>
                  <div ref={imgRef} className="relative rounded-2xl overflow-hidden bg-white shadow-sm aspect-square" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                    {allImages.length > 0 ? (
                      <img src={allImages[activeImage] || allImages[0]} alt={product.name_ar} className="w-full h-full object-cover transition-all duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#F5EDE0' }}><span className="text-7xl opacity-20">✦</span></div>
                    )}
                    {discount > 0 && <div className="absolute top-3 right-3 text-white font-extrabold px-3 py-1.5 rounded-xl text-sm z-10 shadow-lg" style={{ background: 'linear-gradient(135deg, #C41E3A, #8B1A2B)' }}>-{discount}%</div>}
                    {product.is_new ? <div className="absolute top-3 left-3 text-white font-bold px-3 py-1 rounded-xl text-xs" style={{ backgroundColor: '#006233' }}>جديد ✨</div> : null}
                    {allImages.length > 1 && (
                      <>
                        <button onClick={() => setActiveImage(Math.max(0, activeImage - 1))} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-md hover:bg-white transition opacity-0 md:opacity-100 md:hover:opacity-100" style={{ color: '#2C1810' }}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        </button>
                        <button onClick={() => setActiveImage(Math.min(allImages.length - 1, activeImage + 1))} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-md hover:bg-white transition opacity-0 md:opacity-100 md:hover:opacity-100" style={{ color: '#2C1810' }}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/40 text-white text-[11px] px-2.5 py-0.5 rounded-full backdrop-blur-sm">{activeImage + 1}/{allImages.length}</div>
                      </>
                    )}
                  </div>
                  {allImages.length > 1 && (
                    <>
                      <div className="flex justify-center gap-1.5 md:hidden">
                        {allImages.map((_, i) => <button key={i} onClick={() => setActiveImage(i)} className={`img-dot ${activeImage === i ? 'active' : ''}`} />)}
                      </div>
                      <div className="hidden md:flex gap-2 overflow-x-auto pb-1">
                        {allImages.map((img, i) => (
                          <button key={i} onClick={() => setActiveImage(i)} className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 transition-all ${activeImage === i ? 'ring-2 ring-[#8B5E3C] ring-offset-2 scale-105' : 'opacity-50 hover:opacity-80'}`}>
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Video Player */}
              {mediaTab === 'video' && hasVideo && (
                <div className="rounded-2xl overflow-hidden shadow-sm bg-black aspect-video relative">
                  {videoUrl.includes('youtube') || videoUrl.includes('vimeo') ? (
                    <iframe src={videoUrl + (videoUrl.includes('?') ? '&' : '?') + 'autoplay=1'} className="w-full h-full" allowFullScreen allow="autoplay" title="فيديو المنتج" />
                  ) : (
                    <video src={videoUrl} className="w-full h-full object-cover" controls autoPlay playsInline />
                  )}
                </div>
              )}

              {/* Mobile Viewers Badge */}
              <div className="flex items-center justify-center gap-4 md:hidden">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: '#FEE2E2', color: '#C41E3A' }}>
                  <span className="live-dot" /> {viewingNow} يشاهدن الآن
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>
                  ✓ {recentOrders} طلب اليوم
                </div>
              </div>
            </div>

            {/* === Info Column === */}
            <div className="space-y-4">
              {/* Category + Title */}
              <div>
                {product.category_name_ar && <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full mb-2" style={{ backgroundColor: '#C9A94E20', color: '#C9A94E' }}>{product.category_name_ar}</span>}
                <h1 className="text-2xl md:text-3xl font-bold font-amiri leading-tight" style={{ color: '#2C1810' }}>{product.landing_title_ar || product.name_ar}</h1>
                {product.landing_subtitle_ar && <p className="text-sm mt-1.5 leading-relaxed" style={{ color: '#4A3228' }}>{product.landing_subtitle_ar}</p>}
                {/* Star rating */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <span key={s} className="text-sm">⭐</span>)}</div>
                  <span className="text-xs font-semibold" style={{ color: '#A67B5B' }}>({recentOrders}+ طلب)</span>
                </div>
              </div>

              {/* Price Block */}
              <div className="rounded-2xl p-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #FFFFFF, #FDF8F0)', border: '2px solid #F5EDE0' }}>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-3xl font-extrabold" style={{ color: '#C41E3A' }}>{product.price} <span className="text-base">د.م</span></span>
                  {product.compare_price && (
                    <>
                      <span className="text-base line-through opacity-40">{product.compare_price} د.م</span>
                      <span className="text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse" style={{ backgroundColor: '#C41E3A' }}>وفري {product.compare_price - product.price} د.م</span>
                    </>
                  )}
                </div>
                {/* Countdown */}
                <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #F5EDE0' }}>
                  <span className="text-xs font-semibold" style={{ color: '#C41E3A' }}>⏰ ينتهي العرض خلال</span>
                  <div className="flex gap-1" dir="ltr">
                    {[{ v: countdown.hours, l: 'س' }, { v: countdown.minutes, l: 'د' }, { v: countdown.seconds, l: 'ث' }].map((t, i) => (
                      <div key={i} className="text-center">
                        <span className="text-sm font-extrabold px-2 py-1 rounded-lg inline-block min-w-[32px]" style={{ backgroundColor: '#2C1810', color: '#C9A94E' }}>{String(t.v).padStart(2, '0')}</span>
                        <span className="block text-[8px] font-bold mt-0.5" style={{ color: '#A67B5B' }}>{t.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Stock indicator */}
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid #F5EDE0' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold" style={{ color: '#C41E3A' }}>🔥 الكمية المتبقية محدودة!</span>
                    <span className="text-[11px] font-bold" style={{ color: '#2C1810' }}>{stockLeft} قطع فقط</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#FEE2E2' }}>
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (stockLeft / 15) * 100)}%`, background: stockLeft <= 5 ? '#C41E3A' : 'linear-gradient(90deg, #C41E3A, #E8365A)' }} />
                  </div>
                </div>
              </div>

              {/* Size & Color */}
              {sizes.length > 0 && (
                <div>
                  <label className="form-label">اختاري المقاس:</label>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map(s => <button key={s} onClick={() => setSelectedSize(s)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedSize === s ? 'text-white shadow-md scale-105' : 'bg-white hover:bg-[#F5EDE0]'}`} style={selectedSize === s ? { background: 'linear-gradient(135deg, #8B5E3C, #6B4226)' } : { border: '2px solid #E8C9A0', color: '#4A3228' }}>{s}</button>)}
                  </div>
                </div>
              )}

              {colors.length > 0 && (
                <div>
                  <label className="form-label">اختاري اللون:</label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map(c => <button key={c} onClick={() => setSelectedColor(c)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedColor === c ? 'text-white shadow-md scale-105' : 'bg-white hover:bg-[#F5EDE0]'}`} style={selectedColor === c ? { background: 'linear-gradient(135deg, #8B5E3C, #6B4226)' } : { border: '2px solid #E8C9A0', color: '#4A3228' }}>{c}</button>)}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="form-label">الكمية:</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-white rounded-xl overflow-hidden shadow-sm" style={{ border: '2px solid #E8C9A0' }}>
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-11 h-11 flex items-center justify-center text-lg font-bold hover:bg-[#F5EDE0] transition" style={{ color: '#8B5E3C' }}>−</button>
                    <span className="w-11 text-center text-base font-extrabold" style={{ color: '#2C1810' }}>{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-11 h-11 flex items-center justify-center text-lg font-bold hover:bg-[#F5EDE0] transition" style={{ color: '#8B5E3C' }}>+</button>
                  </div>
                  <div>
                    <span className="text-xl font-extrabold block" style={{ color: '#C41E3A' }}>{totalPrice} د.م</span>
                    {quantity > 1 && <span className="text-[10px]" style={{ color: '#A67B5B' }}>{product.price} × {quantity}</span>}
                  </div>
                </div>
              </div>

              {/* Main CTA */}
              <button onClick={scrollToOrder} className="cta-main w-full">
                <span className="cta-shine" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>{product.landing_cta_ar || 'اطلبي الآن — الدفع عند الاستلام'}</span>
                  <span className="text-xl">💰</span>
                </span>
              </button>

              {/* Trust Grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: '🚚', title: 'توصيل مجاني', sub: 'لجميع مدن المغرب' },
                  { icon: '💰', title: 'الدفع عند الاستلام', sub: 'بدون بطاقة بنكية' },
                  { icon: '✅', title: 'منتج أصلي 100%', sub: 'ضمان الجودة' },
                  { icon: '↩️', title: 'إرجاع مجاني', sub: 'خلال 7 أيام' },
                ].map((t, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white" style={{ border: '1px solid #F5EDE0' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{t.icon}</span>
                      <div>
                        <p className="text-xs font-bold" style={{ color: '#2C1810' }}>{t.title}</p>
                        <p className="text-[10px]" style={{ color: '#A67B5B' }}>{t.sub}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      {features.length > 0 && (
        <section className="py-10 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <SH title="لماذا هذا المنتج مميز؟" emoji="✨" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl animate-fade-in-up" style={{ backgroundColor: '#FDF8F0', animationDelay: `${i * 0.1}s` }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'linear-gradient(135deg, #006233, #00A651)' }}>
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <p className="text-sm font-semibold leading-relaxed" style={{ color: '#2C1810' }}>{f}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Description ===== */}
      {product.description_ar && (
        <section className="py-10">
          <div className="max-w-4xl mx-auto px-4">
            <SH title="تفاصيل المنتج" emoji="📋" />
            <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: '1px solid #F5EDE0' }}>
              <p className="text-sm leading-[2] whitespace-pre-line" style={{ color: '#4A3228' }}>{product.description_ar}</p>
            </div>
          </div>
        </section>
      )}

      {/* ===== Media Gallery ===== */}
      {(allImages.length > 1 || hasVideo) && (
        <section className="py-10 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <SH title="شاهدي المنتج بالتفصيل" emoji="📸" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Video tile first if exists */}
              {hasVideo && (
                <div className="col-span-2 md:col-span-1 relative rounded-2xl overflow-hidden shadow-sm cursor-pointer group aspect-video md:aspect-square" onClick={() => { setMediaTab('video'); setPlayingVideo(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  {allImages[0] ? (
                    <img src={allImages[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full" style={{ backgroundColor: '#F5EDE0' }} />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 mr-[-2px]" fill="#C41E3A" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">🎥 فيديو</div>
                </div>
              )}
              {/* Image tiles */}
              {allImages.slice(0, hasVideo ? 5 : 6).map((img, i) => (
                <div key={i} className="relative rounded-2xl overflow-hidden shadow-sm cursor-pointer group aspect-square" onClick={() => { setActiveImage(i); setMediaTab('images'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  <img src={img} alt={`${product.name_ar} - ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Video Section (standalone if no gallery) ===== */}
      {hasVideo && allImages.length <= 1 && (
        <section className="py-10 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <SH title="شاهدي المنتج" emoji="🎥" />
            <div className="rounded-2xl overflow-hidden shadow-lg aspect-video relative">
              {!playingVideo ? (
                <div className="relative w-full h-full cursor-pointer" onClick={() => setPlayingVideo(true)}>
                  {allImages[0] && <img src={allImages[0]} alt="" className="w-full h-full object-cover" />}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                      <svg className="w-7 h-7 mr-[-2px]" fill="#C41E3A" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                </div>
              ) : videoUrl.includes('youtube') || videoUrl.includes('vimeo') ? (
                <iframe src={videoUrl + (videoUrl.includes('?') ? '&' : '?') + 'autoplay=1'} className="w-full h-full" allowFullScreen allow="autoplay" title="فيديو" />
              ) : (
                <video src={videoUrl} className="w-full h-full object-cover" controls autoPlay playsInline />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ===== Extra Sections ===== */}
      {extraSections.map((sec, i) => (
        <section key={i} className={`py-10 ${i % 2 === 0 ? '' : 'bg-white'}`}>
          <div className="max-w-4xl mx-auto px-4">
            <SH title={sec.title} />
            <div className={sec.image ? 'grid grid-cols-1 md:grid-cols-2 gap-6 items-center' : ''}>
              {sec.image && <div className="rounded-2xl overflow-hidden shadow-sm"><img src={sec.image} alt={sec.title} className="w-full h-auto" /></div>}
              <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: '1px solid #F5EDE0' }}><p className="text-sm leading-[1.9] whitespace-pre-line" style={{ color: '#4A3228' }}>{sec.content}</p></div>
            </div>
          </div>
        </section>
      ))}

      {/* ===== Testimonials ===== */}
      {testimonials.length > 0 && (
        <section className="py-10 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <SH title="زبوناتنا يشهدن" emoji="💬" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {testimonials.map((t, i) => (
                <div key={i} className="p-4 rounded-2xl relative overflow-hidden" style={{ backgroundColor: '#FDF8F0', border: '1px solid #F5EDE0' }}>
                  <div className="absolute top-2 right-3 text-4xl opacity-5 font-amiri">&ldquo;</div>
                  <div className="flex gap-0.5 mb-2 text-sm">{[...Array(5)].map((_, s) => <span key={s} className={s < t.rating ? '' : 'opacity-20'}>⭐</span>)}</div>
                  <p className="text-xs leading-relaxed mb-3 relative" style={{ color: '#4A3228' }}>&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid #E8C9A0' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #8B5E3C, #C9A94E)' }}>{t.name.charAt(0)}</div>
                    <div>
                      <p className="text-xs font-bold" style={{ color: '#2C1810' }}>{t.name}</p>
                      <p className="text-[10px]" style={{ color: '#A67B5B' }}>📍 {t.city}</p>
                    </div>
                    <span className="mr-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>✓ مشترية</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Guarantee Section ===== */}
      <section className="py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="rounded-2xl p-6 md:p-8 text-center" style={{ background: 'linear-gradient(135deg, #FDF8F0, #FFFFFF)', border: '2px solid #C9A94E40' }}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9A94E, #E0C976)' }}>
              <span className="text-2xl">🛡️</span>
            </div>
            <h3 className="text-lg font-bold mb-2 font-amiri" style={{ color: '#2C1810' }}>ضمان الرضا 100%</h3>
            <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: '#4A3228' }}>
              إذا لم يعجبك المنتج، يمكنك إرجاعه خلال 7 أيام واسترجاع أموالك كاملة. نحن واثقون من جودة منتجاتنا.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-5">
              {['✓ منتج أصلي', '✓ توصيل آمن', '✓ إرجاع مضمون'].map((g, i) => (
                <span key={i} className="text-xs font-bold" style={{ color: '#006233' }}>{g}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      {faqs.length > 0 && (
        <section className="py-10 bg-white">
          <div className="max-w-3xl mx-auto px-4">
            <SH title="أسئلة شائعة" emoji="❓" />
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FDF8F0', border: '1px solid #F5EDE0' }}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 text-right">
                    <span className="font-bold text-sm" style={{ color: '#2C1810' }}>{faq.question}</span>
                    <svg className={`w-4 h-4 flex-shrink-0 mr-3 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="#C9A94E" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-96 pb-4 px-4' : 'max-h-0'}`}>
                    <p className="text-sm leading-relaxed" style={{ color: '#4A3228' }}>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== How to Order === */}
      <section className="py-10" style={{ background: 'linear-gradient(135deg, #2C1810, #4A3228)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-2xl font-bold mb-2 font-amiri">كيف تطلبين؟</h2>
          <p className="text-white/50 text-sm mb-6">3 خطوات بسيطة فقط</p>
          <div className="grid grid-cols-3 gap-3 md:gap-5">
            {[
              { n: '1', icon: '🖱️', t: 'اختاري المنتج', d: 'حددي المقاس واللون المناسب' },
              { n: '2', icon: '📝', t: 'أدخلي بياناتك', d: 'الاسم والعنوان ورقم الهاتف' },
              { n: '3', icon: '📦', t: 'استلمي وادفعي', d: 'التسليم خلال 24-48 ساعة' },
            ].map((s, i) => (
              <div key={i} className="p-4 rounded-2xl relative" style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold" style={{ backgroundColor: '#C9A94E', color: '#2C1810' }}>{s.n}</div>
                <span className="text-2xl block mb-2 mt-2">{s.icon}</span>
                <h3 className="font-bold text-xs mb-0.5">{s.t}</h3>
                <p className="text-white/40 text-[10px] leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Final CTA ===== */}
      <section className="py-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 moroccan-pattern opacity-5" />
        <div className="max-w-lg mx-auto px-4 relative z-10">
          <div className="text-5xl mb-3">🛍️</div>
          <h2 className="text-2xl font-bold mb-2 font-amiri" style={{ color: '#2C1810' }}>لا تفوتي هذا العرض!</h2>
          <p className="text-sm mb-1" style={{ color: '#4A3228' }}>الكمية محدودة — <strong style={{ color: '#C41E3A' }}>{stockLeft} قطع فقط</strong></p>
          <p className="text-xs mb-5" style={{ color: '#A67B5B' }}>أكثر من {recentOrders} زبونة طلبت اليوم</p>
          <button onClick={scrollToOrder} className="cta-main !px-12">
            <span className="cta-shine" />
            <span className="relative z-10">{product.landing_cta_ar || 'اطلبي الآن 💰'}</span>
          </button>
          <p className="text-[10px] mt-3" style={{ color: '#A67B5B' }}>🔒 معلوماتك محمية · 💰 الدفع عند الاستلام فقط</p>
        </div>
      </section>

      {/* ===== Sticky Mobile CTA ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden" style={{ background: 'linear-gradient(to top, rgba(253,248,240,0.98) 80%, rgba(253,248,240,0))' }}>
        <div className="flex items-center gap-2 px-4 pb-4 pt-6">
          <div className="flex-shrink-0 text-center leading-tight">
            <span className="text-lg font-extrabold block" style={{ color: '#C41E3A' }}>{totalPrice}</span>
            <span className="text-[10px] font-semibold" style={{ color: '#A67B5B' }}>د.م</span>
          </div>
          <button onClick={scrollToOrder} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-md active:scale-[0.98] transition-all" style={{ background: 'linear-gradient(135deg, #C41E3A, #A01830)' }}>
            {product.landing_cta_ar || 'اطلبي الآن 💰'}
          </button>
        </div>
      </div>

      {/* ===== Order Form Modal ===== */}
      {showOrderForm && (
        <div className="modal-overlay" onClick={() => setShowOrderForm(false)}>
          <div className="modal-backdrop" />
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white z-10 p-5 pb-3 border-b flex items-center justify-between" style={{ borderColor: '#F5EDE0', borderRadius: '24px 24px 0 0' }}>
              <div>
                <h2 className="text-base font-bold" style={{ color: '#2C1810' }}>أكملي طلبك</h2>
                <p className="text-[11px]" style={{ color: '#A67B5B' }}>💰 الدفع عند الاستلام — توصيل مجاني</p>
              </div>
              <button onClick={() => setShowOrderForm(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F5EDE0] transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#4A3228" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {/* Product summary */}
            <div className="p-3 mx-5 mt-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: '#FDF8F0' }}>
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[#F5EDE0] shadow-sm">
                {product.main_image ? <img src={product.main_image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">✦</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs truncate" style={{ color: '#2C1810' }}>{product.name_ar}</p>
                <p className="text-[10px]" style={{ color: '#4A3228' }}>{[selectedSize, selectedColor].filter(Boolean).join(' | ')}{quantity > 1 ? ` · ${quantity}x` : ''}</p>
              </div>
              <div className="text-left flex-shrink-0">
                <p className="font-extrabold text-sm" style={{ color: '#C41E3A' }}>{totalPrice} د.م</p>
                {product.compare_price && <p className="text-[10px] line-through opacity-40">{product.compare_price * quantity} د.م</p>}
              </div>
            </div>
            {/* Form */}
            <form onSubmit={handleSubmitOrder} className="p-5 space-y-3">
              <div><label className="form-label">الاسم الكامل *</label><input type="text" required value={orderForm.customer_name} onChange={e => setOrderForm(p => ({ ...p, customer_name: e.target.value }))} className="form-input" placeholder="أدخلي اسمك الكامل" /></div>
              <div><label className="form-label">رقم الهاتف *</label><input type="tel" required value={orderForm.customer_phone} onChange={e => setOrderForm(p => ({ ...p, customer_phone: e.target.value }))} className="form-input" style={{ direction: 'ltr', textAlign: 'right' }} placeholder="06XXXXXXXX" /></div>
              <div><label className="form-label">المدينة *</label><select required value={orderForm.customer_city} onChange={e => setOrderForm(p => ({ ...p, customer_city: e.target.value }))} className="form-input"><option value="">اختاري مدينتك</option>{MOROCCAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="form-label">العنوان الكامل *</label><textarea required value={orderForm.customer_address} onChange={e => setOrderForm(p => ({ ...p, customer_address: e.target.value }))} className="form-input" rows={2} placeholder="الحي، الشارع، رقم المنزل..." /></div>
              <div><label className="form-label">ملاحظات (اختياري)</label><input type="text" value={orderForm.notes} onChange={e => setOrderForm(p => ({ ...p, notes: e.target.value }))} className="form-input" placeholder="أي ملاحظات..." /></div>
              {orderError && <div className="p-3 rounded-xl text-xs font-semibold text-center" style={{ backgroundColor: '#FEE2E2', color: '#C41E3A' }}>{orderError}</div>}
              <div className="pt-2 space-y-3">
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #F5EDE0' }}>
                  <div className="flex justify-between items-center p-3" style={{ backgroundColor: '#FDF8F0' }}>
                    <span className="text-xs font-semibold" style={{ color: '#4A3228' }}>المجموع</span>
                    <span className="text-lg font-extrabold" style={{ color: '#C41E3A' }}>{totalPrice} د.م</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white">
                    <span className="text-xs" style={{ color: '#A67B5B' }}>التوصيل</span>
                    <span className="text-xs font-bold" style={{ color: '#006233' }}>مجاني ✓</span>
                  </div>
                </div>
                <button type="submit" disabled={submitting} className="cta-main w-full !rounded-xl disabled:opacity-50">
                  <span className="cta-shine" />
                  <span className="relative z-10">{submitting ? 'جاري الإرسال...' : 'تأكيد الطلب — الدفع عند الاستلام 💰'}</span>
                </button>
                <div className="flex items-center justify-center gap-4 text-[10px]" style={{ color: '#A67B5B' }}>
                  <span>🔒 آمن</span>
                  <span>💰 عند الاستلام</span>
                  <span>🚚 مجاني</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-5 text-center pb-20 md:pb-5" style={{ backgroundColor: '#2C1810' }}>
        <p className="text-white/30 text-xs">© FAM.MA — جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
}

function SH({ title, emoji }: { title: string; emoji?: string }) {
  return (
    <div className="text-center mb-8">
      {emoji && <span className="text-2xl block mb-1">{emoji}</span>}
      <h2 className="text-xl md:text-2xl font-bold font-amiri" style={{ color: '#2C1810' }}>{title}</h2>
      <div className="moroccan-divider max-w-[160px] mx-auto"><span style={{ color: '#C9A94E', fontSize: '10px' }}>◆</span></div>
    </div>
  );
}
