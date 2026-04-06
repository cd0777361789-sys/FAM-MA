'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
}

export default function CategoryPage() {
  const params = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem, totalItems } = useCart();

  useEffect(() => {
    const slug = params.slug as string;
    Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ]).then(([prods, cats]) => {
      const catList: Category[] = Array.isArray(cats) ? cats : [];
      setAllCategories(catList);
      const cat = catList.find(c => c.slug === slug);
      setCategory(cat || null);
      if (cat) {
        const filtered = (Array.isArray(prods) ? prods : []).filter((p: Product) => p.category_name_ar === cat.name_ar);
        setProducts(filtered);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.slug]);

  if (loading) return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDF8F0' }}>
      <div className="h-14 glass shadow-sm" />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex justify-center mb-8"><div className="skeleton h-6 w-40" /></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-2xl overflow-hidden bg-white">
              <div className="skeleton aspect-[3/4]" />
              <div className="p-4 space-y-2"><div className="skeleton h-3 w-1/3" /><div className="skeleton h-4 w-2/3" /><div className="skeleton h-5 w-1/4" /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (!category) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FDF8F0' }}>
      <div className="text-center px-4">
        <div className="text-5xl mb-3">🔍</div>
        <h1 className="text-xl font-bold mb-2" style={{ color: '#2C1810' }}>الفئة غير موجودة</h1>
        <Link href="/" className="btn-moroccan px-6 py-2.5 rounded-xl text-sm">العودة للمتجر</Link>
      </div>
    </div>
  );

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
              <p className="text-[10px] font-amiri" style={{ color: '#D4A574' }}>أزياء مغربية أصيلة</p>
            </div>
          </Link>
          <div className="flex items-center gap-2.5">
            <Link href="/cart" className="relative p-2 rounded-lg hover:bg-[#8B5E3C10] transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#8B5E3C" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
              {totalItems > 0 && <span className="absolute -top-0.5 -left-0.5 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ backgroundColor: '#C41E3A' }}>{totalItems}</span>}
            </Link>
            <div className="cod-badge text-xs">💰 الدفع عند الاستلام</div>
          </div>
        </div>
      </header>

      {/* Breadcrumb + Title */}
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center gap-1.5 text-xs mb-4" style={{ color: '#A67B5B' }}>
          <Link href="/" className="hover:underline">الرئيسية</Link>
          <span>/</span>
          <span style={{ color: '#8B5E3C' }} className="font-semibold">{category.name_ar}</span>
        </div>
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold font-amiri" style={{ color: '#2C1810' }}>{category.name_ar}</h2>
          {category.description_ar && <p className="text-sm mt-1" style={{ color: '#A67B5B' }}>{category.description_ar}</p>}
          <div className="moroccan-divider max-w-[200px] mx-auto"><span style={{ color: '#C9A94E', fontSize: '10px' }}>◆</span></div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center flex-wrap">
          {allCategories.map(c => (
            <Link key={c.id} href={`/category/${c.slug}`} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${c.slug === params.slug ? 'text-white shadow-md' : 'bg-white hover:bg-[#F5EDE0]'}`} style={c.slug === params.slug ? { backgroundColor: '#8B5E3C' } : { color: '#4A3228', border: '1px solid #E8C9A0' }}>
              {c.name_ar}
            </Link>
          ))}
          <Link href="/" className="px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap bg-white hover:bg-[#F5EDE0]" style={{ color: '#4A3228', border: '1px solid #E8C9A0' }}>
            الكل
          </Link>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-14">
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {products.map((product, idx) => {
              const discount = product.compare_price ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100) : 0;
              return (
                <div key={product.id} className="product-card block rounded-2xl overflow-hidden bg-white animate-fade-in-up" style={{ animationDelay: `${idx * 0.06}s` }}>
                  <Link href={`/product/${product.slug}`} className="block">
                    <div className="relative aspect-[3/4] overflow-hidden" style={{ backgroundColor: '#F5EDE0' }}>
                      {product.main_image ? (
                        <img src={product.main_image} alt={product.name_ar} className="product-image w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><span className="text-5xl opacity-30">✦</span></div>
                      )}
                      {discount > 0 && <span className="discount-badge">-{discount}%</span>}
                      {product.is_new ? <span className="absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10" style={{ backgroundColor: '#006233' }}>جديد</span> : null}
                    </div>
                    <div className="p-3 md:p-4 pb-1">
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
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-semibold" style={{ color: '#4A3228' }}>لا توجد منتجات في هذا التصنيف بعد</p>
            <Link href="/" className="mt-4 inline-block btn-moroccan px-6 py-2.5 rounded-xl text-sm">عرض جميع المنتجات</Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-5 text-center" style={{ backgroundColor: '#2C1810' }}>
        <p className="text-white/30 text-xs">© FAM.MA - جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
}
