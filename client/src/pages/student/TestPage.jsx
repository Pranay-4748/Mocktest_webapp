import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import { useAuth } from '../../context/AuthContext';

export default function TestPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [test, setTest]               = useState(null);
  const [questions, setQuestions]     = useState([]);
  const [answers, setAnswers]         = useState({});
  const [marked, setMarked]           = useState({});
  const [visited, setVisited]         = useState({});
  const [current, setCurrent]         = useState(0);
  const [timeLeft, setTimeLeft]       = useState(null);
  const [paused, setPaused]           = useState(false);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fsWarning, setFsWarning]     = useState(false);
  const [error, setError]             = useState('');

  const startTime     = useRef(Date.now());
  const submittingRef = useRef(false);
  const answersRef    = useRef({});
  const pausedRef     = useRef(false);
  const doSubmitRef   = useRef(null);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { pausedRef.current  = paused;  }, [paused]);

  useEffect(() => {
    api.get(`/tests/${id}`)
      .then(({ data }) => {
        setTest(data.test);
        setQuestions(data.questions);
        setTimeLeft(data.test.duration * 60);
        if (data.questions.length) setVisited({ [data.questions[0]._id]: true });
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load test'))
      .finally(() => setLoading(false));
  }, [id]);

  const doSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const payload   = questions.map((q) => ({ questionId: q._id, selectedOption: answersRef.current[q._id] ?? -1 }));
      const timeTaken = Math.round((Date.now() - startTime.current) / 1000);
      const { data }  = await api.post('/results/submit', { testId: id, answers: payload, timeTaken });
      // exit fullscreen before navigating so the fs listener doesn't re-fire
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      navigate(`/results/${data.attemptId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
      setSubmitting(false);
      submittingRef.current = false;
    }
  }, [questions, id, navigate]);

  // keep ref in sync so fullscreen listener always calls latest version
  useEffect(() => { doSubmitRef.current = doSubmit; }, [doSubmit]);

  // enter fullscreen once test loads
  useEffect(() => {
    if (!loading && test) {
      const el = document.documentElement;
      (el.requestFullscreen ? el.requestFullscreen() : el.webkitRequestFullscreen?.()).catch(() => {});
    }
  }, [loading, test]);

  // auto-submit when user exits fullscreen
  useEffect(() => {
    const handler = () => {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      if (!isFs && !submittingRef.current) { setFsWarning(true); setShowConfirm(true); }
    };
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
    };
  }, []); // runs once, stable via refs

  useEffect(() => {
    if (timeLeft === null) return;
    const t = setInterval(() => {
      if (pausedRef.current) return;
      setTimeLeft((s) => { if (s <= 1) { clearInterval(t); doSubmit(); return 0; } return s - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [timeLeft === null, doSubmit]); // eslint-disable-line

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const goTo = (idx) => {
    const q = questions[idx];
    if (q) setVisited((v) => ({ ...v, [q._id]: true }));
    setCurrent(idx);
  };

  const saveAndNext = () => {
    if (current < questions.length - 1) goTo(current + 1);
    else setShowConfirm(true);
  };

  const markAndNext = () => {
    setMarked((m) => ({ ...m, [questions[current]._id]: true }));
    if (current < questions.length - 1) goTo(current + 1);
  };

  const clearResponse = () => {
    const qid = questions[current]._id;
    setAnswers((a) => { const n = { ...a }; delete n[qid]; return n; });
    setMarked((m)  => { const n = { ...m }; delete n[qid]; return n; });
  };

  if (loading) return <div className="flex justify-center mt-20"><Spinner /></div>;
  if (error)   return (
    <div className="flex flex-col items-center justify-center mt-20 gap-3">
      <p className="text-black">{error}</p>
      <button onClick={() => navigate('/tests')} className="text-sm text-gray-500 hover:underline cursor-pointer">← Back</button>
    </div>
  );

  const q             = questions[current];
  const answeredCount = Object.keys(answers).length;
  const markedCount   = Object.keys(marked).length;
  const visitedCount  = Object.keys(visited).length;
  const notVisited    = questions.length - visitedCount;
  const notAnswered   = Math.max(0, visitedCount - answeredCount);

  const qStatus = (qi) => {
    const qid = questions[qi]._id;
    if (answers[qid] !== undefined) return 'answered';
    if (marked[qid])                return 'marked';
    if (visited[qid])               return 'not-answered';
    return 'not-visited';
  };

  const paletteCls = (status, isCurrent) => {
    const base = 'w-9 h-9 text-xs font-semibold rounded flex items-center justify-center cursor-pointer transition border';
    const cur  = isCurrent ? ' ring-1 ring-black ring-offset-1' : '';
    switch (status) {
      case 'answered':     return `${base}${cur} bg-green-500 text-white border-green-600`;
      case 'not-answered': return `${base}${cur} bg-red-500 text-white border-red-600`;
      case 'marked':       return `${base}${cur} bg-purple-500 text-white border-purple-600`;
      default:             return `${base}${cur} bg-white text-black border-gray-300 hover:bg-gray-50`;
    }
  };

  const legendItems = [
    { label: 'Answered',     count: answeredCount, dot: 'bg-green-500 text-white border-green-600' },
    { label: 'Not Answered', count: notAnswered,   dot: 'bg-red-500 text-white border-red-600' },
    { label: 'Marked',       count: markedCount,   dot: 'bg-purple-500 text-white border-purple-600' },
    { label: 'Not Visited',  count: notVisited,    dot: 'bg-white text-black border-gray-300' },
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">

      {/* ── Header ── */}
      {/* <div className="bg-gray-200 px-5 py-2.5 flex items-center justify-between shrink-0">
        <h1 className="font-bold text-black text-base truncate">{test.title}</h1>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <span className="text-gray-300 text-sm hidden sm:block">{user?.name}</span>
        </div>
      </div> */}

      {/* ── Sections bar ── */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 shrink-0">
        <span className="text-xs font-medium text-gray-500 mr-1">Sections</span>
        <button className="px-4 py-1 text-sm font-semibold rounded bg-blue-500 text-white border cursor-pointer">
          {test.subject || 'General'}
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: question + options ── */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200">

          {/* Question label */}
          <div className="bg-white border-b border-gray-200 px-4 py-2 shrink-0">
            <span className="font-bold text-sm text-black">Question No {current + 1}</span>
          </div>

          {/* Split pane */}
          <div className="flex flex-1 overflow-hidden">

            {/* Question text */}
            <div className="w-1/2 border-r border-gray-200 overflow-y-auto p-5 bg-white">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-black">{q.question}</p>
            </div>

            {/* Options */}
            <div className="w-1/2 overflow-y-auto p-5 bg-white">
              <div className="space-y-2.5">
                {q.options.map((opt, i) => (
                  <label key={i}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      answers[q._id] === i
                        ? 'border-black bg-gray-100 text-black font-medium'
                        : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-black'
                    }`}>
                    <input
                      type="radio"
                      name={`q-${q._id}`}
                      checked={answers[q._id] === i}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q._id]: i }))}
                      className="mt-0.5 shrink-0 accent-black"
                    />
                    <span className="text-sm">
                      <span className="font-semibold mr-1">{String.fromCharCode(97 + i)})</span>{opt}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ── Bottom action bar ── */}
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex gap-2">
              <button onClick={markAndNext}
                className="px-4 py-2 text-sm rounded border border-gray-300 bg-white hover:bg-gray-50 text-black font-medium transition cursor-pointer">
                Mark for Review &amp; Next
              </button>
              <button onClick={clearResponse}
                className="px-4 py-2 text-sm rounded border border-gray-300 bg-white hover:bg-gray-50 text-black font-medium transition cursor-pointer">
                Clear Response
              </button>
            </div>
            <button onClick={saveAndNext}
              className="px-6 py-2 text-sm rounded font-semibold bg-blue-500 hover:bg-blue-600 text-white transition cursor-pointer">
              {current === questions.length - 1 ? 'Save & Submit' : 'Save & Next'}
            </button>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="w-60 shrink-0 flex flex-col bg-white border-l border-gray-200">

          {/* Timer */}
          <div className="border-b border-gray-200 p-3 flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm ${timeLeft < 60 ? 'text-gray-400 animate-pulse' : 'text-black'}`}>
                Time Left: {fmt(timeLeft ?? 0)}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.name}</p>
              
            </div>
          </div>

          {/* Legend */}
          <div className="border-b border-gray-200 p-3">
            
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              {legendItems.map(({ label, count, dot }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded text-xs font-bold flex items-center justify-center shrink-0 border ${dot}`}>
                    {count}
                  </span>
                  <span className="text-xs text-gray-500 leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Question Palette */}
          <div className="flex-1 overflow-auto p-3">
            <p className="text-xs font-bold text-black mb-2">Questions:</p>
            <div className="grid grid-cols-4 gap-1.5">
              {questions.map((_, i) => (
                <button key={i} onClick={() => goTo(i)} className={paletteCls(qStatus(i), i === current)}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar footer */}
          <div className="border-t border-gray-200 p-2 grid">
           
            <button onClick={() => setShowConfirm(true)}
              className="py-1.5 text-xs rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold transition cursor-pointer">
              Submit
            </button>
          </div>
        </div>
      </div>

      {/* ── Submit confirm modal ── */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-80 border border-gray-200">
            {fsWarning && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-4">
                <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-xs text-red-600 font-medium">You exited fullscreen! Submitting the exam is required to continue.</p>
              </div>
            )}
            <h3 className="font-bold text-base text-black mb-3">Submit Test?</h3>
            <div className="text-sm text-gray-500 space-y-1.5 mb-5">
              <p>Answered: <span className="font-semibold text-black">{answeredCount}</span></p>
              <p>Not Answered: <span className="font-semibold text-black">{notAnswered}</span></p>
              <p>Marked for Review: <span className="font-semibold text-black">{markedCount}</span></p>
              <p>Not Visited: <span className="font-semibold text-black">{notVisited}</span></p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setFsWarning(false);
                  const el = document.documentElement;
                  (el.requestFullscreen ? el.requestFullscreen() : el.webkitRequestFullscreen?.()).catch(() => {});
                }}
                className="flex-1 py-2 rounded-lg text-sm border border-gray-300 bg-white hover:bg-gray-50 text-black transition cursor-pointer">
                Cancel
              </button>
              <button onClick={doSubmit} disabled={submitting}
                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 transition cursor-pointer">
                {submitting ? 'Submitting…' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
