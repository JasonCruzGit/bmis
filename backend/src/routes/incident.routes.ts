import express from 'express';
import {
  getIncidents,
  getIncident,
  createIncident,
  updateIncident,
  updateIncidentStatus,
  exportIncidentsReport
} from '../controllers/incident.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadMultiple } from '../middleware/upload.middleware';

const router = express.Router();

router.get('/', authenticate, getIncidents);
router.get('/export', authenticate, exportIncidentsReport);
router.get('/:id', authenticate, getIncident);
router.post('/', authenticate, uploadMultiple('attachments', 10), createIncident);
router.put('/:id', authenticate, uploadMultiple('attachments', 10), updateIncident);
router.patch('/:id/status', authenticate, updateIncidentStatus);

export default router;



