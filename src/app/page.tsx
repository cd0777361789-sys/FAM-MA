'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

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

  const featuredProducts = products.filter(p => p.is_featured);
  const newProducts = products.filter(p => p.is_new);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--cream)' }}>
      {/* Announcement Bar */}
      {settings.announcement_bar && (
        <div className="gradient-moroccan text-white text-center py-2.5 px-4 text-sm font-semibold">
          {settings.announcement_bar}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b" style={{ borderColor: '#E8C9A0' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, #8B5E3C, #C9A94E)' }}>
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#6B4226' }}>FAM.MA</h1>
              <p className="text-xs font-amiri" style={{ color: '#D4A574' }}>أزياء مغربية أصيلة</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="font-semibold hover:opacity-80 transition" style={{ color: '#8B5E3C' }}>الرئيسية</Link>
            <Link href="#products" className="font-semibold hover:opacity-80 transition" style={{ color: '#4A3228' }}>المنتجات</Link>
            <Link href="#categories" className="font-semibold hover:opacity-80 transition" style={{ color: '#4A3228' }}>الفئات</Link>
            <Link href="#about" className="font-semibold hover:opacity-80 transition" style={{ color: '#4A3228' }}>من نحن</Link>
          </nav>

          <div className="flex items-center gap-3">
            <a href={`tel:${settings.site_phone || ''}`} className="hidden md:flex items-center gap-2 text-sm font-semibold" style={{ color: '#8B5E3C' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              {settings.site_phone}
            </a>
            <div className="cod-badge">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <span className="hidden sm:inline">الدفع عند الاستلام</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden" style={{ background: 'linear-gradient(135deg, #6B4226 0%, #8B5E3C 40%, #D4A574 100%)' }}>
        <div className="absolute inset-0 moroccan-pattern opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-block mb-4 px-4 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: 'rgba(201, 169, 78, 0.2)', color: '#E0C976' }}>
              ✦ صنع في المغرب بحب وإتقان ✦
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 font-amiri leading-tight">
              أناقة مغربية
              <br />
              <span style={{ color: '#E0C976' }}>تتجاوز الزمن</span>
            </h2>
            <p className="text-lg md:text-xl mb-8" style={{ color: '#E8C9A0' }}>
              اكتشفي مجموعتنا الحصرية من القفاطين والمجوهرات المغربية الأصيلة
              <br />بتصاميم عصرية تجمع بين التراث والحداثة
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="#products" className="btn-accent text-lg px-10 py-4 rounded-xl">
                تسوقي الآن ✦
              </a>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                توصيل مجاني | الدفع عند الاستلام
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 100V60C360 0 720 80 1080 40C1260 20 1380 50 1440 60V100H0Z" fill="#FDF8F0" />
          </svg>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 border-b" style={{ borderColor: '#F5EDE0' }}>
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: '🚚', text: 'توصيل لجميع المدن', sub: 'خلال 24-48 ساعة' },
            { icon: '💰', text: 'الدفع عند الاستلام', sub: 'بدون أي رسوم إضافية' },
            { icon: '✨', text: 'منتجات أصلية', sub: 'جودة مضمونة 100%' },
            { icon: '📞', text: 'خدمة العملاء', sub: 'متوفرون كل يوم' },
          ].map((badge, i) => (
            <div key={i} className="text-center p-4">
              <div className="text-3xl mb-2">{badge.icon}</div>
              <h3 className="font-bold text-sm" style={{ color: '#2C1810' }}>{badge.text}</h3>
              <p className="text-xs mt-1" style={{ color: '#4A3228' }}>{badge.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section id="categories" className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <SectionHeader badge="✦ التصنيفات ✦" title="اكتشفي مجموعاتنا" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {categories.map(cat => {
                const emojis: Record<string, string> = { clothing: '👗', jewelry: '💎' };
                return (
                  <a key={cat.id} href="#products" className="group text-center p-8 rounded-2xl bg-white transition-all hover:shadow-lg hover:scale-105">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl" style={{ background: 'linear-gradient(135deg, #E8C9A0, #FDF8F0)' }}>
                      {emojis[cat.slug] || '🛍️'}
                    </div>
                    <h3 className="font-bold text-lg group-hover:opacity-80 transition" style={{ color: '#2C1810' }}>{cat.name_ar}</h3>
                    <p className="text-sm mt-1" style={{ color: '#4A3228' }}>{cat.description_ar}</p>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section id="products" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <SectionHeader badge="✦ الأكثر مبيعاً ✦" title="منتجاتنا المميزة" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product, idx) => (
                <ProductCard key={product.id} product={product} index={idx} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {newProducts.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <SectionHeader badge="🆕 وصل حديثاً" title="أحدث الوصولات" badgeColor="#C41E3A" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {newProducts.map((product, idx) => (
                <ProductCard key={product.id} product={product} index={idx} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Products */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader badge="✦ مجموعتنا الكاملة ✦" title="جميع المنتجات" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))}
          </div>
          {products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-xl" style={{ color: '#4A3228' }}>لا توجد منتجات حالياً</p>
              <p className="mt-2" style={{ color: '#D4A574' }}>ترقبوا إضافة جديدة قريباً!</p>
            </div>
          )}
        </div>
      </section>

      {/* COD Banner */}
      <section className="py-16 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #006233, #008744)' }}>
        <div className="absolute inset-0 moroccan-pattern opacity-10"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="text-5xl mb-4">💰</div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-amiri">الدفع عند الاستلام</h2>
          <p className="text-lg text-white/90 mb-6">
            لا حاجة لبطاقة بنكية! اطلبي الآن وادفعي عند استلام طلبك
            <br />توصيل سريع لجميع المدن المغربية خلال 24-48 ساعة
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['الدار البيضاء', 'الرباط', 'مراكش', 'فاس', 'طنجة', 'أكادير'].map(city => (
              <span key={city} className="bg-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold">{city}</span>
            ))}
            <span className="bg-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold">+ جميع المدن</span>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <SectionHeader badge="✦ من نحن ✦" title="قصة FAM.MA" />
          <p className="text-lg leading-relaxed" style={{ color: '#4A3228' }}>
            نحن متجر مغربي متخصص في الأزياء والمجوهرات الأصيلة. نسعى لتقديم أفضل المنتجات المغربية التقليدية والعصرية
            بأسعار مناسبة وجودة عالية. كل قطعة في مجموعتنا تحمل لمسة من التراث المغربي العريق مع تصاميم عصرية
            تناسب ذوق المرأة المغربية الحديثة.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-white" style={{ background: 'linear-gradient(135deg, #2C1810 0%, #6B4226 100%)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4" style={{ color: '#C9A94E' }}>FAM.MA</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                متجر الأزياء والمجوهرات المغربية الراقية
                <br />جودة ✦ أصالة ✦ أناقة
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: '#C9A94E' }}>روابط سريعة</h3>
              <div className="space-y-2">
                <Link href="/" className="block text-white/70 hover:text-white text-sm transition">الرئيسية</Link>
                <Link href="#products" className="block text-white/70 hover:text-white text-sm transition">المنتجات</Link>
                <Link href="#categories" className="block text-white/70 hover:text-white text-sm transition">التصنيفات</Link>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ color: '#C9A94E' }}>تواصلي معنا</h3>
              <div className="space-y-2 text-sm text-white/70">
                <p>📞 {settings.site_phone || '+212 600 000 000'}</p>
                <p>📧 {settings.site_email || 'contact@fam.ma'}</p>
                <p>📍 {settings.site_address || 'الدار البيضاء، المغرب'}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-white/50 text-sm">{settings.footer_text || '© 2024 FAM.MA - جميع الحقوق محفوظة'}</p>
          </div>
        </div>
      </footer>

      {/* WhatsApp Float */}
      {settings.site_whatsapp && (
        <a href={`https://wa.me/${settings.site_whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="whatsapp-float" title="تواصلي معنا عبر الواتساب">
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </a>
      )}
    </div>
  );
}

function SectionHeader({ badge, title, badgeColor }: { badge: string; title: string; badgeColor?: string }) {
  return (
    <div className="text-center mb-12">
      <span className="text-sm font-semibold tracking-wider" style={{ color: badgeColor || '#C9A94E' }}>{badge}</span>
      <h2 className="text-3xl md:text-4xl font-bold mt-2 font-amiri" style={{ color: '#2C1810' }}>{title}</h2>
      <div className="moroccan-divider max-w-xs mx-auto"><span style={{ color: '#C9A94E' }}>◆</span></div>
    </div>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const discount = product.compare_price ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100) : 0;

  return (
    <Link href={`/product/${product.slug}`} className="product-card block rounded-2xl overflow-hidden bg-white shadow-sm animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="relative aspect-[3/4] overflow-hidden" style={{ backgroundColor: '#F5EDE0' }}>
        {product.main_image ? (
          <img src={product.main_image} alt={product.name_ar} className="product-image w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <span className="text-6xl">✦</span>
              <p className="mt-2 text-sm" style={{ color: '#D4A574' }}>{product.name_ar}</p>
            </div>
          </div>
        )}
        {discount > 0 && <span className="discount-badge">-{discount}%</span>}
        {product.is_new ? <span className="absolute top-12 right-3 text-white text-xs font-bold px-3 py-1 rounded-full z-10" style={{ backgroundColor: '#006233' }}>جديد</span> : null}
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold mb-1" style={{ color: '#C9A94E' }}>{product.category_name_ar || 'أزياء'}</p>
        <h3 className="font-bold text-base mb-2" style={{ color: '#2C1810' }}>{product.name_ar}</h3>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold" style={{ color: '#C41E3A' }}>{product.price} د.م</span>
          {product.compare_price && <span className="text-sm line-through opacity-50" style={{ color: '#4A3228' }}>{product.compare_price} د.م</span>}
        </div>
        <div className="mt-3 w-full text-center py-2.5 rounded-lg text-sm font-bold transition-all" style={{ backgroundColor: '#FDF8F0', color: '#8B5E3C' }}>
          اطلبي الآن ✦
        </div>
      </div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDF8F0' }}>
      <div className="h-10 gradient-moroccan"></div>
      <div className="h-16 bg-white shadow-sm"></div>
      <div className="h-96" style={{ background: 'linear-gradient(135deg, #6B4226, #8B5E3C)' }}></div>
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl overflow-hidden bg-white">
              <div className="skeleton h-80"></div>
              <div className="p-4 space-y-3">
                <div className="skeleton h-4 w-1/3"></div>
                <div className="skeleton h-5 w-2/3"></div>
                <div className="skeleton h-6 w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
