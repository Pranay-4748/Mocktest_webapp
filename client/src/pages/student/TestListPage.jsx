import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import { useDarkMode } from '../../context/DarkModeContext';

const PAGE_SIZE = 8;

export default function TestListPage() {
  const { dark } = useDarkMode();
  const [tests, setTests]         = useState([]);
  const [attemptMap, setAttemptMap] = useState({});
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);

  useEffect(() => {
    Promise.all([api.get('/tests'), api.get('/results/my').catch(() => ({ data: { attempts: [] } }))])
      .then(([{ data: testsData }, { data: resultsData }]) => {
        setTests(testsData.tests);
        const map = {};
        for (const a of resultsData.attempts) {
          const tid = String(a.testId?._id);
          if (!map[tid]) map[tid] = { count: 0, best: 0 };
          map[tid].count += 1;
          if (a.percentage > map[tid].best) map[tid].best = a.percentage;
        }
        setAttemptMap(map);
      })
      .finally(() => setLoading(false));
  }, []);

  const pages = Math.ceil(tests.length / PAGE_SIZE);
  const paged = tests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const bg       = dark ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900' : 'bg-gray-100';
  const card     = dark ? 'bg-white/10 backdrop-blur-xl border border-white/15 hover:bg-white/15' : 'bg-white border border-gray-100 shadow-sm hover:shadow-md';
  const title    = dark ? 'text-white' : 'text-gray-900';
  const sub      = dark ? 'text-indigo-300/70' : 'text-gray-500';
  const metaText = dark ? 'text-indigo-300/60' : 'text-gray-400';

  if (loading) return (
    <div className={`min-h-screen transition-colors ${bg}`}>
      <Navbar /><div className="flex justify-center mt-20"><Spinner /></div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors ${bg}`}>
      {dark && <>
        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      </>}
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 relative">
        <div className="mb-6 animate-fade-in">
          <h1 className={`text-2xl font-bold ${title}`}>Available Tests</h1>
          <p className={`text-sm mt-1 ${sub}`}>{tests.length} test{tests.length !== 1 ? 's' : ''} published</p>
        </div>

        {tests.length === 0 ? (
          <div className={`${card} rounded-2xl p-12 text-center`}>
            <p className={`text-lg ${sub}`}>No published tests available yet.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {paged.map((test) => {
                const info = attemptMap[String(test._id)];
                return (
                  <div key={test._id} className={`${card} rounded-2xl p-5 flex items-center justify-between gap-4 transition`}>
                    <div className="flex-1 min-w-0">
                      <h2 className={`font-semibold ${title}`}>{test.title}</h2>
                      {test.description && <p className={`text-sm mt-0.5 truncate ${sub}`}>{test.description}</p>}
                      <div className={`flex flex-wrap gap-4 mt-2 text-xs ${metaText}`}>
                        <span>⏱ {test.duration} min</span>
                        <span>📝 {test.questionCount} questions</span>
                        <span>🎯 Pass: {test.passingMarks}/{test.totalMarks}</span>
                        {info && <span className="text-indigo-400 font-medium">🏆 Best: {info.best}%</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {info && <span className={`text-xs ${metaText}`}>Attempted {info.count}×</span>}
                      <Link to={`/tests/${test._id}`}
                        className={`text-sm px-4 py-2 rounded-xl font-medium transition cursor-pointer ${
                          info
                            ? dark
                              ? 'bg-white/10 border border-indigo-400/40 text-indigo-300 hover:bg-white/15'
                              : 'bg-indigo-50 border border-indigo-300 text-indigo-700 hover:bg-indigo-100'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-500/20'
                        }`}>
                        {info ? '🔁 Retake' : 'Start'}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination page={page} pages={pages} total={tests.length} limit={PAGE_SIZE} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
