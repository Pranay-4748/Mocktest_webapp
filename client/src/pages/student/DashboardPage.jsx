import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import Spinner from '../../components/common/Spinner';
import { useAuth } from '../../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('attempts');

  useEffect(() => {
    Promise.all([api.get('/results/my'), api.get('/tests')])
      .then(([r, t]) => {
        setAttempts(r.data.attempts);
        setTests(t.data.tests);
      })
      .finally(() => setLoading(false));
  }, []);

  const passed = attempts.filter((a) => a.passed).length;
  const avg = attempts.length
    ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length)
    : 0;

  const attemptedIds = new Set(attempts.map((a) => String(a.testId?._id)));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Welcome, {user?.name} 👋</h1>
        <p className="text-gray-500 text-sm mb-6">Here's your performance overview</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Tests Taken', value: attempts.length },
            { label: 'Passed', value: passed },
            { label: 'Avg Score', value: `${avg}%` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm p-5 text-center">
              <p className="text-3xl font-bold text-indigo-600">{value}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-5 w-fit">
          {[
            { key: 'attempts', label: 'Recent Attempts' },
            { key: 'tests', label: `Available Tests ${tests.length ? `(${tests.length})` : ''}` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-1.5 text-sm rounded-md font-medium transition ${
                tab === key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <Spinner />
        ) : tab === 'attempts' ? (
          attempts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
              <p className="text-lg mb-3">No attempts yet</p>
              <button onClick={() => setTab('tests')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
                Browse Tests
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {attempts.slice(0, 5).map((a) => (
                <Link
                  key={a._id}
                  to={`/results/${a._id}`}
                  className="flex items-center justify-between bg-white rounded-xl shadow-sm px-5 py-4 hover:shadow-md transition"
                >
                  <div>
                    <p className="font-medium text-gray-800">{a.testId?.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(a.submittedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-indigo-600">{a.percentage}%</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {a.passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (
          tests.length === 0 ? (
            <p className="text-center text-gray-400 mt-10">No published tests available yet.</p>
          ) : (
            <div className="space-y-3">
              {tests.map((test) => {
                const done = attemptedIds.has(String(test._id));
                return (
                  <div key={test._id} className="flex items-center justify-between bg-white rounded-xl shadow-sm px-5 py-4">
                    <div>
                      <p className="font-medium text-gray-800">{test.title}</p>
                      <div className="flex gap-4 mt-1 text-xs text-gray-400">
                        <span>⏱ {test.duration} min</span>
                        <span>📝 {test.questionCount} questions</span>
                        <span>🎯 Pass: {test.passingMarks}/{test.totalMarks}</span>
                      </div>
                    </div>
                    {done ? (
                      <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg">Attempted</span>
                    ) : (
                      <Link
                        to={`/tests/${test._id}`}
                        className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                      >
                        Start
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
