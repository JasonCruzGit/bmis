import express from 'express';
import { getDirectMessages, sendDirectMessage } from '../controllers/direct-message.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadMultiple } from '../middleware/upload.middleware';

const router = express.Router();

router.get('/', authenticate, getDirectMessages);
router.post('/', authenticate, uploadMultiple('attachments', 5), sendDirectMessage);

export default router;

