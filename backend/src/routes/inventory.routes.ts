import express from 'express';
import {
  getInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  addInventoryLog,
  getInventoryLogs,
  generateQRCode,
  getInventoryItemByQRCode
} from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadSingle } from '../middleware/upload.middleware';

const router = express.Router();

// Public route (no auth required)
router.get('/qr/:qrCode', getInventoryItemByQRCode);

// Protected routes
router.get('/', authenticate, getInventoryItems);
router.get('/:id', authenticate, getInventoryItem);
router.get('/:id/logs', authenticate, getInventoryLogs);
router.get('/:id/qrcode', authenticate, generateQRCode);
router.post('/', authenticate, uploadSingle('photo'), createInventoryItem);
router.post('/:id/logs', authenticate, addInventoryLog);
router.put('/:id', authenticate, uploadSingle('photo'), updateInventoryItem);
router.delete('/:id', authenticate, deleteInventoryItem);

export default router;



