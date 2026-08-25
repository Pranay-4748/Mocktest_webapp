import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Modal from './Modal';
import Spinner from './Spinner';
import { useToast } from '../../context/ToastContext';

export default function SelectQuestionsModal({ testId, onClose, onLinked }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { data } = await api.get('/admin/subjects');
        setSubjects(data.subjects || []);
      } catch (err) {}
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    const fetchBank = async () => {
      try {
        // We fetch all questions by NOT providing testId filter.
        // Wait, the /admin/questions endpoint scopes to testId IF testId is provided.
        // If we don't provide testId, it returns all questions owned by admin.
        const { data } = await api.get('/admin/questions', { params: { limit: 1000 } });
        // Filter out questions that are already in this test
        const available = data.questions.filter(q => !q.testIds || !q.testIds.some(t => typeof t === 'object' ? t._id === testId : t === testId));
        setQuestions(available);
      } catch (err) {
        toast.error('Failed to load question bank');
      } finally {
        setLoading(false);
      }
    };
    fetchBank();
  }, [testId, toast]);

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleLink = async () => {
    if (selectedIds.size === 0) return;
    setSaving(true);
    try {
      await api.post('/admin/questions/link', {
        testId,
        questionIds: Array.from(selectedIds)
      });
      toast.success(`${selectedIds.size} questions added to test`);
      onLinked();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to link questions');
    } finally {
      setSaving(false);
    }
  };

  const filtered = questions.filter(q => {
    const matchSearch = q.question.toLowerCase().includes(search.toLowerCase()) || (q.subject && q.subject.toLowerCase().includes(search.toLowerCase()));
    const matchSubject = selectedSubject ? q.subject === selectedSubject : true;
    return matchSearch && matchSubject;
  });

  return (
    <Modal title="Select from Question Bank" onClose={onClose} maxWidth="max-w-4xl">
      <div className="space-y-4">
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Search by question or subject..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <select
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
          </select>
        </div>

        <div className="max-h-[50vh] overflow-y-auto border border-gray-200 rounded-lg">
          {loading ? (
            <div className="py-12"><Spinner /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">No available questions found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left w-12">
                    <input type="checkbox" 
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={(e) => setSelectedIds(e.target.checked ? new Set(filtered.map(q => q._id)) : new Set())}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Question</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600 w-32">Subject</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600 w-24">Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(q => (
                  <tr key={q._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleSelect(q._id)}>
                    <td className="px-4 py-2">
                      <input type="checkbox" 
                        checked={selectedIds.has(q._id)}
                        onChange={() => {}} // handled by tr click
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <p className="line-clamp-2">{q.question}</p>
                    </td>
                    <td className="px-4 py-2 text-gray-500">{q.subject || '—'}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs capitalize ${q.difficulty === 'easy' ? 'text-green-600' : q.difficulty === 'hard' ? 'text-red-600' : 'text-yellow-600'}`}>
                        {q.difficulty}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <span className="text-sm text-gray-600">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleLink}
              disabled={saving || selectedIds.size === 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              {saving ? 'Adding...' : 'Add to Test'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
