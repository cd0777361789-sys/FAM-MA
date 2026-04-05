'use client';

import { useState, useEffect, useCallback } from 'react';
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
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
    return null;
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
  });
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await onUpload(file);
    if (url) setForm(prev => ({ ...prev, main_image: url }));
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60"></div>
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white rounded-t-3xl p-6 border-b z-10 flex items-center justify-between" style={{ borderColor: '#F5EDE0' }}>
          <h2 className="text-lg font-bold" style={{ color: '#2C1810' }}>{product ? '✏️ تعديل المنتج' : '➕ إضافة منتج جديد'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F5EDE0' }}>✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1" style={{ color: '#2C1810' }}>الاسم بالعربية *</label>
              <input type="text" value={form.name_ar} onChange={e => setForm(p => ({ ...p, name_ar: e.target.value }))} className="w-full px-3 py-2 rounded-lg" style={{ border: '1px solid #E8C9A0' }} required />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1" style={{ color: '#2C1810' }}>الفئة</label>
              <select value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))} className="w-full px-3 py-2 rounded-lg" style={{ border: '1px solid #E8C9A0' }}>
                <option value="">بدون فئة</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1" style={{ color: '#2C1810' }}>الوصف</label>
            <textarea value={form.description_ar} onChange={e => setForm(p => ({ ...p, description_ar: e.target.value }))} className="w-full px-3 py-2 rounded-lg" style={{ border: '1px solid #E8C9A0' }} rows={3} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1" style={{ color: '#2C1810' }}>السعر *</label>
              <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg" style={{ border: '1px solid #E8C9A0' }} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1" style={{ color: '#2C1810' }}>السعر قبل الخصم</label>
              <input type="number" value={form.compare_price} onChange={e => setForm(p => ({ ...p, compare_price: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg" style={{ border: '1px solid #E8C9A0' }} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1" style={{ color: '#2C1810' }}>المخزون</label>
              <input type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg" style={{ border: '1px solid #E8C9A0' }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1" style={{ color: '#2C1810' }}>المقاسات (مفصولة بفاصلة)</label>
              <input
                type="text"
                value={(() => { try { return JSON.parse(form.sizes).join(', '); } catch { return ''; } })()}
                onChange={e => setForm(p => ({ ...p, sizes: JSON.stringify(e.target.value.split(',').map(s => s.trim()).filter(Boolean)) }))}
                className="w-full px-3 py-2 rounded-lg" style={{ border: '1px solid #E8C9A0' }}
                placeholder="S, M, L, XL"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1" style={{ color: '#2C1810' }}>الألوان (مفصولة بفاصلة)</label>
              <input
                type="text"
                value={(() => { try { return JSON.parse(form.colors).join(', '); } catch { return ''; } })()}
                onChange={e => setForm(p => ({ ...p, colors: JSON.stringify(e.target.value.split(',').map(s => s.trim()).filter(Boolean)) }))}
                className="w-full px-3 py-2 rounded-lg" style={{ border: '1px solid #E8C9A0' }}
                placeholder="أحمر, أزرق, أبيض"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1" style={{ color: '#2C1810' }}>صورة المنتج</label>
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
              {uploading && <span className="text-sm" style={{ color: '#8B5E3C' }}>جاري الرفع...</span>}
            </div>
            {form.main_image && (
              <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden">
                <img src={form.main_image} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))} className="w-4 h-4" />
              <span className="text-sm font-semibold" style={{ color: '#2C1810' }}>⭐ منتج مميز</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_new} onChange={e => setForm(p => ({ ...p, is_new: e.target.checked }))} className="w-4 h-4" />
              <span className="text-sm font-semibold" style={{ color: '#2C1810' }}>🆕 منتج جديد</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4" />
              <span className="text-sm font-semibold" style={{ color: '#2C1810' }}>✅ نشط</span>
            </label>
          </div>

          {/* Landing Page Fields */}
          <div className="pt-4 border-t" style={{ borderColor: '#F5EDE0' }}>
            <h3 className="font-bold mb-3" style={{ color: '#8B5E3C' }}>🎯 صفحة الهبوط</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold mb-1" style={{ color: '#2C1810' }}>عنوان صفحة الهبوط</label>
                <input type="text" value={form.landing_title_ar} onChange={e => setForm(p => ({ ...p, landing_title_ar: e.target.value }))} className="w-full px-3 py-2 rounded-lg" style={{ border: '1px solid #E8C9A0' }} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1" style={{ color: '#2C1810' }}>العنوان الفرعي</label>
                <input type="text" value={form.landing_subtitle_ar} onChange={e => setForm(p => ({ ...p, landing_subtitle_ar: e.target.value }))} className="w-full px-3 py-2 rounded-lg" style={{ border: '1px solid #E8C9A0' }} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1" style={{ color: '#2C1810' }}>مميزات المنتج (كل سطر = ميزة)</label>
                <textarea
                  value={(() => { try { return JSON.parse(form.landing_features_ar).join('\n'); } catch { return ''; } })()}
                  onChange={e => setForm(p => ({ ...p, landing_features_ar: JSON.stringify(e.target.value.split('\n').filter(Boolean)) }))}
                  className="w-full px-3 py-2 rounded-lg" style={{ border: '1px solid #E8C9A0' }} rows={4}
                  placeholder="ميزة 1&#10;ميزة 2&#10;ميزة 3"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1" style={{ color: '#2C1810' }}>نص زر الشراء (CTA)</label>
                <input type="text" value={form.landing_cta_ar} onChange={e => setForm(p => ({ ...p, landing_cta_ar: e.target.value }))} className="w-full px-3 py-2 rounded-lg" style={{ border: '1px solid #E8C9A0' }} placeholder="اطلبي الآن!" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1" style={{ color: '#2C1810' }}>شارة العرض (تظهر أعلى الصفحة)</label>
                <input type="text" value={form.landing_offer_badge_ar} onChange={e => setForm(p => ({ ...p, landing_offer_badge_ar: e.target.value }))} className="w-full px-3 py-2 rounded-lg" style={{ border: '1px solid #E8C9A0' }} placeholder="خصم 50% لفترة محدودة!" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1" style={{ color: '#2C1810' }}>رابط الفيديو (YouTube/Vimeo embed)</label>
                <input type="text" value={form.landing_video_url} onChange={e => setForm(p => ({ ...p, landing_video_url: e.target.value }))} className="w-full px-3 py-2 rounded-lg" style={{ border: '1px solid #E8C9A0' }} dir="ltr" placeholder="https://www.youtube.com/embed/..." />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1" style={{ color: '#2C1810' }}>معرض الصور (روابط الصور - كل سطر = صورة)</label>
                <textarea
                  value={(() => { try { return JSON.parse(form.landing_gallery).join('\n'); } catch { return ''; } })()}
                  onChange={e => setForm(p => ({ ...p, landing_gallery: JSON.stringify(e.target.value.split('\n').filter(Boolean)) }))}
                  className="w-full px-3 py-2 rounded-lg" style={{ border: '1px solid #E8C9A0' }} rows={3} dir="ltr"
                  placeholder="/uploads/img1.jpg&#10;/uploads/img2.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1" style={{ color: '#2C1810' }}>آراء الزبونات (JSON)</label>
                <textarea
                  value={form.landing_testimonials}
                  onChange={e => setForm(p => ({ ...p, landing_testimonials: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs font-mono" style={{ border: '1px solid #E8C9A0' }} rows={4} dir="ltr"
                  placeholder='[{"name":"فاطمة","city":"الدار البيضاء","text":"منتج رائع!","rating":5}]'
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1" style={{ color: '#2C1810' }}>الأسئلة الشائعة (JSON)</label>
                <textarea
                  value={form.landing_faq_ar}
                  onChange={e => setForm(p => ({ ...p, landing_faq_ar: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs font-mono" style={{ border: '1px solid #E8C9A0' }} rows={4} dir="ltr"
                  placeholder='[{"question":"هل التوصيل مجاني؟","answer":"نعم، التوصيل مجاني لجميع المدن"}]'
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1" style={{ color: '#2C1810' }}>أقسام إضافية (JSON)</label>
                <textarea
                  value={form.landing_extra_sections}
                  onChange={e => setForm(p => ({ ...p, landing_extra_sections: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs font-mono" style={{ border: '1px solid #E8C9A0' }} rows={3} dir="ltr"
                  placeholder='[{"title":"العنوان","content":"المحتوى","image":"/uploads/img.jpg"}]'
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => onSave(form)}
            className="btn-moroccan w-full py-3 rounded-xl text-lg"
          >
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
