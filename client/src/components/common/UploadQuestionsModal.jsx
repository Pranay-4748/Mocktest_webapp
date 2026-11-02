import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import Modal from '../common/Modal';
import Spinner from '../common/Spinner';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
const STEPS = { UPLOAD: 'upload', PREVIEW: 'preview', DONE: 'done' };
const ACCEPTED = ['.docx', '.pdf'];

export default function UploadQuestionsModal({ testId, onClose, onImported }) {
  const [step, setStep]                 = useState(STEPS.UPLOAD);
  const [file, setFile]                 = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [parsed, setParsed]             = useState([]);
  const [parseErrors, setParseErrors]   = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [extractedVia, setExtractedVia] = useState('');
  const [note, setNote]                 = useState('');
  const [subjects, setSubjects]         = useState([]);
  const [topicsCache, setTopicsCache]   = useState({});
  const inputRef = useRef();

  useEffect(() => {
    api.get('/admin/subjects').then(({ data }) => setSubjects(data.subjects || [])).catch(() => {});
  }, []);

  const fetchTopicsForSubject = useCallback(async (subjectId) => {
    if (!subjectId || topicsCache[subjectId] !== undefined) return;
    try {
      const { data } = await api.get(`/admin/subjects/${subjectId}/topics`);
      setTopicsCache(prev => ({ ...prev, [subjectId]: data.topics || [] }));
    } catch {}
  }, [topicsCache]);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (ACCEPTED.includes(`.${ext}`)) { setFile(f); setError(''); }
    else setError('Please select a .docx or .pdf file');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) { inputRef.current.files = e.dataTransfer.files; handleFile({ target: { files: [f] } }); }
  };

  const handlePreview = async () => {
    if (!file) return setError('Select a file first');
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (testId) fd.append('testId', testId);
      const { data } = await api.post('/admin/questions/preview-docx', fd);
      setParsed((data.parsed || []).map(q => ({ ...q, _subjectId: '', _topic: '', _newTopic: '' })));
      setParseErrors(data.errors || []);
      setExtractedVia(data.extractedVia || 'AI');
      setNote(data.note || '');
      setStep(STEPS.PREVIEW);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to parse file');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    const missing = parsed.some(q => {
      const topicVal = q._topic === '__new__' ? q._newTopic?.trim() : q._topic;
      return !q._subjectId || !topicVal;
    });
    if (missing) return setError('Please select a subject and topic for every question.');

    setLoading(true); setError('');
    try {
      const questions = parsed.map(q => ({
        question:      q.question,
        options:       q.options,
        correctAnswer: q.correctAnswer,
        explanation:   q.explanation || '',
        marks:         q.marks || 1,
        difficulty:    q.difficulty || 'medium',
        subject:       subjects.find(s => s._id === q._subjectId)?.name || '',
        topic:         q._topic === '__new__' ? (q._newTopic || '').trim() : q._topic,
      }));

      const payload = { questions };
      if (testId) payload.testId = testId;

      const { data } = await api.post('/admin/questions/import-docx', payload);
      setImportResult(data.imported);
      setStep(STEPS.DONE);
      onImported?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const setCorrectAnswer = (qIdx, optIdx) =>
    setParsed(prev => prev.map((q, i) => i === qIdx ? { ...q, correctAnswer: optIdx } : q));

  const removeQuestion = (qIdx) =>
    setParsed(prev => prev.filter((_, i) => i !== qIdx));

  const setQuestionField = (qIdx, field, value) => {
    setParsed(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const updated = { ...q, [field]: value };
      if (field === '_subjectId') { updated._topic = ''; updated._newTopic = ''; }
      return updated;
    }));
    if (field === '_subjectId' && value) fetchTopicsForSubject(value);
  };

  const completedCount = parsed.filter(q => {
    const topicVal = q._topic === '__new__' ? q._newTopic?.trim() : q._topic;
    return q._subjectId && topicVal;
  }).length;
  const canImport = parsed.length > 0 && completedCount === parsed.length;

  return (
    <Modal title="Upload Questions" onClose={onClose} wide>

      {/* ── STEP 1: Upload ── */}
      {step === STEPS.UPLOAD && (
        <div className="space-y-5">
          {/* AI badge */}
          <div className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-3">
            <span className="text-xl mt-0.5">✨</span>
            <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
              AI-powered extraction — upload any PDF or DOCX. If Gemini AI is unavailable, a smart rule-based parser will be used automatically.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
              file
                ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30'
                : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/40'
            }`}
          >
            <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center ${
              file ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              <svg className={`w-7 h-7 ${file ? 'text-indigo-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            {file ? (
              <div>
                <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{file.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Drop file here or click to browse</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Supports .pdf and .docx — up to 20 MB</p>
              </div>
            )}
            <input ref={inputRef} type="file" accept=".docx,.pdf" className="hidden" onChange={handleFile} />
          </div>

          {/* Format hint */}
          <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Recommended format</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">1. What is the capital of France?</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 pl-4">A) Paris &nbsp; B) Berlin &nbsp; C) Madrid &nbsp; D) London</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 pl-4">Answer: A</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 pl-4">Explanation: Paris is the capital of France.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button onClick={onClose} className="btn-secondary px-5 py-2.5">Cancel</button>
            <button onClick={handlePreview} disabled={!file || loading}
              className="btn-primary px-5 py-2.5 disabled:opacity-50">
              {loading ? <><Spinner size="sm" /> Extracting…</> : '✨ Extract Questions'}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Preview ── */}
      {step === STEPS.PREVIEW && (
        <div className="space-y-4">

          {/* Extraction banner */}
          {extractedVia === 'fallback' ? (
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
              <span className="text-base mt-0.5">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Rule-based parser used</p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">{note || 'Gemini AI was unavailable. Review and correct answers before importing.'}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
              <span className="text-base">✅</span>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                Extracted with Gemini AI — assign subject &amp; topic to each question, then import.
              </p>
            </div>
          )}

          {/* Stats + progress */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{parsed.length}</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-0.5 font-medium">Extracted</p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{completedCount}</p>
              <p className="text-xs text-indigo-700 dark:text-indigo-500 mt-0.5 font-medium">Tagged</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-bold text-red-500 dark:text-red-400">{parseErrors.length}</p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-0.5 font-medium">Skipped</p>
            </div>
          </div>

          {/* Progress bar */}
          {parsed.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Tagging progress
                </span>
                <span className={`text-xs font-semibold ${canImport ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                  {completedCount} / {parsed.length} complete
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${canImport ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                  style={{ width: `${parsed.length ? (completedCount / parsed.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Question cards */}
          {parsed.length > 0 && (
            <div className="space-y-3 max-h-[48vh] overflow-y-auto pr-1">
              {parsed.map((q, i) => {
                const qTopics = topicsCache[q._subjectId] || [];
                const isComplete = q._subjectId && (q._topic === '__new__' ? q._newTopic?.trim() : q._topic);
                return (
                  <div key={i} className={`rounded-2xl border-2 transition-all ${
                    isComplete
                      ? 'border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-900'
                      : 'border-orange-200 dark:border-orange-800 bg-orange-50/60 dark:bg-orange-950/20'
                  }`}>
                    {/* Card header */}
                    <div className={`flex items-center justify-between px-4 py-2.5 rounded-t-2xl border-b ${
                      isComplete
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                        : 'bg-orange-100/70 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isComplete
                            ? 'bg-emerald-500 text-white'
                            : 'bg-orange-400 text-white'
                        }`}>{i + 1}</span>
                        <span className={`text-xs font-semibold ${
                          isComplete ? 'text-emerald-700 dark:text-emerald-400' : 'text-orange-700 dark:text-orange-400'
                        }`}>
                          {isComplete ? '✓ Tagged' : '⚠ Needs subject & topic'}
                        </span>
                      </div>
                      <button onClick={() => removeQuestion(i)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                        title="Remove question">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="px-4 py-3 space-y-3">
                      {/* Question text */}
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                        {q.question}
                      </p>

                      {/* Subject + Topic dropdowns */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                            Subject <span className="text-red-500 normal-case font-bold">*</span>
                          </label>
                          <select
                            value={q._subjectId}
                            onChange={e => setQuestionField(i, '_subjectId', e.target.value)}
                            className={`w-full px-3 py-2 text-sm rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 ${
                              !q._subjectId
                                ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20'
                                : 'border-emerald-300 dark:border-emerald-700'
                            }`}
                          >
                            <option value="">— Select subject —</option>
                            {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                            Topic <span className="text-red-500 normal-case font-bold">*</span>
                          </label>
                          <select
                            value={q._topic}
                            onChange={e => setQuestionField(i, '_topic', e.target.value)}
                            disabled={!q._subjectId}
                            className={`w-full px-3 py-2 text-sm rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                              q._subjectId && !q._topic
                                ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20'
                                : q._topic
                                  ? 'border-emerald-300 dark:border-emerald-700'
                                  : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            <option value="">— Select topic —</option>
                            {qTopics.map(t => <option key={t} value={t}>{t}</option>)}
                            <option value="__new__">+ New topic…</option>
                          </select>
                          {q._topic === '__new__' && (
                            <input
                              placeholder="Type new topic name…"
                              value={q._newTopic || ''}
                              onChange={e => setQuestionField(i, '_newTopic', e.target.value)}
                              className="mt-2 w-full px-3 py-2 text-sm rounded-xl border-2 border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/30 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
                            />
                          )}
                        </div>
                      </div>

                      {/* Answer options */}
                      <div>
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                          Options — click to mark correct
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {q.options.map((opt, j) => (
                            <button key={j} onClick={() => setCorrectAnswer(i, j)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-all ${
                                j === q.correctAnswer
                                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-200 dark:shadow-emerald-900'
                                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400'
                              }`}
                              title={`Mark ${OPTION_LABELS[j]} as correct`}
                            >
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                j === q.correctAnswer ? 'bg-white/30 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                              }`}>{OPTION_LABELS[j]}</span>
                              {opt}
                              {j === q.correctAnswer && <span className="ml-0.5">✓</span>}
                            </button>
                          ))}
                        </div>
                      </div>

                      {q.explanation && (
                        <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl px-3 py-2">
                          <span className="text-sm mt-0.5">💡</span>
                          <p className="text-xs text-blue-700 dark:text-blue-400 italic leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Failed records */}
          {parseErrors.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">❌ Failed Records</p>
              <div className="max-h-32 overflow-y-auto space-y-2 pr-1">
                {parseErrors.map((e, i) => (
                  <div key={i} className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2.5">
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">Q{e.index}: {e.question}</p>
                    <ul className="list-disc list-inside text-xs text-red-500 dark:text-red-500 mt-1 space-y-0.5">
                      {e.errors.map((msg, j) => <li key={j}>{msg}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex justify-between items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button onClick={() => setStep(STEPS.UPLOAD)} className="btn-secondary px-5 py-2.5">
              ← Back
            </button>
            <div className="flex items-center gap-3">
              {!canImport && parsed.length > 0 && (
                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                  {parsed.length - completedCount} question{parsed.length - completedCount !== 1 ? 's' : ''} still need tagging
                </p>
              )}
              <button
                onClick={handleImport}
                disabled={!canImport || loading}
                className="btn-primary px-6 py-2.5 disabled:opacity-50"
                title={!canImport ? 'Tag all questions with subject & topic first' : ''}
              >
                {loading
                  ? <><Spinner size="sm" /> Importing…</>
                  : `Import ${parsed.length} Question${parsed.length !== 1 ? 's' : ''}`
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Done ── */}
      {step === STEPS.DONE && (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">Import Complete!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">{importResult}</span> question{importResult !== 1 ? 's' : ''} imported successfully.
              {parseErrors.length > 0 && (
                <> <span className="text-red-500 font-medium">{parseErrors.length}</span> record{parseErrors.length !== 1 ? 's' : ''} were skipped.</>
              )}
            </p>
          </div>
          <button onClick={onClose} className="btn-primary px-8 py-2.5 mt-2">
            Done
          </button>
        </div>
      )}
    </Modal>
  );
}
