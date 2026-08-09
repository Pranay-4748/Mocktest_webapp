import { GoogleGenerativeAI } from '@google/generative-ai';

// Rule-based fallback parser when Gemini API is unavailable or rate-limited
export function parseWithRules(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const questions = [];
  let currentQ = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect question start
    // Matches: "1. What...", "Q1. What...", "Question 1: ...", "12) ..."
    const qMatch = line.match(/^(?:(?:Q|Question)\s*)?(\d+)[.)\]\s-]+\s*(.*)/i);
    if (qMatch) {
      if (currentQ && currentQ.question && currentQ.options.length >= 2) {
        questions.push(currentQ);
      }
      currentQ = {
        question: qMatch[2].trim(),
        options: [],
        correctAnswer: 0,
        explanation: '',
        index: parseInt(qMatch[1], 10)
      };
      continue;
    }

    if (!currentQ) continue;

    // Detect options
    // Matches: "A) Paris", "b. Berlin", "(c) Madrid", "[d] London", "A - Delhi"
    const optMatch = line.match(/^[(]?([a-fA-F]|\d+)[)\]\s.-]+\s*(.*)/);
    if (optMatch && currentQ.options.length < 6) {
      const label = optMatch[1].toUpperCase();
      const text = optMatch[2].trim();
      
      // Prevent false positives (e.g., "Answer: A" matching option)
      if (line.toLowerCase().startsWith('ans') || line.toLowerCase().startsWith('explanation')) {
        // Do not treat as option
      } else {
        currentQ.options.push(text);
        continue;
      }
    }

    // Detect answer
    // Matches: "Answer: B", "Ans: (c)", "Correct Answer - A"
    const ansMatch = line.match(/^(?:Ans(?:wer)?|Correct(?:\s+Answer)?)[:\s-]+(?:[(]?([a-fA-F])(?:[)]|\s|$)|(\d+))/i);
    if (ansMatch) {
      const ansChar = (ansMatch[1] || ansMatch[2] || '').toUpperCase();
      if (ansChar) {
        if (ansChar >= 'A' && ansChar <= 'F') {
          currentQ.correctAnswer = ansChar.charCodeAt(0) - 65; // A=0, B=1, ...
        } else {
          const val = parseInt(ansChar, 10);
          if (!isNaN(val)) {
            currentQ.correctAnswer = val - 1; // 1-based index to 0-based
          }
        }
      }
      continue;
    }

    // Detect explanation
    // Matches: "Explanation: ...", "Exp: ..."
    const expMatch = line.match(/^(?:Explanation|Exp|💡)[:\s-]+\s*(.*)/i);
    if (expMatch) {
      currentQ.explanation = expMatch[1].trim();
      // Gather any subsequent lines that are not new questions or options
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j];
        if (nextLine.match(/^(?:(?:Q|Question)\s*)?(\d+)[.)\]\s-]+/i) || nextLine.match(/^[(]?([a-fA-F]|\d+)[)\]\s.-]+/)) {
          break;
        }
        currentQ.explanation += ' ' + nextLine.trim();
        j++;
      }
      i = j - 1;
      continue;
    }

    // If it's a general line following the question and before options, append to question text
    if (currentQ.options.length === 0 && !line.match(/^(?:Ans|Correct|Explanation)/i)) {
      currentQ.question += ' ' + line;
    }
  }

  // Push final question
  if (currentQ && currentQ.question && currentQ.options.length >= 2) {
    questions.push(currentQ);
  }

  // Map to standardized format
  return questions.map(q => ({
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer >= 0 && q.correctAnswer < q.options.length ? q.correctAnswer : 0,
    explanation: q.explanation || ''
  }));
}

const SYSTEM_PROMPT = `You are an expert MCQ question extractor. Given raw text from a document, extract ALL multiple choice questions.
Return a valid JSON object matching the requested schema. Each question must include a question text, options array, a zero-based correctAnswer index, and an explanation.`;

export async function parseWithAI(rawText) {
  let extractedVia = 'AI';
  let note = '';

  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is not set. Falling back to rule-based parser.');
    const parsed = parseWithRules(rawText);
    return { parsed, errors: [], extractedVia: 'fallback', note: 'GEMINI_API_KEY not set. Extracted via local rule-based parser.' };
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const responseSchema = {
    type: "object",
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            options: {
              type: "array",
              items: { type: "string" }
            },
            correctAnswer: { type: "integer" },
            explanation: { type: "string" }
          },
          required: ["question", "options", "correctAnswer", "explanation"]
        }
      }
    },
    required: ["questions"]
  };

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const MAX_CHARS = 30000;
    const chunks = [];
    for (let i = 0; i < rawText.length; i += MAX_CHARS) {
      chunks.push(rawText.slice(i, i + MAX_CHARS));
    }

    const allParsed = [];

    for (const chunk of chunks) {
      const prompt = `${SYSTEM_PROMPT}\n\n---DOCUMENT TEXT---\n${chunk}`;
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const obj = JSON.parse(text);
      if (obj && Array.isArray(obj.questions)) {
        allParsed.push(...obj.questions);
      }
    }

    // Validate and separate good vs bad
    const parsed = [];
    const errors = [];

    allParsed.forEach((q, i) => {
      const errs = [];
      if (!q.question || q.question.trim().length < 5) errs.push('Missing or too-short question text');
      if (!Array.isArray(q.options) || q.options.length < 2) errs.push('Need at least 2 options');
      if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer >= (q.options?.length || 0))
        errs.push('Invalid correctAnswer index');

      if (errs.length) {
        errors.push({ index: i + 1, question: q.question || `(Question ${i + 1})`, errors: errs });
      } else {
        parsed.push({
          question: q.question.trim(),
          options: q.options.map((o) => String(o).trim()),
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
        });
      }
    });

    return { parsed, errors, extractedVia, note };
  } catch (err) {
    console.error('Gemini extraction failed:', err.message, '- Falling back to rule-based parser.');
    const parsed = parseWithRules(rawText);
    return {
      parsed,
      errors: [],
      extractedVia: 'fallback',
      note: `Gemini API returned an error: ${err.message}. Successfully extracted using backup rule-based parser.`
    };
  }
}
