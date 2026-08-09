import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import Spinner from '../../components/common/Spinner';

export default function TestPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const startTime = useRef(Date.now());
  const submittingRef = useRef(false);
  const answersRef = useRef({});

  // Keep answersRef in sync so timer callback can access latest answers
  useEffect(() => { answersRef.current = answers; }, [answers]);

  useEffect(() => {
    api.get(`/tests/${id}`)
      .then(({ data }) => {
        setTest(data.test);
        setQuestions(data.questions);
        setTimeLeft(data.test.duration * 60);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load test'))
      .finally(() => setLoading(false));
  }, [id]);

  const doSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const payload = questions.map((q) => ({
        questionId: q._id,
        selectedOption: answersRef.current[q._id] ?? -1,
      }));
      const timeTaken = Math.round((Date.now() - startTime.current) / 1000);
      const { data } = await api.post('/results/submit', { testId: id, answers: payload, timeTaken });
      navigate(`/results/${data.attemptId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
      setSubmitting(false);
      submittingRef.current = false;
    }
  }, [questions, id, navigate]);

  // Timer — depends on timerStarted boolean (stable primitive)
  const timerStarted = timeLeft !== null;
  useEffect(() => {
    if (!timerStarted) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) { clearInterval(t); doSubmit(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timerStarted, doSubmit]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (loading) return <div className="flex justify-center mt-20"><Spinner /></div>;
  if (error) return (
    <div className="flex flex-col items-center justify-center mt-20 gap-3">
      <p className="text-red-500">{error}</p>
      <button onClick={() => navigate('/tests')} className="text-sm text-indigo-600 hover:underline">← Back to Tests</button>
    </div>
  );

  const q = questions[current];
  const answered = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow px-6 py-3 flex justify-between items-center sticky top-0 z-10">
        <h1 className="font-semibold text-gray-800 truncate max-w-xs">{test.title}</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{answered}/{questions.length} answered</span>
          <span className={`font-mono font-bold text-lg ${timeLeft < 60 ? 'text-red-500' : 'text-indigo-600'}`}>
            ⏱ {fmt(timeLeft ?? 0)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 max-w-5xl mx-auto w-full px-4 py-6 gap-6">
        {/* Question */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-xs text-gray-400 mb-2">Question {current + 1} of {questions.length}</p>
            <p className="text-gray-800 font-medium mb-5">{q.question}</p>
            <div className="space-y-3">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setAnswers((prev) => ({ ...prev, [q._id]: i }))}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition ${
                    answers[q._id] === i
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrent((c) => c - 1)}
                disabled={current === 0}
                className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                ← Prev
              </button>
              {current < questions.length - 1 ? (
                <button
                  onClick={() => setCurrent((c) => c + 1)}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={doSubmit}
                  disabled={submitting}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit Test'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question palette */}
        <div className="w-48 shrink-0">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-500 mb-3">QUESTIONS</p>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-8 h-8 text-xs rounded font-medium transition ${
                    i === current
                      ? 'bg-indigo-600 text-white'
                      : answers[questions[i]._id] !== undefined
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={doSubmit}
              disabled={submitting}
              className="mt-4 w-full bg-green-600 text-white text-sm py-2 rounded-lg hover:bg-green-700 disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
