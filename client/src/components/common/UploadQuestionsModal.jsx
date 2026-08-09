import { useState, useRef } from 'react';
import api from '../../api/axios';
import Modal from '../common/Modal';
import Spinner from '../common/Spinner';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
const STEPS = { UPLOAD: 'upload', PREVIEW: 'preview', DONE: 'done' };
const ACCEPTED = ['.docx', '.pdf'];

export default function UploadQuestionsModal({ testId, subjectName, onClose, onImported }) {
  const [step, setStep]               = useState(STEPS.UPLOAD);
  const [file, setFile]               = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [parsed, setParsed]           = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [extractedVia, setExtractedVia] = useState('');
  const [note, setNote]               = useState('');
  const inputRef = useRef();

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
      if (subjectName) fd.append('subject', subjectName);
      
      const { data } = await api.post('/admin/questions/preview-docx', fd);
      setParsed(data.parsed);
      setParseErrors(data.errors);
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
    setLoading(true); setError('');
    try {
      const payload = { questions: parsed };
      if (testId) payload.testId = testId;
      if (subjectName) payload.subject = subjectName;

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

  const setCorrectAnswer = (qIdx, optIdx) => {
    setParsed(prev => prev.map((q, i) => i === qIdx ? { ...q, correctAnswer: optIdx } : q));
  };

  const removeQuestion = (qIdx) => {
    setParsed(prev => prev.filter((_, i) => i !== qIdx));
  };

  return (
    <Modal title="Upload Questions" onClose={onClose} wide>

      {/* ── STEP 1: Upload ── */}
      {step === STEPS.UPLOAD && (
        <div className="space-y-4">
          {/* AI badge */}
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
            <span className="text-lg">✨</span>
            <p className="text-sm text-indigo-700 font-medium">
              AI-powered extraction — upload any PDF or DOCX. If Gemini AI is unavailable, a smart rule-based parser will be used automatically.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current.click()}
            className="border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-xl p-8 text-center cursor-pointer transition"
          >
            <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {file ? (
              <div>
                <p className="text-sm font-medium text-indigo-600">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 font-medium">Drop file here or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">Supports .pdf and .docx — up to 20 MB</p>
              </div>
            )}
            <input ref={inputRef} type="file" accept=".docx,.pdf" className="hidden" onChange={handleFile} />
          </div>

          {/* Format hint */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-gray-600">Recommended document format for best results:</p>
            <p>1. What is the capital of France?</p>
            <p className="pl-3">A) Paris &nbsp; B) Berlin &nbsp; C) Madrid &nbsp; D) London</p>
            <p className="pl-3">Answer: A</p>
            <p className="pl-3">Explanation: Paris is the capital of France.</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button onClick={handlePreview} disabled={!file || loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition flex items-center gap-2">
              {loading ? <><Spinner size="sm" /> Extracting…</> : '✨ Extract Questions'}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Preview ── */}
      {step === STEPS.PREVIEW && (
        <div className="space-y-4">
          {/* Extraction method banner */}
          {extractedVia === 'fallback' ? (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
              <span className="text-base mt-0.5">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-amber-700">Rule-based parser used</p>
                <p className="text-xs text-amber-600 mt-0.5">{note || 'Gemini AI was unavailable. Review and correct the answers below before importing.'}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <span className="text-base">✅</span>
              <p className="text-sm text-green-700 font-medium">Extracted with Gemini AI — review and import.</p>
            </div>
          )}

          {/* Counts */}
          <div className="flex gap-3">
            <div className="flex-1 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-center">
              <p className="text-2xl font-bold text-green-600">{parsed.length}</p>
              <p className="text-xs text-green-700 mt-0.5">Valid — ready to import</p>
            </div>
            <div className="flex-1 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-center">
              <p className="text-2xl font-bold text-red-500">{parseErrors.length}</p>
              <p className="text-xs text-red-600 mt-0.5">Failed — will be skipped</p>
            </div>
          </div>

          {parsed.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">✅ Valid Questions — click an option to mark it correct</p>
              <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                {parsed.map((q, i) => (
                  <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-gray-800 flex-1">{i + 1}. {q.question}</p>
                      <button
                        onClick={() => removeQuestion(i)}
                        className="text-xs text-red-400 hover:text-red-600 shrink-0 mt-0.5"
                        title="Remove this question"
                      >✕</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {q.options.map((opt, j) => (
                        <button
                          key={j}
                          onClick={() => setCorrectAnswer(i, j)}
                          className={`text-xs px-2 py-1 rounded-lg border transition ${
                            j === q.correctAnswer
                              ? 'bg-green-100 border-green-400 text-green-800 font-bold ring-1 ring-green-400'
                              : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600'
                          }`}
                          title={`Mark "${OPTION_LABELS[j]}" as correct`}
                        >
                          {OPTION_LABELS[j]}: {opt}
                          {j === q.correctAnswer && <span className="ml-1">✓</span>}
                        </button>
                      ))}
                    </div>
                    {q.explanation && <p className="text-xs text-gray-400 mt-1.5 italic">💡 {q.explanation}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {parseErrors.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">❌ Failed Records</p>
              <div className="max-h-32 overflow-y-auto space-y-2 pr-1">
                {parseErrors.map((e, i) => (
                  <div key={i} className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                    <p className="font-medium text-red-700">Q{e.index}: {e.question}</p>
                    <ul className="list-disc list-inside text-xs text-red-500 mt-0.5">
                      {e.errors.map((msg, j) => <li key={j}>{msg}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-between gap-3 pt-1">
            <button onClick={() => setStep(STEPS.UPLOAD)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
              ← Back
            </button>
            <button onClick={handleImport} disabled={parsed.length === 0 || loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition flex items-center gap-2">
              {loading ? <><Spinner size="sm" /> Importing…</> : `Import ${parsed.length} Question${parsed.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Done ── */}
      {step === STEPS.DONE && (
        <div className="text-center py-6 space-y-3">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-800">Import Complete</p>
          <p className="text-sm text-gray-500">
            <span className="font-bold text-green-600">{importResult}</span> question{importResult !== 1 ? 's' : ''} imported successfully.
            {parseErrors.length > 0 && (
              <> <span className="text-red-500 font-medium">{parseErrors.length}</span> record{parseErrors.length !== 1 ? 's' : ''} were skipped.</>
            )}
          </p>
          <button onClick={onClose}
            className="mt-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition">
            Done
          </button>
        </div>
      )}
    </Modal>
  );
}
