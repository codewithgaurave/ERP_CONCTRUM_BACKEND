import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  createFormLink,
  updateFormLink,
  duplicateFormLink,
  getMyFormLinks,
  getFormLinkWithSubmissions,
  toggleFormLink,
  deleteFormLink,
  updateSubmissionStatus,
  getPublicForm,
  submitPublicForm
} from '../controllers/employeeFormLinkController.js';
import { authenticateToken, requireHRManager } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Multer setup for file uploads
const uploadDir = 'uploads/form-files';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    ext ? cb(null, true) : cb(new Error('File type not allowed'));
  }
});

// Public routes (no auth)
router.get('/public/:token', getPublicForm);
router.post('/public/:token/submit', upload.any(), submitPublicForm);

// HR protected routes
router.post('/', authenticateToken, requireHRManager, createFormLink);
router.get('/', authenticateToken, requireHRManager, getMyFormLinks);
router.get('/:id', authenticateToken, requireHRManager, getFormLinkWithSubmissions);
router.put('/:id', authenticateToken, requireHRManager, updateFormLink);
router.post('/:id/duplicate', authenticateToken, requireHRManager, duplicateFormLink);
router.patch('/:id/toggle', authenticateToken, requireHRManager, toggleFormLink);
router.delete('/:id', authenticateToken, requireHRManager, deleteFormLink);
router.patch('/:id/submissions/:submissionId/status', authenticateToken, requireHRManager, updateSubmissionStatus);

export default router;
