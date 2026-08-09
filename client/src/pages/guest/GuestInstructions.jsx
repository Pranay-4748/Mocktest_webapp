import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import Spinner from '../../components/common/Spinner';

const RULES = [
  'Read each question carefully before answering.',
  'Each question has only one correct answer.',
  'You can navigate between questions freely.',
  'Unanswered questions will be marked as skipped.',
  'The exam auto-submits when the timer reaches zero.',
  'Do not refresh or close the browser during the exam.',
];

export default function GuestInstructions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = useMemo(() => JSON.parse(sessionStorage.getItem('guestUser') || 'null'), []);

  useEffect(() => {
    if (!user) { navigate('/guest', { replace: true }); return; }
    api.get(`/guest/tests/${id}`)
      .then(({ data }) => setTest(data.test))
      .catch(() => navigate('/guest/tests', { replace: true }))
      .finally(() => setLoading(false));
  }, [id, navigate, user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-4 pt-10">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="bg-indigo-600 rounded-2xl p-6 text-white mb-4">
          <p className="text-indigo-200 text-xs font-medium uppercase tracking-wide mb-1">Instructions</p>
          <h1 className="text-xl font-bold">{test.title}</h1>
          {test.description && <p className="text-indigo-100 text-sm mt-1">{test.description}</p>}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {[
              { label: 'Duration', value: `${test.duration} min` },
              { label: 'Questions', value: test.questionCount ?? '—' },
              { label: 'Total Marks', value: test.totalMarks },
              { label: 'Passing Marks', value: test.passingMarks },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
                <p className="text-lg font-bold">{value}</p>
                <p className="text-indigo-200 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs">!</span>
            General Instructions
          </h2>
          <ul className="space-y-2.5">
            {RULES.map((rule, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {rule}
              </li>
            ))}
          </ul>
        </div>

        {/* Candidate info */}
        <div className="bg-white rounded-2xl border border-gray-200 px-6 py-4 mb-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
            {user.name[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
          <button onClick={() => navigate('/guest')}
            className="ml-auto text-xs text-gray-400 hover:text-red-500 transition">
            Not you?
          </button>
        </div>

        <div className="flex gap-3">
          <button onClick={() => navigate('/guest/tests')}
            className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition">
            ← Back
          </button>
          <button onClick={() => navigate(`/guest/tests/${id}/exam`)}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition">
            Begin Exam →
          </button>
        </div>
      </div>
    </div>
  );
}
