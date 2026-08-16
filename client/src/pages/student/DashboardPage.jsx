import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';

const PAGE_SIZE = 5;

export default function DashboardPage() {
  const { user } = useAuth();
  const { dark } = useDarkMode();
  const [attempts, setAttempts] = useState([]);
  const [tests, setTests]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('attempts');
  const [attPage, setAttPage]   = useState(1);
  const [testPage, setTestPage] = useState(1);

  useEffect(() => {
    Promise.all([api.get('/results/my'), api.get('/tests')])
      .then(([r, t]) => { setAttempts(r.data.attempts); setTests(t.data.tests); })
      .finally(() => setLoading(false));
  }, []);

  const passed   = attempts.filter((a) => a.passed).length;
  const avg      = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length) : 0;
  // accuracy = correct answers / total questions across all attempts
  const accuracy = attempts.length
    ? Math.round(attempts.reduce((s, a) => s + (a.correctCount ?? a.score ?? 0), 0) /
        attempts.reduce((s, a) => s + (a.totalQuestions ?? a.testId?.questionCount ?? 1), 0) * 100)
    : 0;

  // best attempt per test for retest info
  const bestMap = {};
  for (const a of attempts) {
    const tid = String(a.testId?._id);
    if (!bestMap[tid] || a.percentage > bestMap[tid].percentage) bestMap[tid] = a;
  }

  // group attempts by test — one row per test, sorted by latest
  const groupedAttempts = Object.values(
    attempts.reduce((acc, a) => {
      const tid = String(a.testId?._id);
      if (!acc[tid]) acc[tid] = { testId: a.testId, attempts: [] };
      acc[tid].attempts.push(a);
      return acc;
    }, {})
  ).sort((a, b) => new Date(b.attempts[0].submittedAt) - new Date(a.attempts[0].submittedAt));

  const attPages      = Math.ceil(groupedAttempts.length / PAGE_SIZE);
  const pagedAttempts = groupedAttempts.slice((attPage - 1) * PAGE_SIZE, attPage * PAGE_SIZE);

  const testPages  = Math.ceil(tests.length / PAGE_SIZE);
  const pagedTests = tests.slice((testPage - 1) * PAGE_SIZE, testPage * PAGE_SIZE);

  // theme helpers
  const page    = dark ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900' : 'bg-gray-100';
  const card    = dark ? 'bg-white/10 backdrop-blur-xl border border-white/15' : 'bg-white border border-gray-100 shadow-sm';
  const title   = dark ? 'text-white' : 'text-gray-900';
  const sub     = dark ? 'text-indigo-300/70' : 'text-gray-500';
  const statVal = dark ? 'text-white' : 'text-indigo-600';
  const row     = dark ? 'bg-white/10 backdrop-blur-xl border border-white/15 hover:bg-white/15' : 'bg-white border border-gray-100 shadow-sm hover:shadow-md';
  const rowTitle = dark ? 'text-white' : 'text-gray-800';
  const rowSub  = dark ? 'text-indigo-300/60' : 'text-gray-400';
  const pct     = dark ? 'text-indigo-300' : 'text-indigo-600';
  const tabBar  = dark ? 'bg-white/8 border border-white/10' : 'bg-gray-100 border border-gray-200';
  const tabInactive = dark ? 'text-indigo-300/70 hover:text-indigo-200' : 'text-gray-500 hover:text-gray-700';
  const metaText = dark ? 'text-indigo-300/60' : 'text-gray-400';
  const emptyCard = dark ? 'bg-white/10 backdrop-blur-xl border border-white/15' : 'bg-white border border-gray-100 shadow-sm';

  return (
    <div className={`min-h-screen transition-colors ${page}`}>
      {dark && <>
        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      </>}

      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8 relative">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className={`text-2xl font-bold ${title}`}>Welcome, {user?.name} 👋</h1>
          <p className={`text-sm mt-1 ${sub}`}>Here's your performance overview</p>
        </div>

        {/* Stats — 4 cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Tests Attempted', value: attempts.length, icon: '📋' },
            { label: 'Passed',       value: passed,          icon: '✅' },
            { label: 'Avg Score',    value: `${avg}%`,       icon: '🎯' },
            { label: 'Accuracy',     value: `${accuracy}%`,  icon: '🎯' },
          ].map(({ label, value, icon }) => (
            <div key={label} className={`${card} rounded-2xl p-5 text-center`}>
              <p className="text-2xl mb-1">{icon}</p>
              <p className={`text-3xl font-bold ${statVal}`}>{value}</p>
              <p className={`text-sm mt-1 ${sub}`}>{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 rounded-xl p-1 mb-5 w-fit ${tabBar}`}>
          {[
            { key: 'attempts', label: 'Recent Attempts' },
            { key: 'tests',    label: `Available Tests${tests.length ? ` (${tests.length})` : ''}` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-1.5 text-sm rounded-lg font-medium transition cursor-pointer ${
                tab === key ? 'bg-indigo-600 text-white shadow-sm' : tabInactive
              }`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center mt-16"><Spinner /></div>

        ) : tab === 'attempts' ? (
          attempts.length === 0 ? (
            <div className={`${emptyCard} rounded-2xl p-8 text-center`}>
              <p className={`text-lg mb-3 ${title}`}>No attempts yet</p>
              <button onClick={() => setTab('tests')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2 rounded-xl text-sm font-semibold transition cursor-pointer">
                Browse Tests
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {pagedAttempts.map(({ testId: t, attempts: tas }) => {
                  const best   = tas.reduce((b, a) => a.percentage > b.percentage ? a : b, tas[0]);
                  const latest = tas[0];
                  const allPassed = tas.some((a) => a.passed);
                  return (
                    <Link key={String(t?._id)} to={`/results/${latest._id}`}
                      className={`flex items-center justify-between ${row} rounded-2xl px-5 py-4 transition cursor-pointer`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${rowTitle}`}>{t?.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            dark ? 'bg-white/10 text-indigo-300' : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                          }`}>
                            {tas.length} attempt{tas.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className={`text-xs mt-0.5 ${rowSub}`}>
                          Last: {new Date(latest.submittedAt).toLocaleDateString()}
                          {tas.length > 1 && ` · Best: ${best.percentage}%`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${pct}`}>{latest.percentage}%</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          allPassed
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {allPassed ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <Pagination page={attPage} pages={attPages} total={groupedAttempts.length} limit={PAGE_SIZE} onPage={setAttPage} />
            </>
          )

        ) : (
          tests.length === 0 ? (
            <p className={`text-center mt-10 ${sub}`}>No published tests available yet.</p>
          ) : (
            <>
              <div className="space-y-3">
                {pagedTests.map((test) => {
                  const best = bestMap[String(test._id)];
                  return (
                    <div key={test._id} className={`flex items-center justify-between ${card} rounded-2xl px-5 py-4`}>
                      <div>
                        <p className={`font-medium ${rowTitle}`}>{test.title}</p>
                        <div className={`flex flex-wrap gap-4 mt-1 text-xs ${metaText}`}>
                          <span>⏱ {test.duration} min</span>
                          <span>📝 {test.questionCount} questions</span>
                          <span>🎯 Pass: {test.passingMarks}/{test.totalMarks}</span>
                          {best && <span className="text-indigo-400 font-medium">🏆 Best: {best.percentage}%</span>}
                        </div>
                      </div>
                      <Link to={`/tests/${test._id}`}
                        className={`text-sm px-4 py-2 rounded-xl font-medium transition shrink-0 cursor-pointer ${
                          best
                            ? dark
                              ? 'bg-white/10 border border-indigo-400/40 text-indigo-300 hover:bg-white/15'
                              : 'bg-indigo-50 border border-indigo-300 text-indigo-700 hover:bg-indigo-100'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-500/20'
                        }`}>
                        {best ? '🔁 Retest' : 'Start'}
                      </Link>
                    </div>
                  );
                })}
              </div>
              <Pagination page={testPage} pages={testPages} total={tests.length} limit={PAGE_SIZE} onPage={setTestPage} />
            </>
          )
        )}
      </div>
    </div>
  );
}
