import express from 'express';
import {
  getDocuments,
  getDocument,
  createDocument,
  generateDocumentPDF,
  getDocumentTypes,
  exportDocumentsReport
} from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/types', authenticate, getDocumentTypes);
router.get('/', authenticate, getDocuments);
router.get('/export', authenticate, exportDocumentsReport);
router.get('/:id', authenticate, getDocument);
router.get('/:id/pdf', authenticate, generateDocumentPDF);
router.post('/', authenticate, createDocument);

export default router;



