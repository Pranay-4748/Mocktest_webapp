export const validateQuestion = (req, res, next) => {
  const { question, options, correctAnswer, marks } = req.body;
  const errors = [];

  if (!question || question.trim().length < 5)
    errors.push('Question must be at least 5 characters');

  if (!Array.isArray(options) || options.length !== 4)
    errors.push('Exactly 4 options are required');

  if (options?.some((o) => !o || !o.trim()))
    errors.push('All options must be non-empty');

  const ca = Number(correctAnswer);
  if (isNaN(ca) || ca < 0 || ca > 3)
    errors.push('Correct answer must be index 0–3');

  if (marks !== undefined && (isNaN(Number(marks)) || Number(marks) < 0))
    errors.push('Marks cannot be negative');

  if (errors.length) return res.status(400).json({ message: errors[0], errors });
  next();
};
