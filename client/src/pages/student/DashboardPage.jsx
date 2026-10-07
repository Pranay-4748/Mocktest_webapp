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

  // Group practice attempts by topic for Mastery Analytics
  const topicMastery = Object.values(
    attempts.reduce((acc, a) => {
      if (!a.practiceTopic) return acc;
      const t = a.practiceTopic.trim().toLowerCase();
      // Capitalize first letter of topic for display
      const displayTopic = t.charAt(0).toUpperCase() + t.slice(1);
      
      if (!acc[t]) acc[t] = { topic: displayTopic, sumPercentage: 0, count: 0, difficulties: {} };
      
      acc[t].sumPercentage += a.percentage || 0;
      acc[t].count += 1;
      
      const diff = a.practiceDifficulty || 'mixed';
      if (!acc[t].difficulties[diff]) acc[t].difficulties[diff] = { sum: 0, count: 0 };
      acc[t].difficulties[diff].sum += a.percentage || 0;
      acc[t].difficulties[diff].count += 1;
      
      return acc;
    }, {})
  ).map(item => ({
    ...item,
    masteryPercentage: Math.round(item.sumPercentage / item.count) || 0,
  })).sort((a, b) => b.masteryPercentage - a.masteryPercentage);

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

        {/* Tabs and Practice Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className={`flex gap-1 rounded-xl p-1 w-fit ${tabBar}`}>
            {[
              { key: 'attempts', label: 'Recent Attempts' },
              { key: 'tests',    label: `Available Tests${tests.length ? ` (${tests.length})` : ''}` },
              { key: 'mastery',  label: 'Topic Mastery 🏆' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`px-4 py-1.5 text-sm rounded-lg font-medium transition cursor-pointer ${
                  tab === key ? 'bg-indigo-600 text-white shadow-sm' : tabInactive
                }`}>
                {label}
              </button>
            ))}
          </div>

          <Link to="/practice" className="flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-md shadow-emerald-500/20 transition cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Topic Practice
          </Link>
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

        ) : tab === 'mastery' ? (
          topicMastery.length === 0 ? (
            <div className={`${emptyCard} rounded-2xl p-8 text-center`}>
              <p className={`text-lg mb-3 ${title}`}>No topic practice data yet</p>
              <p className={`text-sm mb-4 ${sub}`}>Take some Topic Practice tests to see your mastery levels here.</p>
              <Link to="/practice"
                className="inline-block bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-5 py-2 rounded-xl text-sm font-semibold transition cursor-pointer">
                Start Practice
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {topicMastery.map((tm, idx) => {
                const getLevel = (pct) => {
                  if (pct >= 80) return { label: 'Mastered', color: 'text-emerald-500', bg: 'bg-emerald-500' };
                  if (pct >= 50) return { label: 'Intermediate', color: 'text-amber-500', bg: 'bg-amber-500' };
                  return { label: 'Needs Work', color: 'text-red-500', bg: 'bg-red-500' };
                };
                const lvl = getLevel(tm.masteryPercentage);
                
                return (
                  <div key={idx} className={`${card} rounded-2xl p-5`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className={`font-bold text-lg ${title}`}>{tm.topic}</h3>
                        <p className={`text-xs ${sub}`}>{tm.count} attempt{tm.count !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xl font-bold ${lvl.color}`}>{tm.masteryPercentage}%</span>
                        <p className={`text-xs font-semibold ${lvl.color}`}>{lvl.label}</p>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className={`w-full h-2.5 rounded-full overflow-hidden mt-3 ${dark ? 'bg-white/10' : 'bg-gray-100'}`}>
                      <div className={`h-full transition-all duration-500 ${lvl.bg}`} style={{ width: `${tm.masteryPercentage}%` }} />
                    </div>

                    {/* Breakdown by difficulty */}
                    <div className="mt-4 flex gap-2 flex-wrap">
                      {Object.entries(tm.difficulties).map(([diff, stats]) => {
                        const pct = Math.round(stats.sum / stats.count);
                        return (
                          <div key={diff} className={`text-[10px] px-2 py-1 rounded-md border ${dark ? 'bg-white/5 border-white/10 text-indigo-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                            <span className="capitalize font-semibold">{diff}:</span> {pct}% ({stats.count})
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
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
