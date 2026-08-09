import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import Spinner from '../../components/common/Spinner';

export default function ResultPage() {
  const { id } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/results/${id}`)
      .then(({ data }) => setAttempt(data.attempt))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load result'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <><Navbar /><div className="flex justify-center mt-20"><Spinner /></div></>;
  if (error) return <><Navbar /><div className="text-center mt-20 text-red-500">{error}</div></>;

  const { testId: test, score, percentage, passed, timeTaken, answers } = attempt;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Score card */}
        <div className={`rounded-2xl p-6 text-white mb-8 ${passed ? 'bg-green-500' : 'bg-red-500'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm opacity-80">{test?.title}</p>
              <p className="text-5xl font-bold mt-1">{percentage}%</p>
              <p className="mt-1 text-lg font-medium">{passed ? '🎉 Passed!' : '😔 Failed'}</p>
            </div>
            <div className="text-right text-sm opacity-80 space-y-1">
              <p>Score: {score} / {test?.totalMarks}</p>
              <p>Pass mark: {test?.passingMarks}</p>
              <p>Time: {Math.floor(timeTaken / 60)}m {timeTaken % 60}s</p>
            </div>
          </div>
        </div>

        {/* Per-question review */}
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Answer Review</h2>
        <div className="space-y-4">
          {answers.map((a, idx) => {
            const q = a.question;
            if (!q) return null;
            return (
              <div key={idx} className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${a.isCorrect ? 'border-green-400' : 'border-red-400'}`}>
                <p className="text-sm font-medium text-gray-800 mb-3">
                  <span className="text-gray-400 mr-2">Q{idx + 1}.</span>{q.question}
                </p>
                <div className="space-y-1.5">
                  {q.options.map((opt, i) => {
                    const isCorrect = i === q.correctAnswer;
                    const isSelected = i === a.selectedOption;
                    let cls = 'text-gray-600';
                    if (isCorrect) cls = 'text-green-700 font-semibold';
                    else if (isSelected && !isCorrect) cls = 'text-red-600 line-through';
                    return (
                      <p key={i} className={`text-sm ${cls}`}>
                        {String.fromCharCode(65 + i)}. {opt}
                        {isCorrect && ' ✓'}
                        {isSelected && !isCorrect && ' ✗'}
                      </p>
                    );
                  })}
                </div>
                {q.explanation && (
                  <p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded p-2">💡 {q.explanation}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 mt-8">
          <Link to="/tests" className="flex-1 text-center bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 text-sm font-medium">
            Browse More Tests
          </Link>
          <Link to="/dashboard" className="flex-1 text-center border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 text-sm font-medium">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
