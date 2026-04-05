'use client';

import { useState } from 'react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_user', data.username);
        window.location.href = '/admin/dashboard';
      } else {
        setError(data.error || 'خطأ في الدخول');
      }
    } catch {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #2C1810, #6B4226, #8B5E3C)', direction: 'rtl' }}>
      <div className="absolute inset-0 moroccan-pattern opacity-5"></div>
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8B5E3C, #C9A94E)' }}>
            <span className="text-white font-bold text-2xl">F</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#2C1810' }}>لوحة التحكم</h1>
          <p className="text-sm mt-1" style={{ color: '#4A3228' }}>FAM.MA - إدارة المتجر</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1.5" style={{ color: '#2C1810' }}>اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl"
              style={{ border: '2px solid #E8C9A0', color: '#2C1810' }}
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1.5" style={{ color: '#2C1810' }}>كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl"
              style={{ border: '2px solid #E8C9A0', color: '#2C1810' }}
              placeholder="••••••"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl text-sm text-center font-semibold" style={{ backgroundColor: '#FEE2E2', color: '#C41E3A' }}>{error}</div>
          )}

          <button type="submit" disabled={loading} className="btn-moroccan w-full py-3.5 text-lg rounded-xl disabled:opacity-50">
            {loading ? 'جاري الدخول...' : 'دخول ✦'}
          </button>
        </form>
      </div>
    </div>
  );
}
