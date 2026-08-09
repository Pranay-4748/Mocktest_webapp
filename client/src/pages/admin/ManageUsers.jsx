import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';

export default function ManageUsers() {
  const [attempts, setAttempts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  const fetch = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      const { data } = await api.get('/admin/attempts', { params });
      setAttempts(data.attempts ?? []);
      setPagination(data.pagination ?? { total: 0, page: 1, pages: 1 });
    } catch {
      setAttempts([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetch(1); }, [fetch]);

  return (
    <div className="space-y-5 max-w-6xl animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Users & Attempts</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{pagination.total} total attempts</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="Search by name or email…" value={search}
          onChange={(e) => setSearch(e.target.value)} className="input pl-9" />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-24"><Spinner /></div>
        ) : attempts.length === 0 ? (
          <EmptyState icon="👥" title="No attempts yet"
            description="User attempts will appear here once students take tests." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="table-header">
                {['User', 'Test', 'Score', 'Result', 'Time Taken', 'Date'].map((h) => <th key={h}>{h}</th>)}
              </tr></thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a._id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {a.userName?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{a.userName}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{a.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-gray-600 dark:text-gray-400 max-w-[160px]">
                      <p className="truncate">{a.testId?.title ?? '—'}</p>
                    </td>
                    <td className="table-cell">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{a.score}</span>
                      <span className="text-gray-400 dark:text-gray-500 text-xs"> / {a.testId?.totalMarks ?? '?'}</span>
                      <span className="ml-1.5 text-xs text-gray-500 dark:text-gray-400">({a.percentage}%)</span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${a.passed ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {a.passed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500 dark:text-gray-400">
                      {Math.floor(a.timeTaken / 60)}m {a.timeTaken % 60}s
                    </td>
                    <td className="table-cell text-gray-400 dark:text-gray-500 text-xs">
                      {new Date(a.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination {...pagination} limit={15} onPage={fetch} />
    </div>
  );
}
