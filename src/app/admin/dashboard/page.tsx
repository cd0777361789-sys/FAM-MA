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
  pending: { label: 'ÙÙŠ Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±', color: '#92400E', bg: '#FEF3C7' },
  confirmed: { label: 'Ù…Ø¤ÙƒØ¯', color: '#1E40AF', bg: '#DBEAFE' },
  shipped: { label: 'ØªÙ… Ø§Ù„Ø´Ø­Ù†', color: '#6B21A8', bg: '#F3E8FF' },
  delivered: { label: 'ØªÙ… Ø§Ù„ØªÙˆØµÙŠÙ„', color: '#166534', bg: '#DCFCE7' },
  cancelled: { label: 'Ù…Ù„ØºÙŠ', color: '#991B1B', bg: '#FEE2E2' },
  returned: { label: 'Ù…Ø±ØªØ¬Ø¹', color: '#6B7280', bg: '#F3F4F6' },
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
    if (!confirm('Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø­Ø°Ù Ù‡Ø°Ø§ Ø§Ù„Ø·Ù„Ø¨ØŸ')) return;
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
    if (!confirm('Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø­Ø°Ù Ù‡Ø°Ø§ Ø§Ù„Ù…Ù†ØªØ¬ØŸ')) return;
    await authFetch(`/api/products/${id}`, { method: 'DELETE' });
    loadProducts();
  };

  const saveSettings = async () => {
    await authFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    alert('ØªÙ… Ø­ÙØ¸ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø¨Ù†Ø¬Ø§Ø­ âœ…');
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
      const data = await res.json();
      if (res.ok && data.url) {
        return data.url;
      }
      alert(`Ø®Ø·Ø£ ÙÙŠ Ø±ÙØ¹ Ø§Ù„ØµÙˆØ±Ø©: ${data.error || 'ÙØ´Ù„ Ø§Ù„Ø±ÙØ¹'}`);
      return null;
    } catch (err) {
      alert(`Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø§ØªØµØ§Ù„ Ø£Ø«Ù†Ø§Ø¡ Ø±ÙØ¹ Ø§Ù„ØµÙˆØ±Ø©: ${err instanceof Error ? err.message : 'Ø®Ø·Ø£ ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ'}`);
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
          <p style={{ color: '#8B5E3C' }}>Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„...</p>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…', icon: 'ðŸ“Š' },
    { key: 'orders', label: 'Ø§Ù„Ø·Ù„Ø¨Ø§Øª', icon: 'ðŸ“¦' },
    { key: 'products', label: 'Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª', icon: 'ðŸ›ï¸' },
    { key: 'categories', label: 'Ø§Ù„ÙØ¦Ø§Øª', icon: 'ðŸ“' },
    { key: 'settings', label: 'Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª', icon: 'âš™ï¸' },
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
              <p className="text-white/50 text-xs">Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…</p>
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
            ðŸŒ Ø¹Ø±Ø¶ Ø§Ù„Ù…ØªØ¬Ø±
          </Link>
          <button onClick={handleLogout} className="w-full text-center text-red-400 text-sm hover:text-red-300 transition">
            ðŸšª ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬
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
            Ù…Ø±Ø­Ø¨Ø§Ù‹ØŒ <strong>Admin</strong>
          </div>
        </div>

        <div className="p-4 lg:p-8">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && stats && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                  { label: 'Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø·Ù„Ø¨Ø§Øª', value: stats.totalOrders, icon: 'ðŸ“¦', color: '#8B5E3C' },
                  { label: 'ÙÙŠ Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±', value: stats.pendingOrders, icon: 'â³', color: '#D97706' },
                  { label: 'Ù…Ø¤ÙƒØ¯Ø©', value: stats.confirmedOrders, icon: 'âœ…', color: '#2563EB' },
                  { label: 'ØªÙ… Ø§Ù„ØªÙˆØµÙŠÙ„', value: stats.deliveredOrders, icon: 'ðŸšš', color: '#16A34A' },
                  { label: 'Ø§Ù„Ø¥ÙŠØ±Ø§Ø¯Ø§Øª', value: `${stats.totalRevenue.toFixed(0)} Ø¯.Ù…`, icon: 'ðŸ’°', color: '#C9A94E' },
                  { label: 'Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª', value: stats.totalProducts, icon: 'ðŸ›ï¸', color: '#C41E3A' },
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
                <h3 className="text-lg font-bold mb-4" style={{ color: '#2C1810' }}>ðŸ“‹ Ø¢Ø®Ø± Ø§Ù„Ø·Ù„Ø¨Ø§Øª</h3>
                {recentOrders.length === 0 ? (
                  <p className="text-center py-8" style={{ color: '#4A3228' }}>Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª Ø¨Ø¹Ø¯</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: '2px solid #F5EDE0' }}>
                          <th className="py-3 px-2 text-right font-bold" style={{ color: '#4A3228' }}>Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨</th>
                          <th className="py-3 px-2 text-right font-bold" style={{ color: '#4A3228' }}>Ø§Ù„Ø²Ø¨ÙˆÙ†</th>
                          <th className="py-3 px-2 text-right font-bold" style={{ color: '#4A3228' }}>Ø§Ù„Ù…Ù†ØªØ¬</th>
                          <th className="py-3 px-2 text-right font-bold" style={{ color: '#4A3228' }}>Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹</th>
                          <th className="py-3 px-2 text-right font-bold" style={{ color: '#4A3228' }}>Ø§Ù„Ø­Ø§Ù„Ø©</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map(order => (
                          <tr key={order.id} style={{ borderBottom: '1px solid #F5EDE0' }}>
                            <td className="py-3 px-2 font-medium" style={{ color: '#8B5E3C' }}>{order.order_number}</td>
                            <td className="py-3 px-2" style={{ color: '#2C1810' }}>{order.customer_name}</td>
                            <td className="py-3 px-2" style={{ color: '#4A3228' }}>{order.product_name}</td>
                            <td className="py-3 px-2 font-bold" style={{ color: '#C41E3A' }}>{order.total_price} Ø¯.Ù…</td>
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
                  { value: 'all', label: 'Ø§Ù„ÙƒÙ„' },
                  { value: 'pending', label: 'ÙÙŠ Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±' },
                  { value: 'confirmed', label: 'Ù…Ø¤ÙƒØ¯' },
                  { value: 'shipped', label: 'ØªÙ… Ø§Ù„Ø´Ø­Ù†' },
                  { value: 'delivered', label: 'ØªÙ… Ø§Ù„ØªÙˆØµÙŠÙ„' },
                  { value: 'cancelled', label: 'Ù…Ù„ØºÙŠ' },
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
                        <p className="font-semibold" style={{ color: '#2C1810' }}>ðŸ‘¤ {order.customer_name}</p>
                        <p className="text-sm" style={{ color: '#4A3228' }}>ðŸ“ž <a href={`tel:${order.customer_phone}`} dir="ltr">{order.customer_phone}</a></p>
                        <p className="text-sm" style={{ color: '#4A3228' }}>ðŸ“ {order.customer_city} - {order.customer_address}</p>
                        <p className="text-sm" style={{ color: '#4A3228' }}>ðŸ›ï¸ {order.product_name} {order.product_variant ? `(${order.product_variant})` : ''} Ã— {order.quantity}</p>
                        {order.notes && <p className="text-sm" style={{ color: '#8B5E3C' }}>ðŸ“ {order.notes}</p>}
                        <p className="text-xs" style={{ color: '#A67B5B' }}>ðŸ• {new Date(order.created_at).toLocaleString('ar-MA')}</p>
                      </div>
                      <div className="text-left space-y-2">
                        <p className="text-xl font-bold" style={{ color: '#C41E3A' }}>{order.total_price} Ø¯.Ù…</p>
                        <select
                          value={order.status}
                          onChange={e => updateOrderStatus(order.id, e.target.value)}
                          className="px-3 py-1.5 rounded-lg text-sm"
                          style={{ border: '1px solid #E8C9A0', color: '#2C1810' }}
                        >
                          <option value="pending">ÙÙŠ Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±</option>
                          <option value="confirmed">Ù…Ø¤ÙƒØ¯</option>
                          <option value="shipped">ØªÙ… Ø§Ù„Ø´Ø­Ù†</option>
                          <option value="delivered">ØªÙ… Ø§Ù„ØªÙˆØµÙŠÙ„</option>
                          <option value="cancelled">Ù…Ù„ØºÙŠ</option>
                          <option value="returned">Ù…Ø±ØªØ¬Ø¹</option>
                        </select>
                        <button onClick={() => deleteOrder(order.id)} className="block text-xs text-red-500 hover:text-red-700">ðŸ—‘ï¸ Ø­Ø°Ù</button>
                      </div>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <div className="bg-white rounded-2xl p-12 text-center">
                    <p className="text-lg" style={{ color: '#4A3228' }}>Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm" style={{ color: '#4A3228' }}>{products.length} Ù…Ù†ØªØ¬</p>
                <button onClick={() => { setEditingProduct(null); setShowProductForm(true); }} className="btn-moroccan text-sm py-2 px-5 rounded-xl">
                  âž• Ø¥Ø¶Ø§ÙØ© Ù…Ù†ØªØ¬
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(product => (
                  <div key={product.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="h-40 flex items-center justify-center" style={{ backgroundColor: '#F5EDE0' }}>
                      {product.main_image ? (
                        <img src={product.main_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">âœ¦</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold mb-1" style={{ color: '#2C1810' }}>{product.name_ar}</h3>
                      <p className="text-xs mb-2" style={{ color: '#C9A94E' }}>{product.category_name_ar}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-bold" style={{ color: '#C41E3A' }}>{product.price} Ø¯.Ù…</span>
                        {product.compare_price && <span className="text-xs line-through opacity-50">{product.compare_price} Ø¯.Ù…</span>}
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        {product.is_featured ? <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>â­ Ù…Ù…ÙŠØ²</span> : null}
                        {product.is_new ? <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>ðŸ†• Ø¬Ø¯ÙŠØ¯</span> : null}
                        <span className="text-xs" style={{ color: '#4A3228' }}>Ø§Ù„Ù…Ø®Ø²ÙˆÙ†: {product.stock}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingProduct(product); setShowProductForm(true); }} className="flex-1 text-xs py-2 rounded-lg font-semibold" style={{ backgroundColor: '#FDF8F0', color: '#8B5E3C' }}>
                          âœï¸ ØªØ¹Ø¯ÙŠÙ„
                        </button>
                        <Link href={`/product/${product.slug}`} target="_blank" className="flex-1 text-center text-xs py-2 rounded-lg font-semibold" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                          ðŸ‘ï¸ Ù…Ø¹Ø§ÙŠÙ†Ø©
                        </Link>
                        <button onClick={() => deleteProduct(product.id)} className="text-xs py-2 px-3 rounded-lg font-semibold" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                          ðŸ—‘ï¸
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
                <h3 className="font-bold mb-4" style={{ color: '#2C1810' }}>ðŸª Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ù…ØªØ¬Ø±</h3>
                {[
                  { key: 'site_name', label: 'Ø§Ø³Ù… Ø§Ù„Ù…ØªØ¬Ø± (Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠ)' },
                  { key: 'site_name_ar', label: 'Ø§Ø³Ù… Ø§Ù„Ù…ØªØ¬Ø± (Ø¹Ø±Ø¨ÙŠ)' },
                  { key: 'site_description', label: 'ÙˆØµÙ Ø§Ù„Ù…ØªØ¬Ø±' },
                  { key: 'site_phone', label: 'Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ' },
                  { key: 'site_email', label: 'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ' },
                  { key: 'site_address', label: 'Ø§Ù„Ø¹Ù†ÙˆØ§Ù†' },
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
                <h3 className="font-bold mb-4" style={{ color: '#2C1810' }}>ðŸ“± Ø±ÙˆØ§Ø¨Ø· Ø§Ù„ØªÙˆØ§ØµÙ„</h3>
                {[
                  { key: 'site_instagram', label: 'Ø§Ù†Ø³ØªØºØ±Ø§Ù…' },
                  { key: 'site_facebook', label: 'ÙÙŠØ³Ø¨ÙˆÙƒ' },
                  { key: 'site_whatsapp', label: 'ÙˆØ§ØªØ³Ø§Ø¨ (Ù…Ø¹ Ø±Ù…Ø² Ø§Ù„Ø¨Ù„Ø¯)' },
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
                <h3 className="font-bold mb-4" style={{ color: '#2C1810' }}>ðŸŽ¨ Ø§Ù„Ù…Ø¸Ù‡Ø± ÙˆØ§Ù„Ù†ØµÙˆØµ</h3>
                {[
                  { key: 'announcement_bar', label: 'Ø´Ø±ÙŠØ· Ø§Ù„Ø¥Ø¹Ù„Ø§Ù†' },
                  { key: 'cod_message', label: 'Ø±Ø³Ø§Ù„Ø© Ø§Ù„Ø¯ÙØ¹ Ø¹Ù†Ø¯ Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù…' },
                  { key: 'delivery_time', label: 'ÙˆÙ‚Øª Ø§Ù„ØªÙˆØµÙŠÙ„' },
                  { key: 'footer_text', label: 'Ù†Øµ Ø§Ù„ÙÙˆØªØ±' },
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
                ðŸ’¾ Ø­ÙØ¸ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª
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
                  <button type="button" onClick={() => onRemove(i)} className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold shadow-lg">âœ•</button>
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
          <div className="text-center py-4">
            <div className="w-8 h-8 mx-auto mb-2 rounded-full" style={{ border: '3px solid #E8C9A0', borderTopColor: '#8B5E3C', animation: 'spin 0.6s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p className="text-xs font-semibold" style={{ color: '#8B5E3C' }}>Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø±ÙØ¹...</p>
          </div>
        ) : (
          <div className="text-center py-4">
            <span className="text-2xl block mb-1">{icon}</span>
            <p className="text-xs font-bold" style={{ color: '#8B5E3C' }}>Ø§Ø¶ØºØ· Ø£Ùˆ Ø§Ø³Ø­Ø¨ Ø§Ù„Ù…Ù„ÙØ§Øª Ù‡Ù†Ø§</p>
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
    { key: 'basic' as const, label: 'Ø£Ø³Ø§Ø³ÙŠ', icon: 'ðŸ“' },
    { key: 'media' as const, label: 'Ø§Ù„ÙˆØ³Ø§Ø¦Ø·', icon: 'ðŸ–¼ï¸' },
    { key: 'landing' as const, label: 'ØµÙØ­Ø© Ø§Ù„Ù‡Ø¨ÙˆØ·', icon: 'ðŸŽ¯' },
    { key: 'advanced' as const, label: 'Ù…ØªÙ‚Ø¯Ù…', icon: 'âš™ï¸' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60"></div>
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-white rounded-t-3xl p-4 md:p-5 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: '#F5EDE0' }}>
          <div>
            <h2 className="text-base md:text-lg font-bold" style={{ color: '#2C1810' }}>{product ? 'âœï¸ ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ù…Ù†ØªØ¬' : 'âž• Ø¥Ø¶Ø§ÙØ© Ù…Ù†ØªØ¬ Ø¬Ø¯ÙŠØ¯'}</h2>
            <p className="text-[11px]" style={{ color: '#A67B5B' }}>Ø§Ù…Ù„Ø£ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø«Ù… Ø§Ø¶ØºØ· Ø­ÙØ¸</p>
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
                  <label className="form-label">Ø§Ù„Ø§Ø³Ù… Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© *</label>
                  <input type="text" value={form.name_ar} onChange={e => setForm(p => ({ ...p, name_ar: e.target.value }))} className="form-input" required />
                </div>
                <div>
                  <label className="form-label">Ø§Ù„ÙØ¦Ø©</label>
                  <select value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))} className="form-input">
                    <option value="">Ø¨Ø¯ÙˆÙ† ÙØ¦Ø©</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Ø§Ù„ÙˆØµÙ</label>
                <textarea value={form.description_ar} onChange={e => setForm(p => ({ ...p, description_ar: e.target.value }))} className="form-input" rows={3} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="form-label">Ø§Ù„Ø³Ø¹Ø± *</label><input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} className="form-input" /></div>
                <div><label className="form-label">Ø§Ù„Ø³Ø¹Ø± Ù‚Ø¨Ù„ Ø§Ù„Ø®ØµÙ…</label><input type="number" value={form.compare_price} onChange={e => setForm(p => ({ ...p, compare_price: Number(e.target.value) }))} className="form-input" /></div>
                <div><label className="form-label">Ø§Ù„Ù…Ø®Ø²ÙˆÙ†</label><input type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: Number(e.target.value) }))} className="form-input" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Ø§Ù„Ù…Ù‚Ø§Ø³Ø§Øª (Ù…ÙØµÙˆÙ„Ø© Ø¨ÙØ§ØµÙ„Ø©)</label>
                  <input type="text" value={(() => { try { return JSON.parse(form.sizes).join(', '); } catch { return ''; } })()} onChange={e => setForm(p => ({ ...p, sizes: JSON.stringify(e.target.value.split(',').map(s => s.trim()).filter(Boolean)) }))} className="form-input" placeholder="S, M, L, XL" />
                </div>
                <div>
                  <label className="form-label">Ø§Ù„Ø£Ù„ÙˆØ§Ù† (Ù…ÙØµÙˆÙ„Ø© Ø¨ÙØ§ØµÙ„Ø©)</label>
                  <input type="text" value={(() => { try { return JSON.parse(form.colors).join(', '); } catch { return ''; } })()} onChange={e => setForm(p => ({ ...p, colors: JSON.stringify(e.target.value.split(',').map(s => s.trim()).filter(Boolean)) }))} className="form-input" placeholder="Ø£Ø­Ù…Ø±, Ø£Ø²Ø±Ù‚, Ø£Ø¨ÙŠØ¶" />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))} className="w-4 h-4 rounded" style={{ accentColor: '#8B5E3C' }} />
                  <span className="text-sm font-semibold" style={{ color: '#2C1810' }}>â­ Ù…Ù…ÙŠØ²</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_new} onChange={e => setForm(p => ({ ...p, is_new: e.target.checked }))} className="w-4 h-4 rounded" style={{ accentColor: '#8B5E3C' }} />
                  <span className="text-sm font-semibold" style={{ color: '#2C1810' }}>ðŸ†• Ø¬Ø¯ÙŠØ¯</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded" style={{ accentColor: '#8B5E3C' }} />
                  <span className="text-sm font-semibold" style={{ color: '#2C1810' }}>âœ… Ù†Ø´Ø·</span>
                </label>
              </div>
            </>
          )}

          {/* MEDIA SECTION */}
          {activeSection === 'media' && (
            <>
              {/* Main Image */}
              <UploadZone
                label="ðŸ“¸ Ø§Ù„ØµÙˆØ±Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©"
                accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
                files={form.main_image ? [form.main_image] : []}
                onUpload={handleMainImageUpload}
                onRemove={() => setForm(prev => ({ ...prev, main_image: '' }))}
                uploading={uploadingMain}
                icon="ðŸ“¸"
                hint="JPEG, PNG, WebP - Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ 5 Ù…ÙŠØºØ§Ø¨Ø§ÙŠØª"
              />

              {/* Gallery */}
              <UploadZone
                label="ðŸ–¼ï¸ Ù…Ø¹Ø±Ø¶ Ø§Ù„ØµÙˆØ± (ÙŠÙ…ÙƒÙ†Ùƒ Ø±ÙØ¹ Ø¹Ø¯Ø© ØµÙˆØ±)"
                accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
                multiple
                files={safeJsonParse(form.landing_gallery, [])}
                onUpload={handleGalleryUpload}
                onRemove={removeGalleryImage}
                onReorder={reorderGallery}
                uploading={uploadingGallery}
                icon="ðŸ–¼ï¸"
                hint="Ø§Ø³Ø­Ø¨ Ø§Ù„ØµÙˆØ± Ù„Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„ØªØ±ØªÙŠØ¨ - ÙŠÙ…ÙƒÙ†Ùƒ Ø±ÙØ¹ Ø¹Ø¯Ø© ØµÙˆØ± Ù…Ø±Ø© ÙˆØ§Ø­Ø¯Ø©"
              />

              {/* Video */}
              <div>
                <label className="form-label">ðŸŽ¥ ÙÙŠØ¯ÙŠÙˆ Ø§Ù„Ù…Ù†ØªØ¬</label>
                {form.landing_video_url && (
                  <div className="mb-2 relative group">
                    <div className="rounded-xl overflow-hidden bg-[#F5EDE0] aspect-video max-w-xs" style={{ border: '2px solid #E8C9A0' }}>
                      {form.landing_video_url.includes('youtube') || form.landing_video_url.includes('vimeo') ? (
                        <iframe src={form.landing_video_url} className="w-full h-full" allowFullScreen />
                      ) : (
                        <video src={form.landing_video_url} className="w-full h-full object-cover" controls />
                      )}
                    </div>
                    <button type="button" onClick={() => setForm(prev => ({ ...prev, landing_video_url: '' }))} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transition">âœ•</button>
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
                    icon="ðŸŽ¥"
                    hint="MP4, WebM - Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ 50 Ù…ÙŠØºØ§Ø¨Ø§ÙŠØª"
                  />
                  <div className="relative">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t" style={{ borderColor: '#E8C9A0' }} />
                    <p className="relative text-center"><span className="bg-white px-3 text-[11px] font-semibold" style={{ color: '#A67B5B' }}>Ø£Ùˆ Ø£Ø¯Ø®Ù„ Ø±Ø§Ø¨Ø· YouTube/Vimeo</span></p>
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
                <label className="form-label">Ø¹Ù†ÙˆØ§Ù† ØµÙØ­Ø© Ø§Ù„Ù‡Ø¨ÙˆØ·</label>
                <input type="text" value={form.landing_title_ar} onChange={e => setForm(p => ({ ...p, landing_title_ar: e.target.value }))} className="form-input" />
              </div>
              <div>
                <label className="form-label">Ø§Ù„Ø¹Ù†ÙˆØ§Ù† Ø§Ù„ÙØ±Ø¹ÙŠ</label>
                <input type="text" value={form.landing_subtitle_ar} onChange={e => setForm(p => ({ ...p, landing_subtitle_ar: e.target.value }))} className="form-input" />
              </div>
              <div>
                <label className="form-label">Ù…Ù…ÙŠØ²Ø§Øª Ø§Ù„Ù…Ù†ØªØ¬ (ÙƒÙ„ Ø³Ø·Ø± = Ù…ÙŠØ²Ø©)</label>
                <textarea
                  value={(() => { try { return JSON.parse(form.landing_features_ar).join('\n'); } catch { return ''; } })()}
                  onChange={e => setForm(p => ({ ...p, landing_features_ar: JSON.stringify(e.target.value.split('\n').filter(Boolean)) }))}
                  className="form-input" rows={4} placeholder="Ù…ÙŠØ²Ø© 1&#10;Ù…ÙŠØ²Ø© 2&#10;Ù…ÙŠØ²Ø© 3"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Ù†Øµ Ø²Ø± Ø§Ù„Ø´Ø±Ø§Ø¡ (CTA)</label>
                  <input type="text" value={form.landing_cta_ar} onChange={e => setForm(p => ({ ...p, landing_cta_ar: e.target.value }))} className="form-input" placeholder="Ø§Ø·Ù„Ø¨ÙŠ Ø§Ù„Ø¢Ù†!" />
                </div>
                <div>
                  <label className="form-label">Ø´Ø§Ø±Ø© Ø§Ù„Ø¹Ø±Ø¶</label>
                  <input type="text" value={form.landing_offer_badge_ar} onChange={e => setForm(p => ({ ...p, landing_offer_badge_ar: e.target.value }))} className="form-input" placeholder="Ø®ØµÙ… 50% Ù„ÙØªØ±Ø© Ù…Ø­Ø¯ÙˆØ¯Ø©!" />
                </div>
              </div>

              {/* Detail Images Upload in Landing Tab */}
              <UploadZone
                label="ðŸ“¸ ØµÙˆØ± ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ù…Ù†ØªØ¬"
                accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
                multiple
                files={safeJsonParse(form.landing_detail_images, [])}
                onUpload={handleDetailUpload}
                onRemove={removeDetailImage}
                onReorder={reorderDetailImages}
                uploading={uploadingDetail}
                icon="ðŸ“¸"
                hint="Ø£Ø¶ÙŠÙÙŠ ØµÙˆØ± Ø§Ù„ØªÙØ§ØµÙŠÙ„ ÙˆØ§Ù„Ù…Ù…ÙŠØ²Ø§Øª â€” ØªØ¸Ù‡Ø± ÙÙŠ ØµÙØ­Ø© Ø§Ù„Ù‡Ø¨ÙˆØ·"
              />

              {/* Special Offers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label !mb-0">ðŸ·ï¸ Ø§Ù„Ø¹Ø±ÙˆØ¶ Ø§Ù„Ø®Ø§ØµØ© ({offers.length})</label>
                  <button type="button" onClick={addOffer} className="text-xs font-bold px-3 py-1.5 rounded-lg transition" style={{ backgroundColor: '#FDF8F0', color: '#8B5E3C' }}>+ Ø¥Ø¶Ø§ÙØ© Ø¹Ø±Ø¶</button>
                </div>
                <div className="space-y-2">
                  {offers.map((o, i) => (
                    <div key={i} className="p-3 rounded-xl relative" style={{ backgroundColor: o.active ? '#FDF8F0' : '#F9F5F0', border: `1px solid ${o.active ? '#C9A94E' : '#F5EDE0'}`, opacity: o.active ? 1 : 0.7 }}>
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <button type="button" onClick={() => updateOffer(i, 'active', !o.active)} className={`w-8 h-4.5 rounded-full relative transition-colors ${o.active ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all ${o.active ? 'left-[calc(100%-16px)]' : 'left-0.5'}`} />
                        </button>
                        <button type="button" onClick={() => removeOffer(i)} className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs hover:bg-red-200 transition">âœ•</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 mt-1">
                        <input type="text" placeholder="Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø¹Ø±Ø¶ (Ù…Ø«Ù„Ø§Ù‹: Ø¹Ø±Ø¶ Ø§Ù„ØµÙŠÙ)" value={o.title} onChange={e => updateOffer(i, 'title', e.target.value)} className="form-input !py-1.5 text-xs" />
                        <input type="text" placeholder="Ù†Ø³Ø¨Ø© Ø§Ù„Ø®ØµÙ… (Ù…Ø«Ù„Ø§Ù‹: -50% Ø£Ùˆ Ø®ØµÙ… 100 Ø¯.Ù…)" value={o.discount} onChange={e => updateOffer(i, 'discount', e.target.value)} className="form-input !py-1.5 text-xs" />
                      </div>
                      <textarea placeholder="ÙˆØµÙ Ø§Ù„Ø¹Ø±Ø¶ (Ù…Ø«Ù„Ø§Ù‹: Ø§Ø­ØµÙ„ÙŠ Ø¹Ù„Ù‰ Ø®ØµÙ… Ø­ØµØ±ÙŠ Ø¹Ù†Ø¯ Ø§Ù„Ø·Ù„Ø¨ Ø§Ù„ÙŠÙˆÙ…)" value={o.description} onChange={e => updateOffer(i, 'description', e.target.value)} className="form-input !py-1.5 text-xs" rows={2} />
                    </div>
                  ))}
                  {offers.length === 0 && <p className="text-center text-xs py-4" style={{ color: '#A67B5B' }}>Ù„Ù… ÙŠØªÙ… Ø¥Ø¶Ø§ÙØ© Ø¹Ø±ÙˆØ¶ Ø¨Ø¹Ø¯ â€” Ø£Ø¶ÙŠÙÙŠ Ø¹Ø±ÙˆØ¶ Ø®Ø§ØµØ© ØªØ¸Ù‡Ø± ÙÙŠ ØµÙØ­Ø© Ø§Ù„Ù‡Ø¨ÙˆØ·</p>}
                </div>
              </div>

              {/* Countdown Timer Controls */}
              {(() => {
                const ls = safeJsonParse(form.landing_settings, {} as Record<string, unknown>);
                const updateLS = (key: string, value: unknown) => {
                  const updated = { ...safeJsonParse(form.landing_settings, {} as Record<string, unknown>), [key]: value };
                  setForm(prev => ({ ...prev, landing_settings: JSON.stringify(updated) }));
                };
                return (
                  <>
                    <div className="p-3 rounded-xl" style={{ backgroundColor: '#FDF8F0', border: '1px solid #F5EDE0' }}>
                      <div className="flex items-center justify-between mb-3">
                        <label className="form-label !mb-0">â° Ø§Ù„Ø¹Ø¯ Ø§Ù„ØªÙ†Ø§Ø²Ù„ÙŠ</label>
                        <button type="button" onClick={() => updateLS('countdown_enabled', !(ls.countdown_enabled !== false))} className={`w-10 h-5.5 rounded-full relative transition-colors ${ls.countdown_enabled !== false ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-all ${ls.countdown_enabled !== false ? 'left-[calc(100%-20px)]' : 'left-0.5'}`} />
                        </button>
                      </div>
                      {ls.countdown_enabled !== false && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-semibold block mb-1" style={{ color: '#A67B5B' }}>Ø§Ù„Ø³Ø§Ø¹Ø§Øª</label>
                            <input type="number" min={0} max={99} value={(ls.countdown_hours as number) ?? 2} onChange={e => updateLS('countdown_hours', Math.max(0, parseInt(e.target.value) || 0))} className="form-input !py-1.5 text-xs text-center" dir="ltr" />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold block mb-1" style={{ color: '#A67B5B' }}>Ø§Ù„Ø¯Ù‚Ø§Ø¦Ù‚</label>
                            <input type="number" min={0} max={59} value={(ls.countdown_minutes as number) ?? 45} onChange={e => updateLS('countdown_minutes', Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))} className="form-input !py-1.5 text-xs text-center" dir="ltr" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Social Proof Toast Controls */}
                    <div className="p-3 rounded-xl" style={{ backgroundColor: '#FDF8F0', border: '1px solid #F5EDE0' }}>
                      <div className="flex items-center justify-between mb-3">
                        <label className="form-label !mb-0">ðŸ”” Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ø´Ø±Ø§Ø¡ Ø§Ù„Ø­ÙŠØ©</label>
                        <button type="button" onClick={() => updateLS('toast_enabled', !(ls.toast_enabled !== false))} className={`w-10 h-5.5 rounded-full relative transition-colors ${ls.toast_enabled !== false ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-all ${ls.toast_enabled !== false ? 'left-[calc(100%-20px)]' : 'left-0.5'}`} />
                        </button>
                      </div>
                      {ls.toast_enabled !== false && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-semibold" style={{ color: '#A67B5B' }}>Ø£Ø³Ù…Ø§Ø¡ Ø§Ù„Ù…Ø´ØªØ±ÙŠØ§Øª ({((ls.proof_names as string[]) || []).length})</label>
                            <button type="button" onClick={() => updateLS('proof_names', [...((ls.proof_names as string[]) || []), ''])} className="text-[10px] font-bold px-2 py-1 rounded-lg transition" style={{ backgroundColor: '#FFF', color: '#8B5E3C' }}>+ Ø¥Ø¶Ø§ÙØ© Ø§Ø³Ù…</button>
                          </div>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {((ls.proof_names as string[]) || []).map((name: string, i: number) => (
                              <div key={i} className="flex items-center gap-1.5">
                                <input type="text" value={name} placeholder="Ø§Ø³Ù… Ø§Ù„Ù…Ø´ØªØ±ÙŠØ©..." onChange={e => { const names = [...((ls.proof_names as string[]) || [])]; names[i] = e.target.value; updateLS('proof_names', names); }} className="form-input !py-1 text-xs flex-1" />
                                <button type="button" onClick={() => { const names = ((ls.proof_names as string[]) || []).filter((_: string, idx: number) => idx !== i); updateLS('proof_names', names); }} className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs hover:bg-red-200 transition flex-shrink-0">âœ•</button>
                              </div>
                            ))}
                          </div>
                          {((ls.proof_names as string[]) || []).length === 0 && <p className="text-center text-[10px] py-2" style={{ color: '#A67B5B' }}>Ø³ÙŠØªÙ… Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ø£Ø³Ù…Ø§Ø¡ Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠØ© â€” Ø£Ø¶ÙŠÙÙŠ Ø£Ø³Ù…Ø§Ø¡ Ù…Ø®ØµØµØ©</p>}
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
                  <label className="form-label !mb-0">â­ Ø¢Ø±Ø§Ø¡ Ø§Ù„Ø²Ø¨ÙˆÙ†Ø§Øª ({testimonials.length})</label>
                  <button type="button" onClick={addTestimonial} className="text-xs font-bold px-3 py-1.5 rounded-lg transition" style={{ backgroundColor: '#FDF8F0', color: '#8B5E3C' }}>+ Ø¥Ø¶Ø§ÙØ© Ø±Ø£ÙŠ</button>
                </div>
                <div className="space-y-2">
                  {testimonials.map((t, i) => (
                    <div key={i} className="p-3 rounded-xl relative" style={{ backgroundColor: '#FDF8F0', border: '1px solid #F5EDE0' }}>
                      <button type="button" onClick={() => removeTestimonial(i)} className="absolute top-2 left-2 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs hover:bg-red-200 transition">âœ•</button>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                        <input type="text" placeholder="Ø§Ù„Ø§Ø³Ù…" value={t.name} onChange={e => updateTestimonial(i, 'name', e.target.value)} className="form-input !py-1.5 text-xs" />
                        <input type="text" placeholder="Ø§Ù„Ù…Ø¯ÙŠÙ†Ø©" value={t.city} onChange={e => updateTestimonial(i, 'city', e.target.value)} className="form-input !py-1.5 text-xs" />
                        <select value={t.rating} onChange={e => updateTestimonial(i, 'rating', Number(e.target.value))} className="form-input !py-1.5 text-xs">
                          {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} â­</option>)}
                        </select>
                      </div>
                      <textarea placeholder="Ù†Øµ Ø§Ù„Ø±Ø£ÙŠ..." value={t.text} onChange={e => updateTestimonial(i, 'text', e.target.value)} className="form-input !py-1.5 text-xs" rows={2} />
                    </div>
                  ))}
                  {testimonials.length === 0 && <p className="text-center text-xs py-4" style={{ color: '#A67B5B' }}>Ù„Ù… ÙŠØªÙ… Ø¥Ø¶Ø§ÙØ© Ø¢Ø±Ø§Ø¡ Ø¨Ø¹Ø¯</p>}
                </div>
              </div>

              {/* FAQs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label !mb-0">â“ Ø§Ù„Ø£Ø³Ø¦Ù„Ø© Ø§Ù„Ø´Ø§Ø¦Ø¹Ø© ({faqs.length})</label>
                  <button type="button" onClick={addFaq} className="text-xs font-bold px-3 py-1.5 rounded-lg transition" style={{ backgroundColor: '#FDF8F0', color: '#8B5E3C' }}>+ Ø¥Ø¶Ø§ÙØ© Ø³Ø¤Ø§Ù„</button>
                </div>
                <div className="space-y-2">
                  {faqs.map((f, i) => (
                    <div key={i} className="p-3 rounded-xl relative" style={{ backgroundColor: '#FDF8F0', border: '1px solid #F5EDE0' }}>
                      <button type="button" onClick={() => removeFaq(i)} className="absolute top-2 left-2 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs hover:bg-red-200 transition">âœ•</button>
                      <input type="text" placeholder="Ø§Ù„Ø³Ø¤Ø§Ù„" value={f.question} onChange={e => updateFaq(i, 'question', e.target.value)} className="form-input !py-1.5 text-xs mb-2" />
                      <textarea placeholder="Ø§Ù„Ø¬ÙˆØ§Ø¨" value={f.answer} onChange={e => updateFaq(i, 'answer', e.target.value)} className="form-input !py-1.5 text-xs" rows={2} />
                    </div>
                  ))}
                  {faqs.length === 0 && <p className="text-center text-xs py-4" style={{ color: '#A67B5B' }}>Ù„Ù… ÙŠØªÙ… Ø¥Ø¶Ø§ÙØ© Ø£Ø³Ø¦Ù„Ø© Ø¨Ø¹Ø¯</p>}
                </div>
              </div>

              {/* Extra Sections */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label !mb-0">ðŸ“„ Ø£Ù‚Ø³Ø§Ù… Ø¥Ø¶Ø§ÙÙŠØ© ({extraSections.length})</label>
                  <button type="button" onClick={addExtraSection} className="text-xs font-bold px-3 py-1.5 rounded-lg transition" style={{ backgroundColor: '#FDF8F0', color: '#8B5E3C' }}>+ Ø¥Ø¶Ø§ÙØ© Ù‚Ø³Ù…</button>
                </div>
                <div className="space-y-2">
                  {extraSections.map((sec, i) => (
                    <div key={i} className="p-3 rounded-xl relative" style={{ backgroundColor: '#FDF8F0', border: '1px solid #F5EDE0' }}>
                      <button type="button" onClick={() => removeExtraSection(i)} className="absolute top-2 left-2 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs hover:bg-red-200 transition">âœ•</button>
                      <input type="text" placeholder="Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ù‚Ø³Ù…" value={sec.title} onChange={e => updateExtraSection(i, 'title', e.target.value)} className="form-input !py-1.5 text-xs mb-2" />
                      <textarea placeholder="Ø§Ù„Ù…Ø­ØªÙˆÙ‰" value={sec.content} onChange={e => updateExtraSection(i, 'content', e.target.value)} className="form-input !py-1.5 text-xs mb-2" rows={3} />
                      <div className="flex items-center gap-2">
                        {sec.image && <div className="w-12 h-12 rounded-lg overflow-hidden bg-white"><img src={sec.image} alt="" className="w-full h-full object-cover" /></div>}
                        <label className="text-[11px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition hover:opacity-80" style={{ backgroundColor: '#E8C9A0', color: '#4A3228' }}>
                          ðŸ“¸ {sec.image ? 'ØªØºÙŠÙŠØ± Ø§Ù„ØµÙˆØ±Ø©' : 'Ø¥Ø¶Ø§ÙØ© ØµÙˆØ±Ø©'}
                          <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.length) uploadExtraSectionImage(i, e.target.files); }} />
                        </label>
                        {sec.image && <button type="button" onClick={() => updateExtraSection(i, 'image', '')} className="text-[11px] text-red-500 font-semibold">Ø­Ø°Ù Ø§Ù„ØµÙˆØ±Ø©</button>}
                      </div>
                    </div>
                  ))}
                  {extraSections.length === 0 && <p className="text-center text-xs py-4" style={{ color: '#A67B5B' }}>Ù„Ù… ÙŠØªÙ… Ø¥Ø¶Ø§ÙØ© Ø£Ù‚Ø³Ø§Ù… Ø¨Ø¹Ø¯</p>}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t p-4 flex-shrink-0 flex items-center gap-3" style={{ borderColor: '#F5EDE0' }}>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition hover:bg-[#F5EDE0]" style={{ color: '#4A3228' }}>Ø¥Ù„ØºØ§Ø¡</button>
          <button onClick={() => onSave(form)} className="btn-moroccan flex-1 py-2.5 rounded-xl text-sm">
            {product ? 'ðŸ’¾ Ø­ÙØ¸ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„Ø§Øª' : 'âž• Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ù…Ù†ØªØ¬'}
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
        <h3 className="font-bold mb-4" style={{ color: '#2C1810' }}>âž• Ø¥Ø¶Ø§ÙØ© ÙØ¦Ø© Ø¬Ø¯ÙŠØ¯Ø©</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Ø§Ù„Ø§Ø³Ù… Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©"
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
          <button onClick={addCategory} className="btn-moroccan rounded-lg text-sm">âž• Ø¥Ø¶Ø§ÙØ©</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-bold mb-4" style={{ color: '#2C1810' }}>ðŸ“ Ø§Ù„ÙØ¦Ø§Øª Ø§Ù„Ø­Ø§Ù„ÙŠØ©</h3>
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#FDF8F0' }}>
              <div>
                <span className="font-bold" style={{ color: '#2C1810' }}>{cat.name_ar}</span>
                <span className="text-xs mr-2" style={{ color: '#8B5E3C' }}>({cat.name})</span>
              </div>
              <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: cat.is_active ? '#DCFCE7' : '#FEE2E2', color: cat.is_active ? '#166534' : '#991B1B' }}>
                {cat.is_active ? 'Ù†Ø´Ø·' : 'Ù…Ø¹Ø·Ù„'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
