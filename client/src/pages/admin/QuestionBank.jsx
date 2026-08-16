import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Spinner from '../../components/common/Spinner';
import UploadQuestionsModal from '../../components/common/UploadQuestionsModal';
import { useToast } from '../../context/ToastContext';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

const DIFF_COLORS = {
  easy:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  medium: 'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',
  hard:   'bg-rose-100   text-rose-700   dark:bg-rose-900/30   dark:text-rose-400',
};

const DIFF_BTN_ACTIVE = {
  '':     'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30',
  easy:   'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30',
  medium: 'bg-amber-500  text-white shadow-sm shadow-amber-500/30',
  hard:   'bg-rose-500   text-white shadow-sm shadow-rose-500/30',
};

const SUBJECT_GRADIENTS = [
  'from-indigo-500 to-violet-600',
  'from-sky-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-purple-500 to-fuchsia-600',
];

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

const EMPTY_FORM = {
  question: '', options: ['', '', '', ''], correctAnswer: 0,
  explanation: '', marks: 1, subject: '', difficulty: 'medium', testId: '',
};

export default function QuestionBank() {
  const toast = useToast();
  const [groups, setGroups]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [diffFilter, setDiff]       = useState('');
  const [collapsed, setCollapsed]   = useState({});
  const [modal, setModal]           = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formError, setFormError]   = useState('');
  const [saving, setSaving]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]     = useState(false);
  const [subjects, setSubjects]     = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadSubject, setUploadSubject] = useState('');
  const [tests, setTests] = useState([]);
  
  // Subject Management
  const [showSubjectsModal, setShowSubjectsModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [subjectLoading, setSubjectLoading] = useState(false);

  const fetchSubjects = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/subjects');
      setSubjects(data.subjects || []);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (diffFilter) params.difficulty = diffFilter;
      const [{ data: groupsData }, { data: testsData }] = await Promise.all([
        api.get('/admin/questions/by-subject', { params }),
        api.get('/admin/tests'),
      ]);
      setGroups(groupsData.groups || []);
      setTests(testsData.tests || []);
    } catch (err) {
      toast.error('Failed to load question bank');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [diffFilter, toast]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const toggleCollapse = (subject) =>
    setCollapsed((c) => ({ ...c, [subject]: !c[subject] }));

  const openEdit = (q) => {
    setForm({
      question:     q.question,
      options:      [...q.options],
      correctAnswer: q.correctAnswer,
      explanation:  q.explanation || '',
      marks:        q.marks,
      subject:      q.subject || '',
      difficulty:   q.difficulty,
      testId:       q.testId ? String(q.testId) : '',
    });
    setFormError('');
    setEditTarget(q);
    setModal('edit');
  };

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleOption = (i, value) =>
    setForm((f) => { const opts = [...f.options]; opts[i] = value; return { ...f, options: opts }; });

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError(''); setSaving(true);
    try {
      await api.put(`/admin/questions/${editTarget._id}`, {
        ...form,
        correctAnswer: Number(form.correctAnswer),
        marks:         Number(form.marks),
      });
      toast.success('Question updated');
      setModal(null);
      fetchGroups();
    } catch (err) {
      const msg = err.response?.data?.message || 'Save failed';
      setFormError(msg);
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/questions/${deleteTarget._id}`);
      toast.success('Question deleted');
      setDeleteTarget(null);
      fetchGroups();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    setSubjectLoading(true);
    try {
      await api.post('/admin/subjects', { name: newSubject });
      setNewSubject('');
      fetchSubjects();
      toast.success('Subject added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add subject');
    } finally {
      setSubjectLoading(false);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    try {
      await api.delete(`/admin/subjects/${id}`);
      fetchSubjects();
      toast.success('Subject deleted');
      if (uploadSubject === subjects.find(s => s._id === id)?.name) setUploadSubject('');
    } catch {
      toast.error('Failed to delete subject');
    }
  };

  const totalQuestions = groups.reduce((s, g) => s + g.total, 0);
  const totalEasy      = groups.reduce((s, g) => s + g.easy,   0);
  const totalMedium    = groups.reduce((s, g) => s + g.medium, 0);
  const totalHard      = groups.reduce((s, g) => s + g.hard,   0);

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-1">
            <Link to="/admin/tests" className="hover:text-indigo-500 transition">Tests</Link>
            <span>/</span>
            <span className="text-gray-600 dark:text-gray-300 font-medium">Question Bank</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Question Bank</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {totalQuestions} questions across {groups.length} subject{groups.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Right controls */}
        <div className="flex flex-col sm:items-end gap-3 shrink-0">
          {/* Upload strip & Manage Subjects */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSubjectsModal(true)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mr-2"
            >
              Manage Subjects
            </button>
            <select
              value={uploadSubject}
              onChange={(e) => setUploadSubject(e.target.value)}
              className="input sm:w-48 text-sm"
            >
              <option value="">Select subject to upload…</option>
              {subjects.map((s) => <option key={s._id} value={s.name}>{s.name}</option>)}
            </select>
            <button
              onClick={() => setShowUpload(true)}
              disabled={!uploadSubject}
              title={!uploadSubject ? 'Select a subject first' : 'Upload DOCX questions'}
              className="flex items-center gap-2 btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload DOCX
            </button>
          </div>

          {/* Difficulty filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {[['', 'All Levels'], ['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setDiff(val)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  diffFilter === val
                    ? DIFF_BTN_ACTIVE[val]
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Summary strip ── */}
      {!loading && totalQuestions > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total',   value: totalQuestions, color: 'text-indigo-600 dark:text-indigo-400',   bg: 'bg-indigo-50 dark:bg-indigo-950/30',   icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { label: 'Easy',    value: totalEasy,      color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'Medium',  value: totalMedium,    color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-950/30',     icon: 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' },
            { label: 'Hard',    value: totalHard,      color: 'text-rose-600 dark:text-rose-400',       bg: 'bg-rose-50 dark:bg-rose-950/30',       icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z' },
          ].map(({ label, value, color, bg, icon }) => (
            <div key={label} className={`${bg} rounded-2xl px-5 py-4 flex items-center gap-3`}>
              <svg className={`w-8 h-8 ${color} opacity-70 shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
              </svg>
              <div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="py-24"><Spinner /></div>
      ) : groups.length === 0 ? (
        <div className="card py-24 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-semibold">No questions found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {diffFilter ? `No ${diffFilter} questions in the bank` : 'Add questions to tests to see them here'}
          </p>
          <Link to="/admin/tests" className="mt-4 inline-block btn-primary text-sm">Go to Tests</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group, gIdx) => {
            const isOpen = collapsed[group.subject] !== true;
            const gradient = SUBJECT_GRADIENTS[gIdx % SUBJECT_GRADIENTS.length];

            return (
              <div key={group.subject} className="card overflow-hidden">
                {/* ── Subject header (collapsible) ── */}
                <button
                  onClick={() => toggleCollapse(group.subject)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-md`}>
                    <span className="text-white text-sm font-bold leading-none">
                      {group.subject.slice(0, 2).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{group.subject}</h3>
                    </div>
                    {/* Difficulty badges */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs text-gray-400 dark:text-gray-500">{group.total} question{group.total !== 1 ? 's' : ''}</span>
                      {group.easy   > 0 && <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{group.easy} easy</span>}
                      {group.medium > 0 && <span className="badge bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400">{group.medium} medium</span>}
                      {group.hard   > 0 && <span className="badge bg-rose-100   text-rose-700   dark:bg-rose-900/30   dark:text-rose-400">{group.hard} hard</span>}
                    </div>
                  </div>

                  {/* Mini progress bar */}
                  <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0 w-32">
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
                      {group.easy   > 0 && <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(group.easy   / group.total) * 100}%` }} />}
                      {group.medium > 0 && <div className="bg-amber-500  h-full transition-all" style={{ width: `${(group.medium / group.total) * 100}%` }} />}
                      {group.hard   > 0 && <div className="bg-rose-500   h-full transition-all" style={{ width: `${(group.hard   / group.total) * 100}%` }} />}
                    </div>
                  </div>

                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* ── Questions list ── */}
                {isOpen && (
                  <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                    {group.questions.map((q, qIdx) => (
                      <div key={q._id} className="px-5 py-4 hover:bg-gray-50/60 dark:hover:bg-gray-800/20 transition-colors">
                        <div className="flex items-start gap-3">
                          {/* Number */}
                          <span className="text-xs text-gray-400 dark:text-gray-500 pt-0.5 w-6 shrink-0 text-right font-medium">
                            {qIdx + 1}.
                          </span>

                          {/* Body */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">
                              {q.question}
                            </p>

                            {/* Options row */}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {q.options.map((opt, i) => (
                                <span
                                  key={i}
                                  className={`text-xs px-2 py-0.5 rounded-lg ${
                                    i === q.correctAnswer
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-semibold ring-1 ring-emerald-300 dark:ring-emerald-700'
                                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                  }`}
                                >
                                  {OPTION_LABELS[i]}: {opt.length > 30 ? opt.slice(0, 30) + '…' : opt}
                                </span>
                              ))}
                            </div>

                            {/* Meta */}
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <span className={`badge capitalize ${DIFF_COLORS[q.difficulty]}`}>{q.difficulty}</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {q.marks} mark{q.marks !== 1 ? 's' : ''}
                              </span>
                              {q.testTitle && (
                                <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  {q.testTitle}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => openEdit(q)}
                              className="btn btn-ghost text-xs px-2.5 py-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                            >Edit</button>
                            <button
                              onClick={() => setDeleteTarget(q)}
                              className="btn btn-ghost text-xs px-2.5 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Edit Modal ── */}
      {modal === 'edit' && (
        <Modal title="Edit Question" onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-4">
            {formError && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2.5 rounded-xl">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Test</label>
              <select name="testId" value={form.testId} onChange={handleField} className="input">
                <option value="">Select a test</option>
                {tests.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Question *</label>
              <textarea name="question" value={form.question} onChange={handleField} required rows={3}
                placeholder="Enter the question text..." className="input resize-none" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                Options * <span className="text-gray-400 normal-case font-normal">(click letter to mark correct)</span>
              </label>
              <div className="space-y-2">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, correctAnswer: i }))}
                      className={`w-8 h-8 rounded-full text-sm font-bold shrink-0 transition border-2 ${
                        form.correctAnswer === i
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-emerald-400'
                      }`}
                    >{OPTION_LABELS[i]}</button>
                    <input value={opt} onChange={(e) => handleOption(i, e.target.value)} required
                      placeholder={`Option ${OPTION_LABELS[i]}`} className="input" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Explanation</label>
              <textarea name="explanation" value={form.explanation} onChange={handleField} rows={2}
                placeholder="Optional explanation..." className="input resize-none" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Subject</label>
                <input name="subject" value={form.subject} onChange={handleField} placeholder="e.g. Math" className="input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Difficulty</label>
                <select name="difficulty" value={form.difficulty} onChange={handleField} className="input">
                  {DIFFICULTIES.map((d) => <option key={d} value={d} className="capitalize">{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Marks</label>
                <input name="marks" type="number" min="0" step="0.5" value={form.marks} onChange={handleField} className="input" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Question"
          message="Delete this question permanently? This cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      {/* ── Upload DOCX Modal ── */}
      {showUpload && uploadSubject && (
        <UploadQuestionsModal
          subjectName={uploadSubject}
          onClose={() => setShowUpload(false)}
          onImported={() => { fetchGroups(); setShowUpload(false); }}
        />
      )}

      {/* ── Manage Subjects Modal ── */}
      {showSubjectsModal && (
        <Modal title="Manage Subjects" onClose={() => setShowSubjectsModal(false)}>
          <div className="space-y-4">
            <form onSubmit={handleAddSubject} className="flex gap-2">
              <input
                type="text"
                placeholder="New Subject Name"
                className="input flex-1"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                disabled={subjectLoading}
              />
              <button
                type="submit"
                disabled={!newSubject.trim() || subjectLoading}
                className="btn-primary"
              >
                {subjectLoading ? '...' : 'Add'}
              </button>
            </form>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
              {subjects.length === 0 ? (
                <p className="text-sm text-center py-4 text-gray-500">No subjects yet.</p>
              ) : (
                subjects.map(s => (
                  <div key={s._id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{s.name}</span>
                    <button
                      onClick={() => handleDeleteSubject(s._id)}
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded transition"
                      title="Delete Subject"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
