import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';

const EMPTY = {
  title: '', description: '', duration: '', passingMarks: '',
  totalMarks: '', randomQuestions: false, randomOptions: false, status: 'draft',
};

const STATUS_BADGE = {
  published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  draft:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  archived:  'bg-gray-100  text-gray-500  dark:bg-gray-800     dark:text-gray-400',
};

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function ManageTests() {
  const toast = useToast();
  const [tests, setTests]         = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('');
  const [modal, setModal]         = useState(null);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving]       = useState(false);
  const [deleteTarget, setDelete] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const fetchTests = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search)       params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/admin/tests', { params });
      setTests(data.tests);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load tests'); }
    finally { setLoading(false); }
  }, [search, statusFilter, toast]);

  useEffect(() => { fetchTests(1); }, [fetchTests]);

  const openCreate = () => { setForm(EMPTY); setFormError(''); setEditing(null); setModal('form'); };
  const openEdit   = (t) => {
    setForm({ title: t.title, description: t.description, duration: t.duration,
      passingMarks: t.passingMarks, totalMarks: t.totalMarks,
      randomQuestions: t.randomQuestions, randomOptions: t.randomOptions, status: t.status });
    setFormError(''); setEditing(t); setModal('form');
  };

  const handleField = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError(''); setSaving(true);
    try {
      if (!editing) {
        await api.post('/admin/tests', form);
        toast.success('Test created successfully');
      } else {
        await api.put(`/admin/tests/${editing._id}`, form);
        toast.success('Test updated successfully');
      }
      setModal(null);
      fetchTests(pagination.page);
    } catch (err) {
      const msg = err.response?.data?.message || 'Save failed';
      setFormError(msg);
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/tests/${deleteTarget._id}`);
      toast.success(`"${deleteTarget.title}" deleted`);
      setDelete(null);
      fetchTests(pagination.page);
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-5 max-w-6xl animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Tests</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{pagination.total} total tests</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Test
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search tests…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatus(e.target.value)} className="input sm:w-44">
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-24"><Spinner /></div>
        ) : tests.length === 0 ? (
          <EmptyState icon="📋" title="No tests found"
            description="Create your first test to get started."
            action={<button onClick={openCreate} className="btn-primary">Create Test</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="table-header">
                {['Title', 'Duration', 'Marks', 'Questions', 'Status', 'Actions'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {tests.map((t) => (
                  <tr key={t._id} className="table-row">
                    <td className="table-cell">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{t.title}</p>
                      {t.description && <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[220px] mt-0.5">{t.description}</p>}
                      {t.subjects && t.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {t.subjects.slice(0, 4).map((sub) => (
                            <span key={sub}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                              {sub}
                            </span>
                          ))}
                          {t.subjects.length > 4 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                              +{t.subjects.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="table-cell text-gray-500 dark:text-gray-400">{t.duration} min</td>
                    <td className="table-cell">
                      <span className="text-gray-700 dark:text-gray-300">{t.passingMarks}</span>
                      <span className="text-gray-400 dark:text-gray-500">/{t.totalMarks}</span>
                    </td>
                    <td className="table-cell">
                      <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t.questionCount ?? 0}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge capitalize ${STATUS_BADGE[t.status]}`}>{t.status}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5">
                        <Link to={`/admin/tests/${t._id}/questions`}
                          className="btn btn-ghost text-xs px-2.5 py-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30">
                          Questions
                        </Link>
                        <button onClick={() => openEdit(t)}
                          className="btn btn-ghost text-xs px-2.5 py-1.5">Edit</button>
                        <button onClick={() => setDelete(t)}
                          className="btn btn-ghost text-xs px-2.5 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination {...pagination} limit={10} onPage={fetchTests} />

      {/* Form Modal */}
      {modal === 'form' && (
        <Modal title={editing ? 'Edit Test' : 'Create Test'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-4">
            {formError && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2.5 rounded-xl">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {formError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Field label="Title" required>
                  <input name="title" value={form.title} onChange={handleField} required className="input" placeholder="e.g. General Knowledge Test" />
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="Description">
                  <textarea name="description" value={form.description} onChange={handleField} rows={2}
                    className="input resize-none" placeholder="Optional description…" />
                </Field>
              </div>
              <Field label="Duration (min)" required>
                <input name="duration" type="number" min="1" value={form.duration} onChange={handleField} required className="input" placeholder="60" />
              </Field>
              <Field label="Status">
                <select name="status" value={form.status} onChange={handleField} className="input">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>
              <Field label="Total Marks" required>
                <input name="totalMarks" type="number" min="1" value={form.totalMarks} onChange={handleField} required className="input" placeholder="100" />
              </Field>
              <Field label="Passing Marks" required>
                <input name="passingMarks" type="number" min="0" value={form.passingMarks} onChange={handleField} required className="input" placeholder="40" />
              </Field>
              <div className="col-span-2 flex gap-6 pt-1">
                {[['randomQuestions', 'Randomize Questions'], ['randomOptions', 'Randomize Options']].map(([name, label]) => (
                  <label key={name} className="flex items-center gap-2.5 cursor-pointer select-none group">
                    <div className="relative">
                      <input type="checkbox" name={name} checked={form[name]} onChange={handleField} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer-checked:bg-indigo-600 transition" />
                      <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition peer-checked:translate-x-4" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving && <Spinner size="xs" className="border-white border-t-transparent" />}
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Test'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Test"
          message={`"${deleteTarget.title}" and all its questions will be permanently deleted.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDelete(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
