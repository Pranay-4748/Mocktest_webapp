import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GuestEntry() {
  const navigate = useNavigate();
  const [form, setForm]   = useState({ name: '', email: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return setError('Both fields are required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Enter a valid email address');
    setLoading(true);
    sessionStorage.setItem('guestUser', JSON.stringify({ name: form.name.trim(), email: form.email.trim().toLowerCase() }));
    setTimeout(() => navigate('/guest/tests'), 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative animate-fade-in">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-indigo-500/40">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">TestSeries</h1>
          <p className="text-indigo-300 text-sm mt-2">Online Mock Test Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-1">Get Started</h2>
          <p className="text-indigo-200 text-sm mb-6">Enter your details to access available tests</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-indigo-200 uppercase tracking-wide mb-1.5">Full Name</label>
              <input
                type="text" placeholder="e.g. Rahul Sharma" value={form.name}
                onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setError(''); }}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300/60 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-indigo-200 uppercase tracking-wide mb-1.5">Email Address</label>
              <input
                type="email" placeholder="you@example.com" value={form.email}
                onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setError(''); }}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300/60 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-300 bg-red-500/20 border border-red-500/30 px-3 py-2.5 rounded-xl animate-fade-in">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 text-white py-3 rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-500/30 mt-2">
              {loading ? 'Loading…' : 'View Available Tests →'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-indigo-400/60 mt-6">
          No account needed · Results saved per session
        </p>
      </div>
    </div>
  );
}
