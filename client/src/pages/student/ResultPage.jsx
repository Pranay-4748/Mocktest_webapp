import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import { useDarkMode } from '../../context/DarkModeContext';

const PAGE_SIZE = 10;

export default function ResultPage() {
  const { id } = useParams();
  const { dark } = useDarkMode();
  const [attempt, setAttempt]       = useState(null);
  const [allAttempts, setAllAttempts] = useState([]);
  const [loading, setLoading]        = useState(true);
  const [error, setError]            = useState('');
  const [page, setPage]              = useState(1);

  useEffect(() => {
    api.get(`/results/${id}`)
      .then(({ data }) => {
        setAttempt(data.attempt);
        // fetch all attempts to find attempt number
        return api.get('/results/my');
      })
      .then(({ data }) => {
        setAllAttempts(data.attempts);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load result'))
      .finally(() => setLoading(false));
  }, [id]);

  const bg      = dark ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900' : 'bg-gray-100';
  const card    = dark ? 'bg-white/10 backdrop-blur-xl border border-white/15' : 'bg-white border border-gray-100 shadow-sm';
  const title   = dark ? 'text-white' : 'text-gray-900';
  const sub     = dark ? 'text-indigo-300/70' : 'text-gray-500';
  const optDef  = dark ? 'text-indigo-200/60' : 'text-gray-600';
  const expBg   = dark ? 'bg-white/5 border border-white/10 text-indigo-300/60' : 'bg-gray-50 border border-gray-100 text-gray-500';

  if (loading) return (
    <div className={`min-h-screen transition-colors ${bg}`}>
      <Navbar /><div className="flex justify-center mt-20"><Spinner /></div>
    </div>
  );
  if (error) return (
    <div className={`min-h-screen transition-colors ${bg}`}>
      <Navbar /><div className="text-center mt-20 text-red-400">{error}</div>
    </div>
  );

  const { testId: test, score, percentage, passed, timeTaken, answers } = attempt;

  // attempts for this test sorted oldest first to get attempt number
  const testAttempts  = allAttempts
    .filter((a) => String(a.testId?._id) === String(test?._id))
    .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
  const attemptNumber = testAttempts.findIndex((a) => a._id === id) + 1;
  const totalAttempts = testAttempts.length;
  const validAnswers  = answers.filter((a) => a.question);
  const pages         = Math.ceil(validAnswers.length / PAGE_SIZE);
  const pagedAnswers  = validAnswers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const globalOffset  = (page - 1) * PAGE_SIZE;

  return (
    <div className={`min-h-screen transition-colors ${bg}`}>
      {dark && <>
        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      </>}
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8 relative">
        {/* Score card */}
        <div className={`rounded-2xl p-6 mb-8 border animate-fade-in ${
          passed
            ? dark ? 'bg-green-500/20 border-green-500/30' : 'bg-green-50 border-green-200'
            : dark ? 'bg-red-500/20 border-red-500/30'   : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-sm ${sub}`}>{test?.title}</p>
              <p className={`text-5xl font-bold mt-1 ${passed ? (dark ? 'text-green-300' : 'text-green-600') : (dark ? 'text-red-300' : 'text-red-500')}`}>
                {percentage}%
              </p>
              <p className={`mt-1 text-lg font-medium ${title}`}>{passed ? '🎉 Passed!' : '😔 Failed'}</p>
              {totalAttempts > 0 && (
                <p className={`mt-1 text-xs ${sub}`}>
                  Attempt {attemptNumber} of {totalAttempts}
                </p>
              )}
            </div>
            <div className={`text-right text-sm space-y-1 ${sub}`}>
              <p>Score: <span className={`font-medium ${title}`}>{score} / {test?.totalMarks}</span></p>
              <p>Pass mark: <span className={`font-medium ${title}`}>{test?.passingMarks}</span></p>
              <p>Time: <span className={`font-medium ${title}`}>{Math.floor(timeTaken / 60)}m {timeTaken % 60}s</span></p>
            </div>
          </div>
        </div>

        {/* Answer Review */}
        <h2 className={`text-lg font-semibold mb-4 ${title}`}>
          Answer Review
          <span className={`text-sm font-normal ml-2 ${sub}`}>({validAnswers.length} questions)</span>
        </h2>

        <div className="space-y-4">
          {pagedAnswers.map((a, idx) => {
            const q = a.question;
            return (
              <div key={idx} className={`${card} rounded-2xl p-5 border-l-4 ${a.isCorrect ? 'border-l-green-400' : 'border-l-red-400'}`}>
                <p className={`text-sm font-medium mb-3 ${title}`}>
                  <span className={`mr-2 ${sub}`}>Q{globalOffset + idx + 1}.</span>{q.question}
                </p>
                <div className="space-y-1.5">
                  {q.options.map((opt, i) => {
                    const isCorrect  = i === q.correctAnswer;
                    const isSelected = i === a.selectedOption;
                    let cls = optDef;
                    if (isCorrect) cls = dark ? 'text-green-300 font-semibold' : 'text-green-700 font-semibold';
                    else if (isSelected && !isCorrect) cls = dark ? 'text-red-400 line-through' : 'text-red-500 line-through';
                    return (
                      <p key={i} className={`text-sm ${cls}`}>
                        {String.fromCharCode(65 + i)}. {opt}
                        {isCorrect && ' ✓'}{isSelected && !isCorrect && ' ✗'}
                      </p>
                    );
                  })}
                </div>
                {q.explanation && (
                  <p className={`mt-3 text-xs rounded-xl p-2.5 ${expBg}`}>💡 {q.explanation}</p>
                )}
              </div>
            );
          })}
        </div>

        <Pagination page={page} pages={pages} total={validAnswers.length} limit={PAGE_SIZE}
          onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />

        <div className="flex gap-3 mt-8">
          <Link to="/tests"
            className="flex-1 text-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer">
            Browse More Tests
          </Link>
          <Link to="/dashboard"
            className={`flex-1 text-center py-2.5 rounded-xl text-sm font-medium transition border cursor-pointer ${
              dark ? 'bg-white/10 border-white/15 text-indigo-200 hover:bg-white/15' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}>
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
