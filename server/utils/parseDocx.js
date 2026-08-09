import mammoth from 'mammoth';

const OPTION_RE = /^([A-Da-d])[.)]\s+(.+)$/;
const ANSWER_RE = /^Answer\s*:\s*([A-Da-d])/i;
const EXPLANATION_RE = /^Explanation\s*:/i;

/**
 * Parse a DOCX buffer into question objects.
 * Returns { parsed: [...], errors: [...] }
 */
export async function parseDocxBuffer(buffer) {
  const { value: text } = await mammoth.extractRawText({ buffer });
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  const blocks = [];
  let current = null;

  for (const line of lines) {
    // New question block: "Question N:" or just a line that isn't an option/answer/explanation
    if (/^Question\s+\d+\s*:/i.test(line)) {
      if (current) blocks.push(current);
      current = { questionLines: [], options: [], answer: null, explanation: [] };
      const qText = line.replace(/^Question\s+\d+\s*:\s*/i, '').trim();
      if (qText) current.questionLines.push(qText);
      continue;
    }

    if (!current) continue;

    const optMatch = line.match(OPTION_RE);
    const ansMatch = line.match(ANSWER_RE);

    if (optMatch) {
      current.options.push({ label: optMatch[1].toUpperCase(), text: optMatch[2].trim() });
    } else if (ansMatch) {
      current.answer = ansMatch[1].toUpperCase();
    } else if (EXPLANATION_RE.test(line)) {
      const expText = line.replace(EXPLANATION_RE, '').trim();
      if (expText) current.explanation.push(expText);
    } else if (current.answer !== null) {
      // Lines after Answer: are explanation continuation
      current.explanation.push(line);
    } else if (current.options.length === 0) {
      // Multi-line question text
      current.questionLines.push(line);
    }
  }
  if (current) blocks.push(current);

  const parsed = [];
  const errors = [];

  blocks.forEach((b, i) => {
    const qNum = i + 1;
    const question = b.questionLines.join(' ').trim();
    const options = b.options.map((o) => o.text);
    const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
    const correctAnswer = b.answer ? LABELS.indexOf(b.answer) : -1;
    const explanation = b.explanation.join(' ').trim();

    const errs = [];
    if (!question || question.length < 5) errs.push('Missing or too-short question text');
    if (options.length < 2)              errs.push(`Only ${options.length} option(s) found (need ≥ 2)`);
    if (correctAnswer === -1)            errs.push('Missing or unrecognised Answer');
    if (correctAnswer >= options.length) errs.push('Answer label exceeds number of options');

    if (errs.length) {
      errors.push({ index: qNum, question: question || `(Question ${qNum})`, errors: errs });
    } else {
      parsed.push({ question, options, correctAnswer, explanation });
    }
  });

  return { parsed, errors };
}
