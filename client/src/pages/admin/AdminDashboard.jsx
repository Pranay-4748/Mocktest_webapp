import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Spinner from '../../components/common/Spinner';

function StatCard({ label, value, sub, icon, gradient, delay = 0 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (typeof value !== 'number') return;
    let start = 0;
    const end = value;
    if (end === 0) return;
    const step = Math.ceil(end / 30);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(start);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div
      className="card p-5 hover:shadow-md transition-all duration-300 animate-fade-in group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1.5">
            {typeof value === 'number' ? display : value}
          </p>
          {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-2xl ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ to, label, icon, color }) {
  return (
    <Link to={to}
      className={`flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition group`}>
      <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">{label}</span>
      <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 ml-auto group-hover:text-indigo-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

const STATUS_BADGE = {
  published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  draft:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  archived:  'bg-gray-100  text-gray-600  dark:bg-gray-800     dark:text-gray-400',
};

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null);
  const [tests, setTests]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [testsRes, questionsRes] = await Promise.all([
          api.get('/admin/tests', { params: { limit: 100 } }),
          api.get('/admin/questions/by-subject'),
        ]);
        const allTests = testsRes.data.tests;
        const totalQuestions = (questionsRes.data.groups || []).reduce((s, g) => s + g.total, 0);
        setStats({
          total:     allTests.length,
          published: allTests.filter((t) => t.status === 'published').length,
          draft:     allTests.filter((t) => t.status === 'draft').length,
          questions: totalQuestions,
        });
        setTests(allTests.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="py-32"><Spinner /></div>;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tests"     value={stats.total}     delay={0}
          gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
          icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        <StatCard label="Published"       value={stats.published} delay={80}  sub="Live & active"
          gradient="bg-gradient-to-br from-green-500 to-emerald-600"
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        <StatCard label="Drafts"          value={stats.draft}     delay={160} sub="Unpublished"
          gradient="bg-gradient-to-br from-amber-400 to-orange-500"
          icon="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        <StatCard label="Total Questions" value={stats.questions} delay={240}
          gradient="bg-gradient-to-br from-purple-500 to-violet-600"
          icon="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent tests */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Recent Tests</h3>
            <Link to="/admin/tests" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
              View all →
            </Link>
          </div>
          {tests.length === 0 ? (
            <div className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm">No tests yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th>Title</th>
                  <th>Questions</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((t) => (
                  <tr key={t._id} className="table-row">
                    <td className="table-cell">
                      <p className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px]">{t.title}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{t.duration} min · {t.totalMarks} marks</p>
                    </td>
                    <td className="table-cell text-gray-500 dark:text-gray-400">{t.questionCount ?? 0}</td>
                    <td className="table-cell">
                      <span className={`badge capitalize ${STATUS_BADGE[t.status]}`}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick actions */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <QuickAction to="/admin/tests"            label="Manage Tests"    color="bg-indigo-500"
              icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            <QuickAction to="/admin/questions"         label="Question Bank"   color="bg-purple-500"
              icon="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <QuickAction to="/admin/analytics"        label="View Analytics"  color="bg-blue-500"
              icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            <QuickAction to="/admin/users"            label="Manage Users"    color="bg-green-500"
              icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </div>
        </div>
      </div>
    </div>
  );
}
