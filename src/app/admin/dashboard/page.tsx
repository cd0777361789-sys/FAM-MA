              { key: 'fb_capi_token', label: 'Facebook Conversion API Token (Dataset Quality API)' },
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  totalProducts: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_city: string;
  customer_address: string;
  product_name: string;
  product_variant: string;
  quantity: number;
  total_price: number;
  status: string;
  notes: string;
  created_at: string;
}

interface Product {
  id: string;
  name_ar: string;
  slug: string;
  price: number;
  compare_price: number | null;
  main_image: string | null;
  is_featured: number;
  is_active: number;
  is_new: number;
  stock: number;
  category_name_ar?: string;
  description_ar?: string;
  sizes?: string;
  colors?: string;
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
  landing_offers?: string;
  landing_detail_images?: string;
  landing_settings?: string;
  category_id?: string;
}

interface Category {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  is_active: number;
}

type Tab = 'dashboard' | 'orders' | 'products' | 'categories' | 'settings';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'في الانتظار', color: '#92400E', bg: '#FEF3C7' },
  confirmed: { label: 'مؤكد', color: '#1E40AF', bg: '#DBEAFE' },
  shipped: { label: 'تم الشحن', color: '#6B21A8', bg: '#F3E8FF' },
  delivered: { label: 'تم التوصيل', color: '#166534', bg: '#DCFCE7' },
  cancelled: { label: 'ملغي', color: '#991B1B', bg: '#FEE2E2' },
  returned: { label: 'مرتجع', color: '#6B7280', bg: '#F3F4F6' },
};

