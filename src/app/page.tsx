'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';

interface Product {
  id: string;
  name_ar: string;
  slug: string;
  price: number;
  compare_price: number | null;
  main_image: string | null;
  is_new: number;
  is_featured: number;
  category_name_ar?: string;
}

interface Category {
  id: string;
  name_ar: string;
  slug: string;
  description_ar?: string;
  image?: string | null;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const productsRef = useRef<HTMLDivElement>(null);
  const { totalItems } = useCart();

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([prods, cats, setts]) => {
      setProducts(Array.isArray(prods) ? prods : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setSettings(setts || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filteredProducts = activeFilter === 'all'
    ? products
    : activeFilter === 'featured'
      ? products.filter(p => p.is_featured)
      : activeFilter === 'new'
        ? products.filter(p => p.is_new)
        : products.filter(p => p.category_name_ar === activeFilter);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--cream)' }}>
      {/* Announcement Bar */}
      {settings.announcement_bar && (
        <div className="relative overflow-hidden text-white text-center py-2 px-4 text-[13px] font-semibold" style={{ background: 'linear-gradient(90deg, #2C1810, #6B4226, #8B5E3C, #6B4226, #2C1810)' }}>
          <span className="relative z-10">{settings.announcement_bar}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 glass shadow-sm border-b" style={{ borderColor: '#E8C9A020' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 flex items-center justify-center rounded-xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #8B5E3C, #C9A94E)' }}>
              <span className="text-white font-bold text-base relative z-10">F</span>
            </div>
            <div className="leading-tight">
              <h1 className="text-lg font-extrabold tracking-tight" style={{ color: '#6B4226' }}>FAM.MA</h1>
              <p className="text-[10px] font-amiri" style={{ color: '#D4A574' }}>أزياء مغربية أصيلة</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: '/', label: 'الرئيسية' },
              { href: '#products', label: 'المنتجات' },
              { href: '#categories', label: 'الفئات' },
              { href: '#about', label: 'من نحن' },
            ].map(link => (
              <a key={link.href} href={link.href} className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:bg-[#8B5E3C10]" style={{ color: '#4A3228' }}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <Link href="/cart" className="relative p-2 rounded-lg hover:bg-[#8B5E3C10] transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#8B5E3C" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
              {totalItems > 0 && <span className="absolute -top-0.5 -left-0.5 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ backgroundColor: '#C41E3A' }}>{totalItems}</span>}
            </Link>
            <a href={`tel:${settings.site_phone || ''}`} className="hidden lg:flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition hover:bg-[#8B5E3C10]" style={{ color: '#8B5E3C' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              {settings.site_phone}
            </a>
            <div className="cod-badge text-xs">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <span className="hidden sm:inline">الدفع عند الاستلام</span>
            </div>
            {/* Mobile menu toggle */}
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 rounded-lg hover:bg-[#F5EDE0] transition">
              {mobileMenu ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#4A3228" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#4A3228" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="md:hidden border-t animate-fade-in" style={{ borderColor: '#F5EDE0', background: 'rgba(253,248,240,0.98)' }}>
            <div className="px-4 py-3 space-y-1">
              {[
                { href: '/', label: 'الرئيسية' },
                { href: '#products', label: 'المنتجات' },
                { href: '#categories', label: 'الفئات' },
                { href: '#about', label: 'من نحن' },
              ].map(link => (
                <a key={link.href} href={link.href} onClick={() => setMobileMenu(false)} className="block px-4 py-2.5 rounded-xl text-sm font-semibold transition hover:bg-white" style={{ color: '#4A3228' }}>
                  {link.label}
                </a>
              ))}
              {settings.site_phone && (
                <a href={`tel:${settings.site_phone}`} className="block px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ color: '#8B5E3C' }}>
                  📞 {settings.site_phone}
                </a>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #2C1810 0%, #6B4226 35%, #8B5E3C 65%, #A67B5B 100%)' }}>
        <div className="absolute inset-0 moroccan-pattern opacity-[0.06]" />
        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-40 h-40 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #C9A94E, transparent)' }} />
        <div className="absolute bottom-20 left-10 w-60 h-60 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #D4A574, transparent)' }} />
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-16 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(201, 169, 78, 0.15)', color: '#E0C976', border: '1px solid rgba(201, 169, 78, 0.2)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#E0C976]" />
              صنع في المغرب بحب وإتقان
              <span className="w-1.5 h-1.5 rounded-full bg-[#E0C976]" />
            </div>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-5 font-amiri leading-[1.15]">
              أناقة مغربية
              <br />
              <span className="relative">
                <span style={{ color: '#E0C976' }}>تتجاوز الزمن</span>
              </span>
            </h2>
            <p className="text-base md:text-lg mb-8 max-w-xl mx-auto leading-relaxed" style={{ color: '#E8C9A0' }}>
              اكتشفي مجموعتنا الحصرية من القفاطين والمجوهرات المغربية الأصيلة بتصاميم عصرية تجمع بين التراث والحداثة
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <a href="#products" className="btn-accent text-base px-10 py-4 rounded-2xl w-full sm:w-auto">
                تسوقي الآن
              </a>
              <a href="#categories" className="btn-outline text-base px-8 py-3.5 rounded-2xl w-full sm:w-auto" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                تصفحي المجموعات
              </a>
            </div>
            <div className="flex flex-wrap justify-center gap-6 mt-8">
              {[
                { icon: '🚚', text: 'توصيل مجاني' },
                { icon: '💰', text: 'الدفع عند الاستلام' },
                { icon: '✨', text: 'جودة مضمونة' },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-white/70 text-sm">
                  <span>{b.icon}</span><span>{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-[40px] md:h-[60px]">
            <path d="M0 80V50C240 10 480 60 720 40C960 20 1200 50 1440 30V80H0Z" fill="#FDF8F0" />
          </svg>
        </div>
      </section>

      {/* Trust Badges - Horizontal scroll on mobile */}
      <section className="py-6 border-b" style={{ borderColor: '#F5EDE0' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto pb-2 md:pb-0 snap-x snap-mandatory scrollbar-hide">
            {[
              { icon: '🚚', text: 'توصيل لجميع المدن', sub: 'خلال 24-48 ساعة' },
              { icon: '💰', text: 'الدفع عند الاستلام', sub: 'بدون رسوم إضافية' },
              { icon: '✨', text: 'منتجات أصلية', sub: 'جودة مضمونة 100%' },
              { icon: '📞', text: 'خدمة عملاء', sub: 'دعم متواصل 24/7' },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-3 min-w-[200px] md:min-w-0 snap-start p-3 rounded-xl bg-white/60">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: '#FDF8F0' }}>
                  {badge.icon}
                </div>
                <div>
                  <h3 className="font-bold text-xs" style={{ color: '#2C1810' }}>{badge.text}</h3>
                  <p className="text-[11px]" style={{ color: '#A67B5B' }}>{badge.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section id="categories" className="py-8">
          <div className="max-w-6xl mx-auto px-4">
            <SectionHeader badge="التصنيفات" title="اكتشفي مجموعاتنا" />
            <div className="flex justify-center gap-2.5 flex-wrap">
              {categories.map(cat => {
                const emojis: Record<string, string> = { clothing: '👗', jewelry: '💎' };
                return (
                  <Link key={cat.id} href={`/category/${cat.slug}`} className="group inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 text-sm font-bold" style={{ background: 'linear-gradient(135deg, #8B5E3C, #6B4226)', color: 'white' }}>
                    <span className="text-base">{emojis[cat.slug] || '🛍️'}</span>
                    <span>{cat.name_ar}</span>
                    <svg className="w-3 h-3 opacity-60 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Products Section */}
      <section id="products" className="py-14 bg-white" ref={productsRef}>
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader badge="مجموعتنا" title="تشكيلة المنتجات" />

          {/* Filter Chips */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide justify-center flex-wrap">
            {[
              { key: 'all', label: 'الكل' },
              { key: 'featured', label: '⭐ الأكثر مبيعاً' },
              { key: 'new', label: '🆕 جديد' },
              ...categories.map(c => ({ key: c.name_ar, label: c.name_ar })),
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${activeFilter === f.key ? 'text-white shadow-md' : 'bg-[#FDF8F0] hover:bg-[#F5EDE0]'}`}
                style={activeFilter === f.key ? { backgroundColor: '#8B5E3C' } : { color: '#4A3228' }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {filteredProducts.map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg font-semibold" style={{ color: '#4A3228' }}>لا توجد منتجات في هذا التصنيف</p>
              <button onClick={() => setActiveFilter('all')} className="mt-3 text-sm font-semibold underline" style={{ color: '#8B5E3C' }}>عرض جميع المنتجات</button>
            </div>
          )}
        </div>
      </section>

      {/* COD Banner */}
      <section className="py-14 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #006233 0%, #008744 50%, #006233 100%)' }}>
        <div className="absolute inset-0 moroccan-pattern opacity-[0.06]" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 animate-float" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <span className="text-3xl">💰</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 font-amiri">الدفع عند الاستلام</h2>
          <p className="text-base text-white/85 mb-6 max-w-lg mx-auto leading-relaxed">
            لا حاجة لبطاقة بنكية! اطلبي الآن وادفعي عند استلام طلبك. توصيل سريع لجميع المدن المغربية.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['الدار البيضاء', 'الرباط', 'مراكش', 'فاس', 'طنجة', 'أكادير'].map(city => (
              <span key={city} className="bg-white/15 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold">{city}</span>
            ))}
            <span className="bg-white/25 text-white px-3.5 py-1.5 rounded-full text-xs font-bold">+ جميع المدن</span>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <SectionHeader badge="من نحن" title="قصة FAM.MA" />
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <p className="text-base leading-[1.9]" style={{ color: '#4A3228' }}>
              FAM.MA منصة مغربية نختار لك أفضل المنتجات من أجود العلامات التجارية ونوصلها لباب دارك.
              نبحث ونختبر ونقارن عشرات المنتجات باش نقدمو لك غير اللي يستاهل — بأسعار مدروسة وتوصيل سريع لجميع مدن المغرب.
              مهمتنا هي أننا نوفرو عليك الوقت والجهد ونضمنو لك تجربة تسوق سهلة وممتعة.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 text-white" style={{ background: 'linear-gradient(180deg, #2C1810 0%, #1A0F09 100%)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8B5E3C, #C9A94E)' }}>
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <span className="text-lg font-bold" style={{ color: '#C9A94E' }}>FAM.MA</span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">
                نختار لك أفضل المنتجات من أجود العلامات
                <br />جودة · تميّز · توصيل سريع
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold mb-3" style={{ color: '#C9A94E' }}>روابط سريعة</h3>
              <div className="space-y-2">
                <Link href="/" className="block text-white/50 hover:text-white text-sm transition">الرئيسية</Link>
                <a href="#products" className="block text-white/50 hover:text-white text-sm transition">المنتجات</a>
                <a href="#categories" className="block text-white/50 hover:text-white text-sm transition">التصنيفات</a>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold mb-3" style={{ color: '#C9A94E' }}>تواصلي معنا</h3>
              <div className="space-y-2 text-sm text-white/50">
                {settings.site_phone && <p>📞 {settings.site_phone}</p>}
                {settings.site_email && <p>📧 {settings.site_email}</p>}
                {settings.site_address && <p>📍 {settings.site_address}</p>}
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-5 text-center">
            <p className="text-white/30 text-xs">{settings.footer_text || '© 2024 FAM.MA - جميع الحقوق محفوظة'}</p>
          </div>
        </div>
      </footer>

      {/* WhatsApp Float */}
      {settings.site_whatsapp && (
        <a href={`https://wa.me/${settings.site_whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="fixed bottom-6 left-6 z-[999] group" title="تواصلي عبر الواتساب">
          <div className="relative">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1" style={{ background: '#25D366', boxShadow: '0 4px 14px rgba(37,211,102,0.4)' }}>
              <svg className="w-5.5 h-5.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#FDF8F0]" style={{ background: '#25D366', animation: 'landingPulse 2s infinite' }} />
          </div>
        </a>
      )}
    </div>
  );
}

/* ===== Sub-Components ===== */

function SectionHeader({ badge, title }: { badge: string; title: string }) {
  return (
    <div className="text-center mb-10">
      <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full" style={{ color: '#C9A94E', backgroundColor: '#C9A94E15' }}>
        <span className="w-1 h-1 rounded-full bg-[#C9A94E]" /> {badge} <span className="w-1 h-1 rounded-full bg-[#C9A94E]" />
      </span>
      <h2 className="text-2xl md:text-3xl font-bold mt-3 font-amiri" style={{ color: '#2C1810' }}>{title}</h2>
      <div className="moroccan-divider max-w-[200px] mx-auto"><span style={{ color: '#C9A94E', fontSize: '10px' }}>◆</span></div>
    </div>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const discount = product.compare_price ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100) : 0;
  const { addItem } = useCart();

  return (
    <div className="product-card block rounded-2xl overflow-hidden bg-white animate-fade-in-up" style={{ animationDelay: `${index * 0.06}s` }}>
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden" style={{ backgroundColor: '#F5EDE0' }}>
          {product.main_image ? (
            <img src={product.main_image} alt={product.name_ar} className="product-image w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl opacity-30">✦</span>
            </div>
          )}
          {discount > 0 && <span className="discount-badge">-{discount}%</span>}
          {product.is_new ? <span className="absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10" style={{ backgroundColor: '#006233' }}>جديد</span> : null}
        </div>
        <div className="p-3 md:p-4 pb-1">
          <p className="text-[10px] font-semibold mb-0.5" style={{ color: '#C9A94E' }}>{product.category_name_ar || ''}</p>
          <h3 className="font-bold text-sm mb-2 leading-snug line-clamp-2" style={{ color: '#2C1810' }}>{product.name_ar}</h3>
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold" style={{ color: '#C41E3A' }}>{product.price} <span className="text-xs font-bold">د.م</span></span>
            {product.compare_price && <span className="text-xs line-through opacity-40" style={{ color: '#4A3228' }}>{product.compare_price}</span>}
          </div>
        </div>
      </Link>
      <div className="px-3 md:px-4 pb-3 md:pb-4 flex gap-2">
        <button onClick={() => addItem({ id: product.id, name_ar: product.name_ar, slug: product.slug, price: product.price, compare_price: product.compare_price, main_image: product.main_image })}
          className="flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90" style={{ backgroundColor: '#8B5E3C', color: 'white' }}>
          أضيفي للسلة 🛒
        </button>
        <Link href={`/product/${product.slug}`} className="py-2 px-3 rounded-xl text-xs font-bold transition-all hover:bg-[#F5EDE0]" style={{ border: '1px solid #E8C9A0', color: '#8B5E3C' }}>
          التفاصيل
        </Link>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDF8F0' }}>
      <div className="h-8" style={{ background: 'linear-gradient(90deg, #2C1810, #6B4226)' }} />
      <div className="h-14 glass shadow-sm" />
      <div className="h-[60vh]" style={{ background: 'linear-gradient(135deg, #2C1810, #8B5E3C)' }} />
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="flex justify-center mb-8"><div className="skeleton h-6 w-40" /></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-2xl overflow-hidden bg-white">
              <div className="skeleton aspect-[3/4]" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-3 w-1/3" />
                <div className="skeleton h-4 w-2/3" />
                <div className="skeleton h-5 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
