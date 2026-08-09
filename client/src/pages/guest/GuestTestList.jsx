import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';

function Chip({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-full">
      {icon} {label}
    </span>
  );
}

export default function GuestTestList() {
  const navigate = useNavigate();
  const [tests, setTests]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [search, setSearch] = useState('');

  const user = useMemo(() => JSON.parse(sessionStorage.getItem('guestUser') || 'null'), []);

  useEffect(() => {
    if (!user) { navigate('/guest', { replace: true }); return; }
    api.get('/guest/tests')
      .then(({ data }) => setTests(data.tests))
      .catch(() => setError('Failed to load tests'))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const filtered = useMemo(() =>
    tests.filter((t) => t.title.toLowerCase().includes(search.toLowerCase())),
    [tests, search]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Navbar */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-sm">TestSeries</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{user?.name}</span>
            </div>
            <button
              onClick={() => { sessionStorage.removeItem('guestUser'); navigate('/guest'); }}
              className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition font-medium"
            >
              Exit
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Available Tests</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {filtered.length} test{filtered.length !== 1 ? 's' : ''} available
            </p>
          </div>
          <div className="relative sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search tests…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9" />
          </div>
        </div>

        {loading ? (
          <div className="py-32"><Spinner /></div>
        ) : error ? (
          <div className="py-20 text-center text-red-500 dark:text-red-400">{error}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="📋" title="No tests found" description="Try a different search term." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((test, i) => (
              <div key={test._id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-700 transition-all duration-200 flex flex-col animate-fade-in group"
                style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-3 shadow group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-snug">{test.title}</h3>
                  {test.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">{test.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    <Chip icon="⏱" label={`${test.duration} min`} />
                    <Chip icon="❓" label={`${test.questionCount ?? 0} Qs`} />
                    <Chip icon="🏆" label={`${test.totalMarks} marks`} />
                    <Chip icon="✅" label={`Pass: ${test.passingMarks}`} />
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/guest/tests/${test._id}/instructions`)}
                  className="mt-5 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold transition shadow-sm hover:shadow-indigo-500/25"
                >
                  Start Test →
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
