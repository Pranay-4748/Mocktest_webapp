import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import Spinner from '../../components/common/Spinner';

export default function TestListPage() {
  const [tests, setTests] = useState([]);
  const [attemptMap, setAttemptMap] = useState({}); // testId -> { count, best }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/tests'), api.get('/results/my').catch(() => ({ data: { attempts: [] } }))])
      .then(([{ data: testsData }, { data: resultsData }]) => {
        setTests(testsData.tests);
        // Build a map: testId -> { count, best percentage }
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

  if (loading) return <><Navbar /><div className="flex justify-center mt-20"><Spinner /></div></>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Available Tests</h1>
        {tests.length === 0 ? (
          <p className="text-gray-400 text-center mt-20">No published tests available yet.</p>
        ) : (
          <div className="grid gap-4">
            {tests.map((test) => {
              const info = attemptMap[String(test._id)];
              return (
                <div key={test._id} className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-800">{test.title}</h2>
                    {test.description && <p className="text-sm text-gray-500 mt-0.5">{test.description}</p>}
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
                      <span>⏱ {test.duration} min</span>
                      <span>📝 {test.questionCount} questions</span>
                      <span>🎯 Pass: {test.passingMarks}/{test.totalMarks}</span>
                      {info && (
                        <span className="text-indigo-500 font-medium">
                          🏆 Best: {info.best}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {info && (
                      <span className="text-xs text-gray-400">
                        Attempted {info.count}×
                      </span>
                    )}
                    <Link
                      to={`/tests/${test._id}`}
                      className={`text-sm px-4 py-2 rounded-lg font-medium transition ${
                        info
                          ? 'bg-indigo-50 border border-indigo-300 text-indigo-700 hover:bg-indigo-100'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {info ? '🔁 Retake' : 'Start'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
