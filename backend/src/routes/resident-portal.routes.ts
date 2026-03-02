import express from 'express';
import {
  residentLogin,
  setResidentPassword,
  getMyDocuments,
  getMyRequests,
  createDocumentRequest,
  getRequestDetails,
  submitComplaint,
  getMyComplaints,
  getMyDirectMessages,
  markMyDirectMessageViewed,
  getPublicAnnouncements,
  getDocumentTypes,
} from '../controllers/resident-portal.controller';
import { authenticateResident } from '../middleware/resident-auth.middleware';

const router = express.Router();

// Public routes
router.post('/login', residentLogin);
router.get('/announcements', getPublicAnnouncements);
router.get('/document-types', getDocumentTypes);

// Protected routes (require resident authentication)
router.use(authenticateResident);

router.put('/password', setResidentPassword);
router.get('/documents', getMyDocuments);
router.get('/requests', getMyRequests);
router.get('/requests/:id', getRequestDetails);
router.post('/requests', createDocumentRequest);
router.get('/complaints', getMyComplaints);
router.post('/complaints', submitComplaint);
router.get('/messages', getMyDirectMessages);
router.patch('/messages/:id/view', markMyDirectMessageViewed);

export default router;

