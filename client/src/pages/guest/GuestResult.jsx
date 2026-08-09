import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

/* ── tiny helpers ─────────────────────────────────────── */
function fmt(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

function Ring({ pct, passed }) {
  const r = 52, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="140" height="140" className="rotate-[-90deg]">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
      <circle cx="70" cy="70" r={r} fill="none"
        stroke={passed ? '#16a34a' : '#ef4444'}
        strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
      <text x="70" y="66" textAnchor="middle" dominantBaseline="middle"
        className="rotate-90" fill={passed ? '#16a34a' : '#ef4444'}
        fontSize="22" fontWeight="700"
        style={{ transform: 'rotate(90deg)', transformOrigin: '70px 70px' }}>
        {pct}%
      </text>
      <text x="70" y="88" textAnchor="middle"
        fill="#9ca3af" fontSize="11"
        style={{ transform: 'rotate(90deg)', transformOrigin: '70px 70px' }}>
        {passed ? 'PASSED' : 'FAILED'}
      </text>
    </svg>
  );
}

function StatBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span className="font-semibold text-gray-700">{value} <span className="font-normal text-gray-400">/ {max}</span></span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const FILTERS = ['All', 'Correct', 'Wrong', 'Unanswered'];

/* ── main component ───────────────────────────────────── */
export default function GuestResult() {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const result    = state?.result;
  const [filter, setFilter]     = useState('All');
  const [expanded, setExpanded] = useState({});

  if (!result) { navigate('/guest', { replace: true }); return null; }

  const {
    userName, score, percentage, passed,
    timeTaken, totalMarks, passingMarks,
    answers, questions,
  } = result;

  const qMap = Object.fromEntries((questions || []).map((q) => [String(q._id), q]));

  // ── stats ──
  const total      = answers.length;
  const correct    = answers.filter((a) => a.isCorrect).length;
  const unanswered = answers.filter((a) => a.selectedOption === -1).length;
  const wrong      = total - correct - unanswered;

  // ── filter ──
  const visible = answers.filter((a) => {
    if (filter === 'Correct')    return a.isCorrect;
    if (filter === 'Wrong')      return !a.isCorrect && a.selectedOption !== -1;
    if (filter === 'Unanswered') return a.selectedOption === -1;
    return true;
  });

  const toggle = (i) => setExpanded((e) => ({ ...e, [i]: !e[i] }));

  const STAT_CARDS = [
    { label: 'Total',      value: total,      bg: 'bg-gray-50',   text: 'text-gray-700',  border: 'border-gray-200' },
    { label: 'Attempted',  value: total - unanswered, bg: 'bg-blue-50',  text: 'text-blue-700',  border: 'border-blue-200' },
    { label: 'Correct',    value: correct,    bg: 'bg-green-50',  text: 'text-green-700', border: 'border-green-200' },
    { label: 'Wrong',      value: wrong,      bg: 'bg-red-50',    text: 'text-red-600',   border: 'border-red-200' },
    { label: 'Unanswered', value: unanswered, bg: 'bg-amber-50',  text: 'text-amber-600', border: 'border-amber-200' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      {/* ── Hero banner ── */}
      <div className={`${passed ? 'bg-gradient-to-br from-green-600 to-emerald-500' : 'bg-gradient-to-br from-red-500 to-rose-600'} text-white`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center gap-8">

            {/* Ring */}
            <div className="shrink-0 bg-white rounded-2xl p-3 shadow-lg">
              <Ring pct={percentage} passed={passed} />
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <p className="text-white/70 text-sm mb-1">{userName}</p>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {passed ? '🎉 Congratulations!' : '😔 Better Luck Next Time'}
              </h1>
              <p className="text-white/80 text-sm mt-2">
                You scored <span className="font-bold text-white">{score}</span> out of{' '}
                <span className="font-bold text-white">{totalMarks}</span> marks.
                Passing marks: <span className="font-bold text-white">{passingMarks}</span>.
              </p>

              {/* Mini stats row */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-5">
                {[
                  { icon: '⏱', label: 'Time', val: fmt(timeTaken) },
                  { icon: '✅', label: 'Correct', val: correct },
                  { icon: '❌', label: 'Wrong', val: wrong },
                  { icon: '⬜', label: 'Skipped', val: unanswered },
                ].map(({ icon, label, val }) => (
                  <div key={label} className="bg-white/15 backdrop-blur rounded-xl px-4 py-2 text-center min-w-[72px]">
                    <p className="text-base font-bold">{val}</p>
                    <p className="text-white/70 text-xs">{icon} {label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 space-y-6">

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {STAT_CARDS.map(({ label, value, bg, text, border }) => (
            <div key={label} className={`${bg} border ${border} rounded-2xl p-3 sm:p-4 text-center`}>
              <p className={`text-xl sm:text-2xl font-bold ${text}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Score breakdown bars ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Score Breakdown</h2>
          <StatBar label="Correct"    value={correct}    max={total} color="bg-green-500" />
          <StatBar label="Wrong"      value={wrong}      max={total} color="bg-red-400" />
          <StatBar label="Unanswered" value={unanswered} max={total} color="bg-amber-400" />
          {/* Pass threshold marker */}
          <div className="pt-1">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Marks Scored</span>
              <span className="font-semibold text-gray-700">
                {score} / {totalMarks}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {passed ? 'PASS' : 'FAIL'}
                </span>
              </span>
            </div>
            <div className="relative w-full bg-gray-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-700 ${passed ? 'bg-green-500' : 'bg-red-400'}`}
                style={{ width: `${percentage}%` }}
              />
              {/* Pass line */}
              <div
                className="absolute top-0 h-3 w-0.5 bg-gray-500 rounded"
                style={{ left: `${(passingMarks / totalMarks) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0</span>
              <span style={{ marginLeft: `${(passingMarks / totalMarks) * 100 - 5}%` }}>
                Pass ({passingMarks})
              </span>
              <span>{totalMarks}</span>
            </div>
          </div>
        </div>

        {/* ── Question-wise review ── */}
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-sm font-semibold text-gray-700">Question-wise Review</h2>
            {/* Filter tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {FILTERS.map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    filter === f ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {f}
                  <span className={`ml-1 text-xs ${filter === f ? 'text-indigo-600' : 'text-gray-400'}`}>
                    ({f === 'All' ? total : f === 'Correct' ? correct : f === 'Wrong' ? wrong : unanswered})
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {visible.map((ans) => {
              const qId = String(ans.questionId?._id ?? ans.questionId);
              const q   = qMap[qId];
              if (!q) return null;

              const globalIdx = answers.indexOf(ans);
              const isOpen    = !!expanded[globalIdx];
              const skipped   = ans.selectedOption === -1;

              let statusColor, statusLabel, statusIcon;
              if (ans.isCorrect)  { statusColor = 'border-green-200 bg-green-50';  statusLabel = 'Correct';    statusIcon = '✓'; }
              else if (skipped)   { statusColor = 'border-amber-200 bg-amber-50';  statusLabel = 'Unanswered'; statusIcon = '—'; }
              else                { statusColor = 'border-red-200 bg-red-50';      statusLabel = 'Wrong';      statusIcon = '✗'; }

              const badgeCls = ans.isCorrect
                ? 'bg-green-100 text-green-700'
                : skipped ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600';

              return (
                <div key={globalIdx} className={`rounded-2xl border ${statusColor} overflow-hidden`}>
                  {/* Question header — always visible, click to expand */}
                  <button
                    onClick={() => toggle(globalIdx)}
                    className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:brightness-95 transition"
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${badgeCls}`}>
                      {statusIcon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-400 font-medium">Q{globalIdx + 1}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeCls}`}>{statusLabel}</span>
                        {!skipped && (
                          <span className="text-xs text-gray-400">
                            {ans.isCorrect ? `+${ans.marksAwarded}` : '0'} marks
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-800 font-medium mt-1 line-clamp-2">{q.question}</p>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-400 shrink-0 mt-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-white/60 pt-3 space-y-2">
                      {/* Full question */}
                      <p className="text-sm text-gray-800 font-medium mb-3">{q.question}</p>

                      {/* Options */}
                      {q.options.map((opt, i) => {
                        const isCorrectOpt  = i === q.correctAnswer;
                        const isSelectedOpt = i === ans.selectedOption;

                        let cls = 'border-gray-200 bg-white text-gray-600';
                        if (isCorrectOpt)               cls = 'border-green-400 bg-green-50 text-green-800';
                        if (isSelectedOpt && !isCorrectOpt) cls = 'border-red-400 bg-red-50 text-red-700';

                        return (
                          <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm ${cls}`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              isCorrectOpt ? 'bg-green-500 text-white' :
                              isSelectedOpt ? 'bg-red-400 text-white' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {LABELS[i]}
                            </span>
                            <span className="flex-1">{opt}</span>
                            <span className="shrink-0 text-xs font-semibold">
                              {isCorrectOpt && <span className="text-green-600">✓ Correct Answer</span>}
                              {isSelectedOpt && !isCorrectOpt && <span className="text-red-500">Your Answer</span>}
                            </span>
                          </div>
                        );
                      })}

                      {/* Skipped notice */}
                      {skipped && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
                          <span>⚠</span> You did not attempt this question.
                          <span className="ml-auto font-medium">
                            Correct: <span className="font-bold">{LABELS[q.correctAnswer]}. {q.options[q.correctAnswer]}</span>
                          </span>
                        </div>
                      )}

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="flex items-start gap-2 mt-2 text-xs text-gray-600 bg-white border border-gray-200 px-3 py-2.5 rounded-xl">
                          <span className="text-indigo-500 shrink-0 mt-0.5">💡</span>
                          <span>{q.explanation}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {visible.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">No questions in this category.</div>
            )}
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button onClick={() => navigate('/guest/tests')}
            className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition">
            ← Take Another Test
          </button>
          <button onClick={() => { sessionStorage.removeItem('guestUser'); navigate('/guest'); }}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition">
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
