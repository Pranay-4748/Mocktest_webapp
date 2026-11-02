import Subject from '../models/Subject.js';
import Question from '../models/Question.js';

// GET /api/admin/subjects/:id/topics
export const getTopicsBySubject = async (req, res) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, createdBy: req.admin._id });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json({ success: true, topics: subject.topics.sort() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/admin/subjects/:id/topics
export const addTopic = async (req, res) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, createdBy: req.admin._id });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Topic name is required' });

    const trimmed = name.trim();
    if (subject.topics.some(t => t.toLowerCase() === trimmed.toLowerCase()))
      return res.status(400).json({ message: 'Topic already exists' });

    subject.topics.push(trimmed);
    await subject.save();
    res.status(201).json({ success: true, topics: subject.topics.sort() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/admin/subjects/:id/topics/:topic
export const deleteTopic = async (req, res) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, createdBy: req.admin._id });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    const topic = decodeURIComponent(req.params.topic);
    subject.topics = subject.topics.filter(t => t !== topic);
    await subject.save();
    await Question.updateMany(
      { createdBy: req.admin._id, subject: subject.name, topic },
      { $set: { topic: '' } }
    );
    res.json({ success: true, message: 'Topic deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/subjects/:id/topics/:topic
export const renameTopic = async (req, res) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, createdBy: req.admin._id });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    const oldTopic = decodeURIComponent(req.params.topic);
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'New topic name is required' });

    const trimmed = name.trim();
    subject.topics = subject.topics.map(t => t === oldTopic ? trimmed : t);
    await subject.save();
    await Question.updateMany(
      { createdBy: req.admin._id, subject: subject.name, topic: oldTopic },
      { $set: { topic: trimmed } }
    );
    res.json({ success: true, message: 'Topic renamed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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