export default function AdminDashboard() {
  const [token, setToken] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [orderFilter, setOrderFilter] = useState('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('admin_token');
    if (!t) {
      window.location.href = '/admin';
      return;
    }
    setToken(t);
  }, []);

  const authFetch = useCallback(async (url: string, opts?: RequestInit) => {
    return fetch(url, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(opts?.headers || {}),
      },
    });
  }, [token]);

  const loadDashboard = useCallback(async () => {
    try {
      const res = await authFetch('/api/dashboard');
      if (res.status === 401) { window.location.href = '/admin'; return; }
      const data = await res.json();
      setStats(data.stats);
      setRecentOrders(data.recentOrders || []);
    } catch { /* ignore */ }
  }, [authFetch]);

  const loadOrders = useCallback(async () => {
    try {
      const res = await authFetch(`/api/orders?status=${orderFilter}&limit=100`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch { /* ignore */ }
  }, [authFetch, orderFilter]);

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([loadDashboard(), loadProducts(), loadCategories(), loadSettings()])
      .finally(() => setLoading(false));
  }, [token, loadDashboard, loadProducts, loadCategories, loadSettings]);

  useEffect(() => {
    if (token && activeTab === 'orders') loadOrders();
  }, [token, activeTab, orderFilter, loadOrders]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    await authFetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    loadOrders();
    loadDashboard();
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
    await authFetch(`/api/orders/${orderId}`, { method: 'DELETE' });
    loadOrders();
    loadDashboard();
  };

  const saveProduct = async (productData: Record<string, unknown>) => {
    const method = editingProduct ? 'PUT' : 'POST';
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    await authFetch(url, {
      method,
      body: JSON.stringify(productData),
    });
    loadProducts();
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    await authFetch(`/api/products/${id}`, { method: 'DELETE' });
    loadProducts();
  };

  const saveSettings = async () => {
    await authFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    alert('تم حفظ الإعدادات بنجاح ✅');
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.status === 401) {
        alert('انتهت صلاحية الجلسة — سيتم إعادة تسجيل الدخول');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin';
        return null;
      }
      const data = await res.json();
      if (res.ok && data.url) {
        return data.url;
      }
      alert(`خطأ في رفع الصورة: ${data.error || 'فشل الرفع'}`);
      return null;
    } catch (err) {
      alert(`خطأ في الاتصال أثناء رفع الصورة: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`);
      return null;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/admin';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5EDE0' }}>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full animate-pulse" style={{ backgroundColor: '#D4A574' }}></div>
          <p style={{ color: '#8B5E3C' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'لوحة التحكم', icon: '📊' },
    { key: 'orders', label: 'الطلبات', icon: '📦' },
    { key: 'products', label: 'المنتجات', icon: '🛍️' },
    { key: 'categories', label: 'الفئات', icon: '📁' },
    { key: 'settings', label: 'الإعدادات', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F9F5F0', direction: 'rtl' }}>
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 right-0 z-50 w-64 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`} style={{ background: 'linear-gradient(180deg, #2C1810, #4A3228)' }}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9A94E, #D4A574)' }}>
              <span className="text-white font-bold">F</span>
            </div>
            <div>
              <h1 className="text-white font-bold">FAM.MA</h1>
              <p className="text-white/50 text-xs">لوحة التحكم</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.key ? 'text-white' : 'text-white/60 hover:text-white/80'}`}
              style={activeTab === tab.key ? { backgroundColor: 'rgba(201,169,78,0.2)' } : {}}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.key === 'orders' && stats?.pendingOrders ? (
                <span className="mr-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#C41E3A', color: 'white' }}>{stats.pendingOrders}</span>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <Link href="/" target="_blank" className="block text-center text-white/60 text-sm hover:text-white mb-3 transition">
            🌐 عرض المتجر
          </Link>
          <button onClick={handleLogout} className="w-full text-center text-red-400 text-sm hover:text-red-300 transition">
            🚪 تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        {/* Top bar */}
        <div className="bg-white shadow-sm px-4 lg:px-8 py-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg" style={{ backgroundColor: '#FDF8F0' }}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <h2 className="text-lg font-bold" style={{ color: '#2C1810' }}>
            {tabs.find(t => t.key === activeTab)?.icon} {tabs.find(t => t.key === activeTab)?.label}
          </h2>
          <div className="text-sm" style={{ color: '#4A3228' }}>
            مرحباً، <strong>Admin</strong>
          </div>
        </div>

        <div className="p-4 lg:p-8">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && stats && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                  { label: 'إجمالي الطلبات', value: stats.totalOrders, icon: '📦', color: '#8B5E3C' },
                  { label: 'في الانتظار', value: stats.pendingOrders, icon: '⏳', color: '#D97706' },
                  { label: 'مؤكدة', value: stats.confirmedOrders, icon: '✅', color: '#2563EB' },
                  { label: 'تم التوصيل', value: stats.deliveredOrders, icon: '🚚', color: '#16A34A' },
                  { label: 'الإيرادات', value: `${stats.totalRevenue.toFixed(0)} د.م`, icon: '💰', color: '#C9A94E' },
                  { label: 'المنتجات', value: stats.totalProducts, icon: '🛍️', color: '#C41E3A' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span>{stat.icon}</span>
                      <span className="text-xs font-semibold" style={{ color: '#4A3228' }}>{stat.label}</span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4" style={{ color: '#2C1810' }}>📋 آخر الطلبات</h3>
                {recentOrders.length === 0 ? (
                  <p className="text-center py-8" style={{ color: '#4A3228' }}>لا توجد طلبات بعد</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: '2px solid #F5EDE0' }}>
                          <th className="py-3 px-2 text-right font-bold" style={{ color: '#4A3228' }}>رقم الطلب</th>
                          <th className="py-3 px-2 text-right font-bold" style={{ color: '#4A3228' }}>الزبون</th>
                          <th className="py-3 px-2 text-right font-bold" style={{ color: '#4A3228' }}>المنتج</th>
                          <th className="py-3 px-2 text-right font-bold" style={{ color: '#4A3228' }}>المجموع</th>
                          <th className="py-3 px-2 text-right font-bold" style={{ color: '#4A3228' }}>الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map(order => (
                          <tr key={order.id} style={{ borderBottom: '1px solid #F5EDE0' }}>
                            <td className="py-3 px-2 font-medium" style={{ color: '#8B5E3C' }}>{order.order_number}</td>
                            <td className="py-3 px-2" style={{ color: '#2C1810' }}>{order.customer_name}</td>
                            <td className="py-3 px-2" style={{ color: '#4A3228' }}>{order.product_name}</td>
                            <td className="py-3 px-2 font-bold" style={{ color: '#C41E3A' }}>{order.total_price} د.م</td>
                            <td className="py-3 px-2">
                              <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: STATUS_MAP[order.status]?.bg, color: STATUS_MAP[order.status]?.color }}>
                                {STATUS_MAP[order.status]?.label || order.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Filter */}
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'الكل' },
                  { value: 'pending', label: 'في الانتظار' },
                  { value: 'confirmed', label: 'مؤكد' },
                  { value: 'shipped', label: 'تم الشحن' },
                  { value: 'delivered', label: 'تم التوصيل' },
                  { value: 'cancelled', label: 'ملغي' },
                ].map(f => (
                  <button
                    key={f.value}
                    onClick={() => setOrderFilter(f.value)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={orderFilter === f.value 
                      ? { backgroundColor: '#8B5E3C', color: 'white' } 
                      : { backgroundColor: 'white', color: '#4A3228', border: '1px solid #E8C9A0' }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Orders List */}
              <div className="space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="bg-white rounded-2xl shadow-sm p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-bold" style={{ color: '#8B5E3C' }}>{order.order_number}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: STATUS_MAP[order.status]?.bg, color: STATUS_MAP[order.status]?.color }}>
                            {STATUS_MAP[order.status]?.label}
                          </span>
                        </div>
                        <p className="font-semibold" style={{ color: '#2C1810' }}>👤 {order.customer_name}</p>
                        <p className="text-sm" style={{ color: '#4A3228' }}>📞 <a href={`tel:${order.customer_phone}`} dir="ltr">{order.customer_phone}</a></p>
                        <p className="text-sm" style={{ color: '#4A3228' }}>📍 {order.customer_city} - {order.customer_address}</p>
                        <p className="text-sm" style={{ color: '#4A3228' }}>🛍️ {order.product_name} {order.product_variant ? `(${order.product_variant})` : ''} × {order.quantity}</p>
                        {order.notes && <p className="text-sm" style={{ color: '#8B5E3C' }}>📝 {order.notes}</p>}
                        <p className="text-xs" style={{ color: '#A67B5B' }}>🕐 {new Date(order.created_at).toLocaleString('ar-MA')}</p>
                      </div>
                      <div className="text-left space-y-2">
                        <p className="text-xl font-bold" style={{ color: '#C41E3A' }}>{order.total_price} د.م</p>
                        <select
                          value={order.status}
                          onChange={e => updateOrderStatus(order.id, e.target.value)}
                          className="px-3 py-1.5 rounded-lg text-sm"
                          style={{ border: '1px solid #E8C9A0', color: '#2C1810' }}
                        >
                          <option value="pending">في الانتظار</option>
                          <option value="confirmed">مؤكد</option>
                          <option value="shipped">تم الشحن</option>
                          <option value="delivered">تم التوصيل</option>
                          <option value="cancelled">ملغي</option>
                          <option value="returned">مرتجع</option>
                        </select>
                        <button onClick={() => deleteOrder(order.id)} className="block text-xs text-red-500 hover:text-red-700">🗑️ حذف</button>
                      </div>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <div className="bg-white rounded-2xl p-12 text-center">
                    <p className="text-lg" style={{ color: '#4A3228' }}>لا توجد طلبات</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm" style={{ color: '#4A3228' }}>{products.length} منتج</p>
                <button onClick={() => { setEditingProduct(null); setShowProductForm(true); }} className="btn-moroccan text-sm py-2 px-5 rounded-xl">
                  ➕ إضافة منتج
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(product => (
                  <div key={product.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="h-40 flex items-center justify-center" style={{ backgroundColor: '#F5EDE0' }}>
                      {product.main_image ? (
                        <img src={product.main_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">✦</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold mb-1" style={{ color: '#2C1810' }}>{product.name_ar}</h3>
                      <p className="text-xs mb-2" style={{ color: '#C9A94E' }}>{product.category_name_ar}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-bold" style={{ color: '#C41E3A' }}>{product.price} د.م</span>
                        {product.compare_price && <span className="text-xs line-through opacity-50">{product.compare_price} د.م</span>}
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        {product.is_featured ? <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>⭐ مميز</span> : null}
                        {product.is_new ? <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>🆕 جديد</span> : null}
                        <span className="text-xs" style={{ color: '#4A3228' }}>المخزون: {product.stock}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingProduct(product); setShowProductForm(true); }} className="flex-1 text-xs py-2 rounded-lg font-semibold" style={{ backgroundColor: '#FDF8F0', color: '#8B5E3C' }}>
                          ✏️ تعديل
                        </button>
                        <Link href={`/product/${product.slug}`} target="_blank" className="flex-1 text-center text-xs py-2 rounded-lg font-semibold" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                          👁️ معاينة
                        </Link>
                        <button onClick={() => deleteProduct(product.id)} className="text-xs py-2 px-3 rounded-lg font-semibold" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Product Form Modal */}
              {showProductForm && (
                <ProductFormModal
                  product={editingProduct}
                  categories={categories}
                  onSave={saveProduct}
                  onClose={() => { setShowProductForm(false); setEditingProduct(null); }}
                  onUpload={uploadImage}
                />
              )}
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <CategoriesManager token={token} categories={categories} reload={loadCategories} />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold mb-4" style={{ color: '#2C1810' }}>🏪 معلومات المتجر</h3>
                {[
                  { key: 'site_name', label: 'اسم المتجر (إنجليزي)' },
                  { key: 'site_name_ar', label: 'اسم المتجر (عربي)' },
                  { key: 'site_description', label: 'وصف المتجر' },
                  { key: 'site_phone', label: 'رقم الهاتف' },
                  { key: 'site_email', label: 'البريد الإلكتروني' },
                  { key: 'site_address', label: 'العنوان' },
                ].map(field => (
                  <div key={field.key} className="mb-3">
                    <label className="block text-sm font-semibold mb-1" style={{ color: '#4A3228' }}>{field.label}</label>
                    <input
                      type="text"
                      value={settings[field.key] || ''}
                      onChange={e => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ border: '1px solid #E8C9A0', color: '#2C1810' }}
                    />
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold mb-4" style={{ color: '#2C1810' }}>📱 روابط التواصل</h3>
                {[
                  { key: 'site_instagram', label: 'انستغرام' },
                  { key: 'site_facebook', label: 'فيسبوك' },
                  { key: 'site_whatsapp', label: 'واتساب (مع رمز البلد)' },
                ].map(field => (
                  <div key={field.key} className="mb-3">
                    <label className="block text-sm font-semibold mb-1" style={{ color: '#4A3228' }}>{field.label}</label>
                    <input
                      type="text"
                      value={settings[field.key] || ''}
                      onChange={e => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ border: '1px solid #E8C9A0', color: '#2C1810', direction: 'ltr' }}
                    />
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold mb-4" style={{ color: '#2C1810' }}>🎨 المظهر والنصوص</h3>
                {[
                  { key: 'announcement_bar', label: 'شريط الإعلان' },
                  { key: 'cod_message', label: 'رسالة الدفع عند الاستلام' },
                  { key: 'delivery_time', label: 'وقت التوصيل' },
                  { key: 'footer_text', label: 'نص الفوتر' },
                ].map(field => (
                  <div key={field.key} className="mb-3">
                    <label className="block text-sm font-semibold mb-1" style={{ color: '#4A3228' }}>{field.label}</label>
                    <input
                      type="text"
                      value={settings[field.key] || ''}
                      onChange={e => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ border: '1px solid #E8C9A0', color: '#2C1810' }}
                    />
                  </div>
                ))}
              {/* Meta Pixel Code Field */}
              <div className="mb-3">
                <label className="block text-sm font-semibold mb-1" style={{ color: '#4A3228' }}>
                  Meta Pixel (Facebook Pixel) Code
                  <span className="text-xs text-gray-400 ml-2">يمكنك لصق كود البيكسل أو فقط رقم Pixel ID</span>
                </label>
                <textarea
                  value={settings['meta_pixel'] || ''}
                  onChange={e => setSettings(prev => ({ ...prev, meta_pixel: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                  style={{ border: '1px solid #E8C9A0', color: '#2C1810', direction: 'ltr' }}
                  rows={4}
                  placeholder="مثال: 1594179298355815 أو الصق كود البيكسل كاملًا هنا"
                />
                <div className="text-xs text-gray-500 mt-1">يمكنك وضع رقم البيكسل فقط أو الكود الكامل من فيسبوك</div>
              </div>
              {/* Facebook Conversion API Token Field */}
              <div className="mb-3">
                <label className="block text-sm font-semibold mb-1" style={{ color: '#4A3228' }}>
                  Facebook Conversion API Token
                  <span className="text-xs text-gray-400 ml-2">لربط الأحداث مباشرة مع Facebook (Dataset Quality API)</span>
                </label>
                <input
                  type="text"
                  value={settings['fb_capi_token'] || ''}
                  onChange={e => setSettings(prev => ({ ...prev, fb_capi_token: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                  style={{ border: '1px solid #E8C9A0', color: '#2C1810', direction: 'ltr' }}
                  placeholder="الصق التوكن هنا..."
                />
                <div className="text-xs text-gray-500 mt-1">استخدم التوكن من إعدادات Dataset Quality API في Facebook Events Manager</div>
              </div>
              </div>

              <button onClick={saveSettings} className="btn-moroccan w-full py-3 rounded-xl text-lg">
                💾 حفظ الإعدادات
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Reusable Upload Zone Component
function UploadZone({
  label,
  accept,
  multiple,
  files,
  onUpload,
  onRemove,
  onReorder,
  uploading,
  icon,
  hint,
}: {
  label: string;
  accept: string;
  multiple?: boolean;
  files: string[];
  onUpload: (files: FileList) => void;
  onRemove: (index: number) => void;
  onReorder?: (from: number, to: number) => void;
  uploading: boolean;
  icon: string;
  hint: string;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isVideo = accept.includes('video');

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) onUpload(e.dataTransfer.files);
  };

  return (
    <div>
      <label className="form-label">{label}</label>
      {files.length > 0 && (
        <div className={`flex flex-wrap gap-2 mb-2 ${isVideo ? '' : ''}`}>
          {files.map((url, i) => (
            <div key={i} className="relative group" draggable={!!onReorder} onDragStart={e => e.dataTransfer.setData('text/plain', String(i))} onDragOver={e => { e.preventDefault(); }} onDrop={e => { e.preventDefault(); const from = parseInt(e.dataTransfer.getData('text/plain')); if (onReorder && from !== i) onReorder(from, i); }}>
              <div className={`${isVideo ? 'w-32 h-20' : 'w-20 h-20'} rounded-xl overflow-hidden bg-[#F5EDE0] relative`} style={{ border: '2px solid #E8C9A0' }}>
                {isVideo ? (
                  <video src={url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={url} alt="" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button type="button" onClick={() => onRemove(i)} className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold shadow-lg">✕</button>
                </div>
              </div>
              {onReorder && <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: '#8B5E3C' }}>{i + 1}</div>}
            </div>
          ))}
        </div>
      )}
      <div
        className={`upload-zone ${dragOver ? 'active' : ''} ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={e => { if (e.target.files?.length) { onUpload(e.target.files); e.target.value = ''; } }} />
        {uploading ? (
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2 rounded-full" style={{ border: '3px solid #E8C9A0', borderTopColor: '#8B5E3C', animation: 'spin 0.6s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p className="text-xs font-semibold" style={{ color: '#8B5E3C' }}>جاري الرفع...</p>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-2xl block mb-1">{icon}</span>
            <p className="text-xs font-bold" style={{ color: '#8B5E3C' }}>اضغط أو اسحب الملفات هنا</p>
            <p className="text-[10px] mt-1" style={{ color: '#A67B5B' }}>{hint}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Product Form Modal Component
function ProductFormModal({
  product,
  categories,
  onSave,
  onClose,
  onUpload,
}: {
  product: Product | null;
  categories: Category[];
  onSave: (data: Record<string, unknown>) => void;
  onClose: () => void;
  onUpload: (file: File) => Promise<string | null>;
}) {
  const safeJsonParse = <T,>(str: string, fallback: T): T => {
    try { return JSON.parse(str); } catch { return fallback; }
  };

  const [form, setForm] = useState({
    name: product?.name_ar ? '' : '',
    name_ar: product?.name_ar || '',
    price: product?.price || 0,
    compare_price: product?.compare_price || 0,
    description_ar: product?.description_ar || '',
    category_id: product?.category_id || '',
    is_featured: product?.is_featured ? true : false,
    is_new: product?.is_new ? true : false,
    is_active: product?.is_active !== 0,
    stock: product?.stock || 0,
    sizes: product?.sizes || '[]',
    colors: product?.colors || '[]',
    main_image: product?.main_image || '',
    landing_title_ar: product?.landing_title_ar || '',
    landing_subtitle_ar: product?.landing_subtitle_ar || '',
    landing_features_ar: product?.landing_features_ar || '[]',
    landing_cta_ar: product?.landing_cta_ar || '',
    landing_video_url: product?.landing_video_url || '',
    landing_offer_badge_ar: product?.landing_offer_badge_ar || '',
    landing_testimonials: product?.landing_testimonials || '[]',
    landing_faq_ar: product?.landing_faq_ar || '[]',
    landing_gallery: product?.landing_gallery || '[]',
    landing_extra_sections: product?.landing_extra_sections || '[]',
    landing_offers: product?.landing_offers || '[]',
    landing_detail_images: product?.landing_detail_images || '[]',
    landing_settings: product?.landing_settings || '{}',
  });
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingDetail, setUploadingDetail] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'media' | 'landing' | 'advanced'>('basic');

  const handleMainImageUpload = async (files: FileList) => {
    setUploadingMain(true);
    try {
      const url = await onUpload(files[0]);
      if (url) setForm(prev => ({ ...prev, main_image: url }));
    } catch { /* error handled in onUpload */ }
    setUploadingMain(false);
  };

  const handleGalleryUpload = async (files: FileList) => {
    setUploadingGallery(true);
    try {
      const currentGallery: string[] = safeJsonParse(form.landing_gallery, []);
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await onUpload(files[i]);
        if (url) newUrls.push(url);
      }
      if (newUrls.length > 0) {
        setForm(prev => ({ ...prev, landing_gallery: JSON.stringify([...currentGallery, ...newUrls]) }));
      }
    } catch { /* error handled in onUpload */ }
    setUploadingGallery(false);
  };

  const handleVideoUpload = async (files: FileList) => {
    setUploadingVideo(true);
    try {
      const url = await onUpload(files[0]);
      if (url) setForm(prev => ({ ...prev, landing_video_url: url }));
    } catch { /* error handled in onUpload */ }
    setUploadingVideo(false);
  };

  const removeGalleryImage = (index: number) => {
    const gallery: string[] = safeJsonParse(form.landing_gallery, []);
    gallery.splice(index, 1);
    setForm(prev => ({ ...prev, landing_gallery: JSON.stringify(gallery) }));
  };

  const reorderGallery = (from: number, to: number) => {
    const gallery: string[] = safeJsonParse(form.landing_gallery, []);
    const [moved] = gallery.splice(from, 1);
    gallery.splice(to, 0, moved);
    setForm(prev => ({ ...prev, landing_gallery: JSON.stringify(gallery) }));
  };

  // Detail images handlers
  const handleDetailUpload = async (files: FileList) => {
    setUploadingDetail(true);
    try {
      const current: string[] = safeJsonParse(form.landing_detail_images, []);
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await onUpload(files[i]);
        if (url) newUrls.push(url);
      }
      if (newUrls.length > 0) {
        setForm(prev => ({ ...prev, landing_detail_images: JSON.stringify([...current, ...newUrls]) }));
      }
    } catch { /* error handled in onUpload */ }
    setUploadingDetail(false);
  };
  const removeDetailImage = (index: number) => {
    const imgs: string[] = safeJsonParse(form.landing_detail_images, []);
    imgs.splice(index, 1);
    setForm(prev => ({ ...prev, landing_detail_images: JSON.stringify(imgs) }));
  };
  const reorderDetailImages = (from: number, to: number) => {
    const imgs: string[] = safeJsonParse(form.landing_detail_images, []);
    const [moved] = imgs.splice(from, 1);
    imgs.splice(to, 0, moved);
    setForm(prev => ({ ...prev, landing_detail_images: JSON.stringify(imgs) }));
  };

  // Testimonial helpers
  const testimonials: { name: string; city: string; text: string; rating: number }[] = safeJsonParse(form.landing_testimonials, []);
  const addTestimonial = () => {
    const updated = [...testimonials, { name: '', city: '', text: '', rating: 5 }];
    setForm(prev => ({ ...prev, landing_testimonials: JSON.stringify(updated) }));
  };
  const updateTestimonial = (i: number, field: string, value: string | number) => {
    const updated = [...testimonials];
    (updated[i] as Record<string, string | number>)[field] = value;
    setForm(prev => ({ ...prev, landing_testimonials: JSON.stringify(updated) }));
  };
  const removeTestimonial = (i: number) => {
    const updated = testimonials.filter((_, idx) => idx !== i);
    setForm(prev => ({ ...prev, landing_testimonials: JSON.stringify(updated) }));
  };

  // FAQ helpers
  const faqs: { question: string; answer: string }[] = safeJsonParse(form.landing_faq_ar, []);
  const addFaq = () => {
    const updated = [...faqs, { question: '', answer: '' }];
    setForm(prev => ({ ...prev, landing_faq_ar: JSON.stringify(updated) }));
  };
  const updateFaq = (i: number, field: string, value: string) => {
    const updated = [...faqs];
    (updated[i] as Record<string, string>)[field] = value;
    setForm(prev => ({ ...prev, landing_faq_ar: JSON.stringify(updated) }));
  };
  const removeFaq = (i: number) => {
    const updated = faqs.filter((_, idx) => idx !== i);
    setForm(prev => ({ ...prev, landing_faq_ar: JSON.stringify(updated) }));
  };

  // Extra sections helpers
  const extraSections: { title: string; content: string; image?: string }[] = safeJsonParse(form.landing_extra_sections, []);
  const addExtraSection = () => {
    const updated = [...extraSections, { title: '', content: '' }];
    setForm(prev => ({ ...prev, landing_extra_sections: JSON.stringify(updated) }));
  };
  const updateExtraSection = (i: number, field: string, value: string) => {
    const updated = [...extraSections];
    (updated[i] as Record<string, string>)[field] = value;
    setForm(prev => ({ ...prev, landing_extra_sections: JSON.stringify(updated) }));
  };
  const removeExtraSection = (i: number) => {
    const updated = extraSections.filter((_, idx) => idx !== i);
    setForm(prev => ({ ...prev, landing_extra_sections: JSON.stringify(updated) }));
  };
  const uploadExtraSectionImage = async (i: number, files: FileList) => {
    const url = await onUpload(files[0]);
    if (url) updateExtraSection(i, 'image', url);
  };

  // Offers helpers
  const offers: { title: string; description: string; discount: string; active: boolean }[] = safeJsonParse(form.landing_offers, []);
  const addOffer = () => {
    const updated = [...offers, { title: '', description: '', discount: '', active: true }];
    setForm(prev => ({ ...prev, landing_offers: JSON.stringify(updated) }));
  };
  const updateOffer = (i: number, field: string, value: string | boolean) => {
    const updated = [...offers];
    (updated[i] as Record<string, string | boolean>)[field] = value;
    setForm(prev => ({ ...prev, landing_offers: JSON.stringify(updated) }));
  };
  const removeOffer = (i: number) => {
    const updated = offers.filter((_, idx) => idx !== i);
    setForm(prev => ({ ...prev, landing_offers: JSON.stringify(updated) }));
  };

  const sectionTabs = [
    { key: 'basic' as const, label: 'أساسي', icon: '📝' },
    { key: 'media' as const, label: 'الوسائط', icon: '🖼️' },
    { key: 'landing' as const, label: 'صفحة الهبوط', icon: '🎯' },
    { key: 'advanced' as const, label: 'متقدم', icon: '⚙️' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60"></div>
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-white rounded-t-3xl p-4 md:p-5 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: '#F5EDE0' }}>
          <div>
            <h2 className="text-base md:text-lg font-bold" style={{ color: '#2C1810' }}>{product ? '✏️ تعديل المنتج' : '➕ إضافة منتج جديد'}</h2>
            <p className="text-[11px]" style={{ color: '#A67B5B' }}>املأ البيانات ثم اضغط حفظ</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F5EDE0] transition" style={{ color: '#4A3228' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b flex-shrink-0 overflow-x-auto" style={{ borderColor: '#F5EDE0' }}>
          {sectionTabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveSection(tab.key)} className={`flex-1 min-w-0 py-3 px-2 text-xs md:text-sm font-semibold text-center transition-all whitespace-nowrap ${activeSection === tab.key ? '' : 'hover:bg-[#FDF8F0]'}`} style={activeSection === tab.key ? { borderBottom: '2px solid #8B5E3C', color: '#8B5E3C' } : { color: '#A67B5B' }}>
              <span className="hidden md:inline">{tab.icon} </span>{tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {/* BASIC SECTION */}
          {activeSection === 'basic' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">الاسم بالعربية *</label>
                  <input type="text" value={form.name_ar} onChange={e => setForm(p => ({ ...p, name_ar: e.target.value }))} className="form-input" required />
                </div>
                <div>
                  <label className="form-label">الفئة</label>
                  <select value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))} className="form-input">
                    <option value="">بدون فئة</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">الوصف</label>
                <textarea value={form.description_ar} onChange={e => setForm(p => ({ ...p, description_ar: e.target.value }))} className="form-input" rows={3} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="form-label">السعر *</label><input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} className="form-input" /></div>
                <div><label className="form-label">السعر قبل الخصم</label><input type="number" value={form.compare_price} onChange={e => setForm(p => ({ ...p, compare_price: Number(e.target.value) }))} className="form-input" /></div>
                <div><label className="form-label">المخزون</label><input type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: Number(e.target.value) }))} className="form-input" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">المقاسات (مفصولة بفاصلة)</label>
                  <input type="text" value={(() => { try { return JSON.parse(form.sizes).join(', '); } catch { return ''; } })()} onChange={e => setForm(p => ({ ...p, sizes: JSON.stringify(e.target.value.split(',').map(s => s.trim()).filter(Boolean)) }))} className="form-input" placeholder="S, M, L, XL" />
                </div>
                <div>
                  <label className="form-label">الألوان (مفصولة بفاصلة)</label>
                  <input type="text" value={(() => { try { return JSON.parse(form.colors).join(', '); } catch { return ''; } })()} onChange={e => setForm(p => ({ ...p, colors: JSON.stringify(e.target.value.split(',').map(s => s.trim()).filter(Boolean)) }))} className="form-input" placeholder="أحمر, أزرق, أبيض" />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))} className="w-4 h-4 rounded" style={{ accentColor: '#8B5E3C' }} />
                  <span className="text-sm font-semibold" style={{ color: '#2C1810' }}>⭐ مميز</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_new} onChange={e => setForm(p => ({ ...p, is_new: e.target.checked }))} className="w-4 h-4 rounded" style={{ accentColor: '#8B5E3C' }} />
                  <span className="text-sm font-semibold" style={{ color: '#2C1810' }}>🆕 جديد</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded" style={{ accentColor: '#8B5E3C' }} />
                  <span className="text-sm font-semibold" style={{ color: '#2C1810' }}>✅ نشط</span>
                </label>
              </div>
            </>
          )}

          {/* MEDIA SECTION */}
          {activeSection === 'media' && (
            <>
              {/* Main Image */}
              <UploadZone
                label="📸 الصورة الرئيسية"
                accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
                files={form.main_image ? [form.main_image] : []}
                onUpload={handleMainImageUpload}
                onRemove={() => setForm(prev => ({ ...prev, main_image: '' }))}
                uploading={uploadingMain}
                icon="📸"
                hint="JPEG, PNG, WebP - الحد الأقصى 5 ميغابايت"
              />

              {/* Gallery */}
              <UploadZone
                label="🖼️ معرض الصور (يمكنك رفع عدة صور)"
                accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
                multiple
                files={safeJsonParse(form.landing_gallery, [])}
                onUpload={handleGalleryUpload}
                onRemove={removeGalleryImage}
                onReorder={reorderGallery}
                uploading={uploadingGallery}
                icon="🖼️"
                hint="اسحب الصور لإعادة الترتيب - يمكنك رفع عدة صور مرة واحدة"
              />

              {/* Video */}
              <div>
                <label className="form-label">🎥 فيديو المنتج</label>
                {form.landing_video_url && (
                  <div className="mb-2 relative group">
                    <div className="rounded-xl overflow-hidden bg-[#F5EDE0] aspect-video max-w-xs" style={{ border: '2px solid #E8C9A0' }}>
                      {form.landing_video_url.includes('youtube') || form.landing_video_url.includes('vimeo') ? (
                        <iframe src={form.landing_video_url} className="w-full h-full" allowFullScreen />
                      ) : (
                        <video src={form.landing_video_url} className="w-full h-full object-cover" controls />
                      )}
                    </div>
                    <button type="button" onClick={() => setForm(prev => ({ ...prev, landing_video_url: '' }))} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transition">✕</button>
                  </div>
                )}
                <div className="space-y-2">
                  <UploadZone
                    label=""
                    accept="video/mp4,video/webm,video/quicktime"
                    files={[]}
                    onUpload={handleVideoUpload}
                    onRemove={() => {}}
                    uploading={uploadingVideo}
                    icon="🎥"
                    hint="MP4, WebM - الحد الأقصى 50 ميغابايت"
                  />
                  <div className="relative">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t" style={{ borderColor: '#E8C9A0' }} />
                    <p className="relative text-center"><span className="bg-white px-3 text-[11px] font-semibold" style={{ color: '#A67B5B' }}>أو أدخل رابط YouTube/Vimeo</span></p>
                  </div>
                  <input type="text" value={form.landing_video_url.includes('http') && (form.landing_video_url.includes('youtube') || form.landing_video_url.includes('vimeo')) ? form.landing_video_url : ''} onChange={e => setForm(p => ({ ...p, landing_video_url: e.target.value }))} className="form-input" dir="ltr" placeholder="https://www.youtube.com/embed/..." />
                </div>
              </div>
            </>
          )}

          {/* LANDING SECTION */}
          {activeSection === 'landing' && (
            <>
              <div>
                <label className="form-label">عنوان صفحة الهبوط</label>
                <input type="text" value={form.landing_title_ar} onChange={e => setForm(p => ({ ...p, landing_title_ar: e.target.value }))} className="form-input" />
              </div>
              <div>
                <label className="form-label">العنوان الفرعي</label>
                <input type="text" value={form.landing_subtitle_ar} onChange={e => setForm(p => ({ ...p, landing_subtitle_ar: e.target.value }))} className="form-input" />
              </div>
              <div>
                <label className="form-label">مميزات المنتج (كل سطر = ميزة)</label>
                <textarea
                  value={(() => { try { return JSON.parse(form.landing_features_ar).join('\n'); } catch { return ''; } })()}
                  onChange={e => setForm(p => ({ ...p, landing_features_ar: JSON.stringify(e.target.value.split('\n').filter(Boolean)) }))}
                  className="form-input" rows={4} placeholder="ميزة 1&#10;ميزة 2&#10;ميزة 3"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">نص زر الشراء (CTA)</label>
                  <input type="text" value={form.landing_cta_ar} onChange={e => setForm(p => ({ ...p, landing_cta_ar: e.target.value }))} className="form-input" placeholder="اطلبي الآن!" />
                </div>
                <div>
                  <label className="form-label">شارة العرض</label>
                  <input type="text" value={form.landing_offer_badge_ar} onChange={e => setForm(p => ({ ...p, landing_offer_badge_ar: e.target.value }))} className="form-input" placeholder="خصم 50% لفترة محدودة!" />
                </div>
              </div>

              {/* Detail Images Upload in Landing Tab */}
              <UploadZone
                label="📸 صور تفاصيل المنتج"
                accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
                multiple
                files={safeJsonParse(form.landing_detail_images, [])}
                onUpload={handleDetailUpload}
                onRemove={removeDetailImage}
                onReorder={reorderDetailImages}
                uploading={uploadingDetail}
                icon="📸"
                hint="أضيفي صور التفاصيل والمميزات — تظهر في صفحة الهبوط"
              />

              {/* Special Offers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label !mb-0">🏷️ العروض الخاصة ({offers.length})</label>
                  <button type="button" onClick={addOffer} className="text-xs font-bold px-3 py-1.5 rounded-lg transition" style={{ backgroundColor: '#FDF8F0', color: '#8B5E3C' }}>+ إضافة عرض</button>
                </div>
                <div className="space-y-2">
                  {offers.map((o, i) => (
                    <div key={i} className="p-3 rounded-xl relative" style={{ backgroundColor: o.active ? '#FDF8F0' : '#F9F5F0', border: `1px solid ${o.active ? '#C9A94E' : '#F5EDE0'}`, opacity: o.active ? 1 : 0.7 }}>
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <button type="button" onClick={() => updateOffer(i, 'active', !o.active)} className={`w-8 h-4.5 rounded-full relative transition-colors ${o.active ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all ${o.active ? 'left-[calc(100%-16px)]' : 'left-0.5'}`} />
                        </button>
                        <button type="button" onClick={() => removeOffer(i)} className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs hover:bg-red-200 transition">✕</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 mt-1">
                        <input type="text" placeholder="عنوان العرض (مثلاً: عرض الصيف)" value={o.title} onChange={e => updateOffer(i, 'title', e.target.value)} className="form-input !py-1.5 text-xs" />
                        <input type="text" placeholder="نسبة الخصم (مثلاً: -50% أو خصم 100 د.م)" value={o.discount} onChange={e => updateOffer(i, 'discount', e.target.value)} className="form-input !py-1.5 text-xs" />
                      </div>
                      <textarea placeholder="وصف العرض (مثلاً: احصلي على خصم حصري عند الطلب اليوم)" value={o.description} onChange={e => updateOffer(i, 'description', e.target.value)} className="form-input !py-1.5 text-xs" rows={2} />
                    </div>
                  ))}
                  {offers.length === 0 && <p className="text-center text-xs py-4" style={{ color: '#A67B5B' }}>لم يتم إضافة عروض بعد — أضيفي عروض خاصة تظهر في صفحة الهبوط</p>}
                </div>
              </div>

              {/* Countdown Timer Controls */}
              {(() => {
                const ls: Record<string, unknown> = safeJsonParse(form.landing_settings, {});
                const updateLS = (key: string, value: unknown) => {
                  const updated = { ...safeJsonParse(form.landing_settings, {} as Record<string, unknown>), [key]: value };
                  setForm(prev => ({ ...prev, landing_settings: JSON.stringify(updated) }));
                };
                return (
                  <>
                    <div className="p-3 rounded-xl" style={{ backgroundColor: '#FDF8F0', border: '1px solid #F5EDE0' }}>
                      <div className="flex items-center justify-between mb-3">
                        <label className="form-label !mb-0">⏰ العد التنازلي</label>
                        <button type="button" onClick={() => updateLS('countdown_enabled', !(ls.countdown_enabled !== false))} className={`w-10 h-5.5 rounded-full relative transition-colors ${ls.countdown_enabled !== false ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-all ${ls.countdown_enabled !== false ? 'left-[calc(100%-20px)]' : 'left-0.5'}`} />
                        </button>
                      </div>
                      {ls.countdown_enabled !== false && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-semibold block mb-1" style={{ color: '#A67B5B' }}>الساعات</label>
                            <input type="number" min={0} max={99} value={Number(ls.countdown_hours ?? 2)} onChange={e => updateLS('countdown_hours', Math.max(0, parseInt(e.target.value) || 0))} className="form-input !py-1.5 text-xs text-center" dir="ltr" />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold block mb-1" style={{ color: '#A67B5B' }}>الدقائق</label>
                            <input type="number" min={0} max={59} value={Number(ls.countdown_minutes ?? 45)} onChange={e => updateLS('countdown_minutes', Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))} className="form-input !py-1.5 text-xs text-center" dir="ltr" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Social Proof Toast Controls */}
                    <div className="p-3 rounded-xl" style={{ backgroundColor: '#FDF8F0', border: '1px solid #F5EDE0' }}>
                      <div className="flex items-center justify-between mb-3">
                        <label className="form-label !mb-0">🔔 إشعارات الشراء الحية</label>
                        <button type="button" onClick={() => updateLS('toast_enabled', !(ls.toast_enabled !== false))} className={`w-10 h-5.5 rounded-full relative transition-colors ${ls.toast_enabled !== false ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-all ${ls.toast_enabled !== false ? 'left-[calc(100%-20px)]' : 'left-0.5'}`} />
                        </button>
                      </div>
                      {ls.toast_enabled !== false && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-semibold" style={{ color: '#A67B5B' }}>أسماء المشتريات ({((ls.proof_names as string[]) || []).length})</label>
                            <button type="button" onClick={() => updateLS('proof_names', [...((ls.proof_names as string[]) || []), ''])} className="text-[10px] font-bold px-2 py-1 rounded-lg transition" style={{ backgroundColor: '#FFF', color: '#8B5E3C' }}>+ إضافة اسم</button>
                          </div>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {((ls.proof_names as string[]) || []).map((name: string, i: number) => (
                              <div key={i} className="flex items-center gap-1.5">
                                <input type="text" value={name} placeholder="اسم المشترية..." onChange={e => { const names = [...((ls.proof_names as string[]) || [])]; names[i] = e.target.value; updateLS('proof_names', names); }} className="form-input !py-1 text-xs flex-1" />
                                <button type="button" onClick={() => { const names = ((ls.proof_names as string[]) || []).filter((_: string, idx: number) => idx !== i); updateLS('proof_names', names); }} className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs hover:bg-red-200 transition flex-shrink-0">✕</button>
                              </div>
                            ))}
                          </div>
                          {((ls.proof_names as string[]) || []).length === 0 && <p className="text-center text-[10px] py-2" style={{ color: '#A67B5B' }}>سيتم استخدام الأسماء الافتراضية — أضيفي أسماء مخصصة</p>}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </>
          )}

          {/* ADVANCED SECTION */}
          {activeSection === 'advanced' && (
            <>
              {/* Testimonials */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label !mb-0">⭐ آراء الزبونات ({testimonials.length})</label>
                  <button type="button" onClick={addTestimonial} className="text-xs font-bold px-3 py-1.5 rounded-lg transition" style={{ backgroundColor: '#FDF8F0', color: '#8B5E3C' }}>+ إضافة رأي</button>
                </div>
                <div className="space-y-2">
                  {testimonials.map((t, i) => (
                    <div key={i} className="p-3 rounded-xl relative" style={{ backgroundColor: '#FDF8F0', border: '1px solid #F5EDE0' }}>
                      <button type="button" onClick={() => removeTestimonial(i)} className="absolute top-2 left-2 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs hover:bg-red-200 transition">✕</button>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                        <input type="text" placeholder="الاسم" value={t.name} onChange={e => updateTestimonial(i, 'name', e.target.value)} className="form-input !py-1.5 text-xs" />
                        <input type="text" placeholder="المدينة" value={t.city} onChange={e => updateTestimonial(i, 'city', e.target.value)} className="form-input !py-1.5 text-xs" />
                        <select value={t.rating} onChange={e => updateTestimonial(i, 'rating', Number(e.target.value))} className="form-input !py-1.5 text-xs">
                          {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} ⭐</option>)}
                        </select>
                      </div>
                      <textarea placeholder="نص الرأي..." value={t.text} onChange={e => updateTestimonial(i, 'text', e.target.value)} className="form-input !py-1.5 text-xs" rows={2} />
                    </div>
                  ))}
                  {testimonials.length === 0 && <p className="text-center text-xs py-4" style={{ color: '#A67B5B' }}>لم يتم إضافة آراء بعد</p>}
                </div>
              </div>

              {/* FAQs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label !mb-0">❓ الأسئلة الشائعة ({faqs.length})</label>
                  <button type="button" onClick={addFaq} className="text-xs font-bold px-3 py-1.5 rounded-lg transition" style={{ backgroundColor: '#FDF8F0', color: '#8B5E3C' }}>+ إضافة سؤال</button>
                </div>
                <div className="space-y-2">
                  {faqs.map((f, i) => (
                    <div key={i} className="p-3 rounded-xl relative" style={{ backgroundColor: '#FDF8F0', border: '1px solid #F5EDE0' }}>
                      <button type="button" onClick={() => removeFaq(i)} className="absolute top-2 left-2 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs hover:bg-red-200 transition">✕</button>
                      <input type="text" placeholder="السؤال" value={f.question} onChange={e => updateFaq(i, 'question', e.target.value)} className="form-input !py-1.5 text-xs mb-2" />
                      <textarea placeholder="الجواب" value={f.answer} onChange={e => updateFaq(i, 'answer', e.target.value)} className="form-input !py-1.5 text-xs" rows={2} />
                    </div>
                  ))}
                  {faqs.length === 0 && <p className="text-center text-xs py-4" style={{ color: '#A67B5B' }}>لم يتم إضافة أسئلة بعد</p>}
                </div>
              </div>

              {/* Extra Sections */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label !mb-0">📄 أقسام إضافية ({extraSections.length})</label>
                  <button type="button" onClick={addExtraSection} className="text-xs font-bold px-3 py-1.5 rounded-lg transition" style={{ backgroundColor: '#FDF8F0', color: '#8B5E3C' }}>+ إضافة قسم</button>
                </div>
                <div className="space-y-2">
                  {extraSections.map((sec, i) => (
                    <div key={i} className="p-3 rounded-xl relative" style={{ backgroundColor: '#FDF8F0', border: '1px solid #F5EDE0' }}>
                      <button type="button" onClick={() => removeExtraSection(i)} className="absolute top-2 left-2 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs hover:bg-red-200 transition">✕</button>
                      <input type="text" placeholder="عنوان القسم" value={sec.title} onChange={e => updateExtraSection(i, 'title', e.target.value)} className="form-input !py-1.5 text-xs mb-2" />
                      <textarea placeholder="المحتوى" value={sec.content} onChange={e => updateExtraSection(i, 'content', e.target.value)} className="form-input !py-1.5 text-xs mb-2" rows={3} />
                      <div className="flex items-center gap-2">
                        {sec.image && <div className="w-12 h-12 rounded-lg overflow-hidden bg-white"><img src={sec.image} alt="" className="w-full h-full object-cover" /></div>}
                        <label className="text-[11px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition hover:opacity-80" style={{ backgroundColor: '#E8C9A0', color: '#4A3228' }}>
                          📸 {sec.image ? 'تغيير الصورة' : 'إضافة صورة'}
                          <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.length) uploadExtraSectionImage(i, e.target.files); }} />
                        </label>
                        {sec.image && <button type="button" onClick={() => updateExtraSection(i, 'image', '')} className="text-[11px] text-red-500 font-semibold">حذف الصورة</button>}
                      </div>
                    </div>
                  ))}
                  {extraSections.length === 0 && <p className="text-center text-xs py-4" style={{ color: '#A67B5B' }}>لم يتم إضافة أقسام بعد</p>}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t p-4 flex-shrink-0 flex items-center gap-3" style={{ borderColor: '#F5EDE0' }}>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition hover:bg-[#F5EDE0]" style={{ color: '#4A3228' }}>إلغاء</button>
          <button onClick={() => onSave(form)} className="btn-moroccan flex-1 py-2.5 rounded-xl text-sm">
            {product ? '💾 حفظ التعديلات' : '➕ إضافة المنتج'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Categories Manager Component
function CategoriesManager({ token, categories, reload }: { token: string; categories: Category[]; reload: () => void }) {
  const [newCat, setNewCat] = useState({ name: '', name_ar: '', slug: '' });

  const addCategory = async () => {
    if (!newCat.name_ar) return;
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...newCat, slug: newCat.slug || newCat.name.toLowerCase().replace(/\s+/g, '-') || newCat.name_ar }),
    });
    setNewCat({ name: '', name_ar: '', slug: '' });
    reload();
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-bold mb-4" style={{ color: '#2C1810' }}>➕ إضافة فئة جديدة</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="الاسم بالعربية"
            value={newCat.name_ar}
            onChange={e => setNewCat(p => ({ ...p, name_ar: e.target.value }))}
            className="px-3 py-2 rounded-lg" style={{ border: '1px solid #E8C9A0' }}
          />
          <input
            type="text"
            placeholder="Name (English)"
            value={newCat.name}
            onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
            className="px-3 py-2 rounded-lg" style={{ border: '1px solid #E8C9A0', direction: 'ltr' }}
          />
          <button onClick={addCategory} className="btn-moroccan rounded-lg text-sm">➕ إضافة</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-bold mb-4" style={{ color: '#2C1810' }}>📁 الفئات الحالية</h3>
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#FDF8F0' }}>
              <div>
                <span className="font-bold" style={{ color: '#2C1810' }}>{cat.name_ar}</span>
                <span className="text-xs mr-2" style={{ color: '#8B5E3C' }}>({cat.name})</span>
              </div>
              <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: cat.is_active ? '#DCFCE7' : '#FEE2E2', color: cat.is_active ? '#166534' : '#991B1B' }}>
                {cat.is_active ? 'نشط' : 'معطل'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
