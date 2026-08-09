import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`),
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|pdf/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  ext && mime ? cb(null, true) : cb(new Error('Invalid file type'), false);
};

const docxOrPdfFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isDocx = ext === '.docx' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const isPdf  = ext === '.pdf'  || file.mimetype === 'application/pdf';
  isDocx || isPdf ? cb(null, true) : cb(new Error('Only .docx or .pdf files are allowed'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
export const uploadDocx = multer({ storage: multer.memoryStorage(), fileFilter: docxOrPdfFilter, limits: { fileSize: 20 * 1024 * 1024 } });

export default upload;
