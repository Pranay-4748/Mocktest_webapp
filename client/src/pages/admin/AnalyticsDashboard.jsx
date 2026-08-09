import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  ComposedChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

/* ── palette ── */
const C = {
  indigo: '#6366f1', green: '#22c55e', red: '#ef4444',
  amber: '#f59e0b', blue: '#3b82f6', purple: '#a855f7',
  slate: '#64748b',
};
const PIE_COLORS  = [C.green, C.red];
const DIFF_COLORS = { easy: C.green, medium: C.amber, hard: C.red };

/* ── tiny helpers ── */
function fmt(sec) {
  if (!sec) return '—';
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

function OverviewCard({ label, value, sub, color }) {
  return (
    <div className={`bg-white rounded-2xl border-l-4 ${color} border border-gray-100 p-5 shadow-sm`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-gray-800 mt-1">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 className="text-sm font-semibold text-gray-700 mb-4">{children}</h3>;
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-48 text-gray-300 text-sm">
      No data yet
    </div>
  );
}

/* ── custom tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════ */
export default function AnalyticsDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [testId, setTestId]   = useState('');
  const [error, setError]     = useState('');

  const load = async (tid = '') => {
    setLoading(true); setError('');
    try {
      const params = tid ? { testId: tid } : {};
      const { data: res } = await api.get('/admin/analytics', { params });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleTestChange = (e) => {
    setTestId(e.target.value);
    load(e.target.value);
  };

  /* ── derived ── */
  const ov   = data?.overview;
  const sub  = data?.subjectAnalysis   ?? [];
  const diff = data?.difficultyAnalysis ?? [];
  const inc  = data?.mostIncorrect     ?? [];
  const aot  = data?.attemptsOverTime  ?? [];
  const dist = data?.scoreDistribution ?? [];
  const pf   = data?.passFailData      ?? [];

  // Radar needs fixed order
  const radarData = ['easy', 'medium', 'hard'].map((d) => {
    const row = diff.find((r) => r.difficulty === d) || { total: 0, correct: 0, accuracy: 0 };
    return { difficulty: d.charAt(0).toUpperCase() + d.slice(1), accuracy: row.accuracy, total: row.total };
  });

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Analytics</h2>
          <p className="text-sm text-gray-500 mt-0.5">Performance insights across all attempts</p>
        </div>
        <select
          value={testId} onChange={handleTestChange}
          className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white min-w-[200px]"
        >
          <option value="">All Tests</option>
          {(data?.tests ?? []).map((t) => (
            <option key={t._id} value={t._id}>{t.title}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-32"><Spinner /></div>
      ) : error ? (
        <div className="py-20 text-center text-red-500">{error}</div>
      ) : !ov ? (
        <div className="py-20 text-center text-gray-400">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-medium">No attempts yet</p>
          <p className="text-sm mt-1">Analytics will appear once students start taking tests.</p>
        </div>
      ) : (
        <>
          {/* ── Overview cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <OverviewCard label="Total Attempts" value={ov.totalAttempts} color="border-l-indigo-500" />
            <OverviewCard label="Avg Score"      value={`${ov.avgScore}%`}  color="border-l-blue-500" />
            <OverviewCard label="Highest Score"  value={`${ov.highScore}%`} color="border-l-green-500" sub="Best attempt" />
            <OverviewCard label="Lowest Score"   value={`${ov.lowScore}%`}  color="border-l-red-400"   sub="Lowest attempt" />
            <OverviewCard label="Pass Rate"      value={`${ov.passRate}%`}  color="border-l-emerald-500" />
            <OverviewCard label="Avg Time"       value={fmt(ov.avgTime)}    color="border-l-amber-500" />
          </div>

          {/* ── Row 1: Score Distribution + Pass/Fail ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Score distribution bar */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionTitle>Score Distribution</SectionTitle>
              {dist.every((d) => d.count === 0) ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dist} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Students" fill={C.indigo} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pass / Fail pie */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionTitle>Pass / Fail Ratio</SectionTitle>
              {pf.every((d) => d.value === 0) ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pf} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                      dataKey="value" nameKey="name" paddingAngle={3}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}>
                      {pf.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="flex justify-center gap-4 mt-2">
                {pf.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ background: PIE_COLORS[i] }} />
                    {d.name}: <span className="font-semibold text-gray-700">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Row 2: Attempts over time ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionTitle>Attempts Over Time (Last 30 Days)</SectionTitle>
            {!aot.length ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={aot}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }}
                    tickFormatter={(d) => d.slice(5)} />
                  <YAxis yAxisId="left"  allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar  yAxisId="left"  dataKey="count"  name="Attempts" fill={C.indigo} radius={[4, 4, 0, 0]} barSize={18} />
                  <Line yAxisId="right" dataKey="avgPct" name="Avg Score %" stroke={C.amber}
                    strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Row 3: Subject + Difficulty ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Subject-wise grouped bar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionTitle>Subject-wise Analysis</SectionTitle>
              {!sub.length ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={sub} layout="vertical" barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="subject" width={90} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="correct" name="Correct" fill={C.green}  radius={[0, 4, 4, 0]} />
                    <Bar dataKey="wrong"   name="Wrong"   fill={C.red}    radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Difficulty radar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionTitle>Difficulty-wise Accuracy</SectionTitle>
              {radarData.every((r) => r.total === 0) ? <EmptyChart /> : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={80}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="difficulty" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }}
                        tickFormatter={(v) => `${v}%`} />
                      <Radar name="Accuracy %" dataKey="accuracy" stroke={C.indigo}
                        fill={C.indigo} fillOpacity={0.25} strokeWidth={2} />
                      <Tooltip formatter={(v) => [`${v}%`, 'Accuracy']} />
                    </RadarChart>
                  </ResponsiveContainer>
                  {/* Difficulty breakdown table */}
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {radarData.map((r) => (
                      <div key={r.difficulty}
                        className="text-center bg-gray-50 rounded-xl py-2 px-1">
                        <p className="text-sm font-bold text-gray-800">{r.accuracy}%</p>
                        <p className="text-xs text-gray-400 mt-0.5">{r.difficulty}</p>
                        <p className="text-xs text-gray-400">{r.total} attempts</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Row 4: Most Incorrect Questions ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionTitle>Most Incorrectly Answered Questions (Top 10)</SectionTitle>
            {!inc.length ? (
              <EmptyChart />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['#', 'Question', 'Subject', 'Difficulty', 'Wrong Attempts'].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {inc.map((q, i) => (
                      <tr key={String(q._id)} className="hover:bg-gray-50 transition">
                        <td className="py-3 pr-4 text-gray-400 text-xs">{i + 1}</td>
                        <td className="py-3 pr-4 text-gray-700 max-w-xs">
                          <p className="line-clamp-2">{q.question}</p>
                        </td>
                        <td className="py-3 pr-4 text-gray-500 text-xs">{q.subject || '—'}</td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize`}
                            style={{
                              background: DIFF_COLORS[q.difficulty] + '22',
                              color: DIFF_COLORS[q.difficulty],
                            }}>
                            {q.difficulty}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-24">
                              <div className="bg-red-400 h-1.5 rounded-full"
                                style={{ width: `${Math.min((q.wrongCount / (inc[0]?.wrongCount || 1)) * 100, 100)}%` }} />
                            </div>
                            <span className="font-semibold text-red-500 text-xs">{q.wrongCount}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
