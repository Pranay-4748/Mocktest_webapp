export const validateTest = (req, res, next) => {
  const { title, duration, passingMarks, totalMarks } = req.body;
  const errors = [];

  if (!title || title.trim().length < 3)
    errors.push('Title must be at least 3 characters');

  if (!duration || isNaN(duration) || Number(duration) < 1)
    errors.push('Duration must be at least 1 minute');

  if (totalMarks === undefined || isNaN(totalMarks) || Number(totalMarks) < 1)
    errors.push('Total marks must be at least 1');

  if (passingMarks === undefined || isNaN(passingMarks) || Number(passingMarks) < 0)
    errors.push('Passing marks cannot be negative');

  if (Number(passingMarks) > Number(totalMarks))
    errors.push('Passing marks cannot exceed total marks');

  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  next();
};
