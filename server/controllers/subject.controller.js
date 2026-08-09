import Subject from '../models/Subject.js';

// GET /api/admin/subjects
export const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ createdBy: req.admin._id }).sort({ name: 1 });
    res.json({ success: true, subjects });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/admin/subjects
export const createSubject = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Subject name is required' });
    
    const existing = await Subject.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }, createdBy: req.admin._id });
    if (existing) {
      return res.status(400).json({ message: 'Subject already exists' });
    }

    const subject = await Subject.create({
      name: name.trim(),
      createdBy: req.admin._id
    });
    res.status(201).json({ success: true, subject });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/admin/subjects/:id
export const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, createdBy: req.admin._id });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    
    await subject.deleteOne();
    res.json({ success: true, message: 'Subject deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
