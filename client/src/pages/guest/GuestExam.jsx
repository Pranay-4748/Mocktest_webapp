import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import Spinner from '../../components/common/Spinner';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function GuestExam() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [test, setTest]         = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers]   = useState({});   // { questionId: selectedIndex }
  const [current, setCurrent]   = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [navOpen, setNavOpen]   = useState(false);
  const startTime               = useRef(Date.now());
  const submitted               = useRef(false);

  const user = useMemo(() => JSON.parse(sessionStorage.getItem('guestUser') || 'null'), []);

  useEffect(() => {
    if (!user) { navigate('/guest', { replace: true }); return; }
    api.get(`/guest/tests/${id}`)
      .then(({ data }) => {
        setTest(data.test);
        setQuestions(data.questions);
        setTimeLeft(data.test.duration * 60);
      })
      .catch(() => navigate('/guest/tests', { replace: true }))
      .finally(() => setLoading(false));
  }, [id, navigate, user]);

  const handleSubmit = useCallback(async (_auto = false) => {
    if (submitted.current) return;
    submitted.current = true;
    setSubmitting(true);
    const timeTaken = Math.round((Date.now() - startTime.current) / 1000);
    const payload = {
      userName: user.name,
      email: user.email,
      testId: id,
      timeTaken,
      answers: questions.map((q) => ({
        questionId: q._id,
        selectedOption: answers[q._id] ?? -1,
      })),
    };
    try {
      const { data } = await api.post('/guest/submit', payload);
      navigate(`/guest/result`, { state: { result: data.result }, replace: true });
    } catch {
      submitted.current = false;
      setSubmitting(false);
    }
  }, [answers, questions, id, user, navigate]);

  // Countdown timer
  useEffect(() => {
    if (!test) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(interval); handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [test, handleSubmit]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;

  const q = questions[current];
  const answered = Object.keys(answers).length;
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const timerUrgent = timeLeft <= 60;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setNavOpen((o) => !o)}
              className="sm:hidden p-1.5 rounded-lg hover:bg-gray-100 transition">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <p className="font-semibold text-gray-800 text-sm truncate">{test.title}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-bold transition ${timerUrgent ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-700'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {mins}:{secs}
            </div>
            <button onClick={() => handleSubmit(false)} disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition">
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 flex gap-6">
        {/* Question panel */}
        <div className="flex-1 min-w-0">
          {/* Progress */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <span>Question {current + 1} of {questions.length}</span>
            <span>{answered} answered · {questions.length - answered} remaining</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-5">
            <div className="bg-indigo-500 h-1.5 rounded-full transition-all"
              style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
          </div>

          {/* Question card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 mb-4">
            <p className="text-gray-800 font-medium leading-relaxed">{q.question}</p>
            <div className="mt-5 space-y-2.5">
              {q.options.map((opt, i) => {
                const selected = answers[q._id] === i;
                return (
                  <button key={i} onClick={() => setAnswers((a) => ({ ...a, [q._id]: i }))}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition ${
                      selected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50 text-gray-700'
                    }`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition ${
                      selected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {OPTION_LABELS[i]}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prev / Next */}
          <div className="flex gap-3">
            <button onClick={() => setCurrent((c) => c - 1)} disabled={current === 0}
              className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition">
              ← Previous
            </button>
            {current < questions.length - 1 ? (
              <button onClick={() => setCurrent((c) => c + 1)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition">
                Next →
              </button>
            ) : (
              <button onClick={() => handleSubmit(false)} disabled={submitting}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition">
                {submitting ? 'Submitting…' : 'Finish & Submit'}
              </button>
            )}
          </div>
        </div>

        {/* Question navigator — desktop sidebar / mobile drawer */}
        <aside className={`
          fixed inset-0 z-30 bg-black/40 sm:bg-transparent sm:static sm:inset-auto sm:z-auto
          flex justify-end sm:block transition-all
          ${navOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none sm:opacity-100 sm:pointer-events-auto'}
        `} onClick={() => setNavOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="bg-white sm:bg-transparent w-64 h-full sm:h-auto sm:w-52 p-4 sm:p-0 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Navigator</p>
            <div className="grid grid-cols-5 sm:grid-cols-4 gap-1.5">
              {questions.map((q, i) => (
                <button key={i} onClick={() => { setCurrent(i); setNavOpen(false); }}
                  className={`w-full aspect-square rounded-lg text-xs font-medium transition ${
                    i === current
                      ? 'bg-indigo-600 text-white'
                      : answers[q._id] !== undefined
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-1.5 text-xs text-gray-500">
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-indigo-600 inline-block" /> Current</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-green-100 border border-green-300 inline-block" /> Answered</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-gray-100 inline-block" /> Not visited</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
