import React, { useState } from 'react';
import { ShieldCheck, Lock, User, AlertCircle, Eye, EyeOff, X } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Invalid admin credentials. Please verify username and password.');
      }
    } catch {
      setError('Unable to verify credentials with server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-stone-900 text-stone-100 p-6 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Bora Staff Access</h2>
              <p className="text-xs text-stone-400">Restricted to Store Owner & Manager</p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="admin-login-close-btn"
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Admin Username
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin name"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                id="admin-login-username"
              />
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Admin Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-10 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                id="admin-login-password"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-stone-400 hover:text-stone-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              id="admin-login-submit-btn"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-950 font-bold py-2.5 rounded-xl text-sm transition-all shadow-md active:scale-98"
            >
              {loading ? 'Verifying Credentials...' : 'Sign In to Management'}
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-stone-500 hover:text-stone-800"
            >
              Return to Public Storefront
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
