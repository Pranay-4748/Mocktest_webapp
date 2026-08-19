import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Spinner from '../../components/common/Spinner';
import UploadQuestionsModal from '../../components/common/UploadQuestionsModal';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const DIFFICULTIES  = ['easy', 'medium', 'hard'];

const DIFF_COLORS = {
  easy:   'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard:   'bg-red-100 text-red-700',
};

const EMPTY_FORM = {
  question: '', options: ['', '', '', ''], correctAnswer: 0,
  explanation: '', marks: 1, subject: '', difficulty: 'medium',
};

export default function ManageQuestions() {
  const { id: testId } = useParams(); // present when scoped to a test

  const [questions, setQuestions]   = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [tests, setTests]           = useState([]);
  const [selectedTest, setSelectedTest] = useState(testId && testId !== 'undefined' ? testId : '');
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [diffFilter, setDiffFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [modal, setModal]           = useState(null);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formError, setFormError]   = useState('');
  const [saving, setSaving]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]     = useState(false);
  const [showUpload, setShowUpload]  = useState(false);

  // Load tests for the selector dropdown
  useEffect(() => {
    api.get('/admin/tests', { params: { limit: 100 } })
      .then(({ data }) => setTests(data.tests))
      .catch(console.error);
  }, []);

  const fetchQuestions = useCallback(async (page = 1) => {
    if (selectedTest === 'undefined') {
      console.error("Aborting request: testId is undefined");
      return;
    }
    
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (selectedTest)  params.testId     = selectedTest;
      if (search)        params.search     = search;
      if (diffFilter)    params.difficulty = diffFilter;
      if (subjectFilter) params.subject    = subjectFilter;
      const { data } = await api.get('/admin/questions', { params });
      setQuestions(data.questions);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedTest, search, diffFilter, subjectFilter]);

  useEffect(() => { fetchQuestions(1); }, [fetchQuestions]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, testId: selectedTest });
    setFormError(''); setEditing(null); setModal('create');
  };

  const openEdit = (q) => {
    setForm({
      question: q.question,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      marks: q.marks,
      subject: q.subject,
      difficulty: q.difficulty,
      testId: q.testId?._id || q.testId,
    });
    setFormError(''); setEditing(q); setModal('edit');
  };

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleOption = (i, value) => {
    setForm((f) => {
      const options = [...f.options];
      options[i] = value;
      return { ...f, options };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError(''); setSaving(true);
    try {
      const payload = { ...form, correctAnswer: Number(form.correctAnswer), marks: Number(form.marks) };
      if (modal === 'create') {
        await api.post('/admin/questions', payload);
      } else {
        await api.put(`/admin/questions/${editing._id}`, payload);
      }
      setModal(null);
      fetchQuestions(pagination.page);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/questions/${deleteTarget._id}`);
      setDeleteTarget(null);
      fetchQuestions(pagination.page);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/admin/tests" className="hover:text-indigo-600 transition">Tests</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">Question Bank</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Questions</h2>
          <p className="text-sm text-gray-500 mt-0.5">{pagination.total} total questions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUpload(true)}
            disabled={!selectedTest}
            title={!selectedTest ? 'Select a test first' : ''}
            className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload DOCX
          </button>
          <button
            onClick={openCreate}
            disabled={!selectedTest}
            title={!selectedTest ? 'Select a test first' : ''}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Question
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <select
          value={selectedTest} onChange={(e) => setSelectedTest(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Tests</option>
          {tests.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
        </select>
        <input
          type="text" placeholder="Search questions..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <select
          value={diffFilter} onChange={(e) => setDiffFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Difficulties</option>
          {DIFFICULTIES.map((d) => <option key={d} value={d} className="capitalize">{d}</option>)}
        </select>
        <input
          type="text" placeholder="Filter by subject..." value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20"><Spinner /></div>
        ) : questions.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            No questions found
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['#', 'Question', 'Test', 'Subject', 'Difficulty', 'Marks', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {questions.map((q, idx) => (
                <tr key={q._id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3.5 text-gray-400 text-xs">
                    {(pagination.page - 1) * 10 + idx + 1}
                  </td>
                  <td className="px-5 py-3.5 max-w-xs">
                    <p className="font-medium text-gray-800 line-clamp-2">{q.question}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {q.options.map((opt, i) => (
                        <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${i === q.correctAnswer ? 'bg-green-100 text-green-700 font-semibold' : 'bg-gray-100 text-gray-500'}`}>
                          {OPTION_LABELS[i]}: {opt.length > 20 ? opt.slice(0, 20) + '…' : opt}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{q.testId?.title || '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{q.subject || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${DIFF_COLORS[q.difficulty]}`}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{q.marks}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(q)}
                        className="text-xs px-2.5 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition">
                        Edit
                      </button>
                      <button onClick={() => setDeleteTarget(q)}
                        className="text-xs px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-5">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => fetchQuestions(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                p === pagination.page ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <Modal title={modal === 'create' ? 'Add Question' : 'Edit Question'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-4">
            {formError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}

            {/* Test selector — only in create mode */}
            {modal === 'create' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test *</label>
                <select name="testId" value={form.testId} onChange={handleField} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option value="">Select a test</option>
                  {tests.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
                </select>
              </div>
            )}

            {/* Question */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
              <textarea name="question" value={form.question} onChange={handleField} required rows={3}
                placeholder="Enter the question text..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Options * <span className="text-xs text-gray-400 font-normal">(highlight correct answer)</span></label>
              <div className="space-y-2">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, correctAnswer: i }))}
                      className={`w-8 h-8 rounded-full text-sm font-bold shrink-0 transition border-2 ${
                        form.correctAnswer === i
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 text-gray-500 hover:border-green-400'
                      }`}
                    >
                      {OPTION_LABELS[i]}
                    </button>
                    <input
                      value={opt} onChange={(e) => handleOption(i, e.target.value)} required
                      placeholder={`Option ${OPTION_LABELS[i]}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">Click the letter button to mark the correct answer</p>
            </div>

            {/* Explanation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
              <textarea name="explanation" value={form.explanation} onChange={handleField} rows={2}
                placeholder="Optional explanation for the correct answer..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
            </div>

            {/* Subject / Difficulty / Marks */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input name="subject" value={form.subject} onChange={handleField} placeholder="e.g. Math"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select name="difficulty" value={form.difficulty} onChange={handleField}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  {DIFFICULTIES.map((d) => <option key={d} value={d} className="capitalize">{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                <input name="marks" type="number" min="0" step="0.5" value={form.marks} onChange={handleField}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition">
                {saving ? 'Saving...' : modal === 'create' ? 'Add Question' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showUpload && selectedTest && (
        <UploadQuestionsModal
          testId={selectedTest}
          onClose={() => setShowUpload(false)}
          onImported={() => fetchQuestions(1)}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <ConfirmDialog
          message="Delete this question? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
