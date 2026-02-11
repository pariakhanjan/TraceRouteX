import express from 'express';
import { getAllServices, createService, updateServiceStatus } from '../controllers/serviceController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', authenticate, getAllServices);
router.post('/', authenticate, authorize('admin'), createService);
router.patch('/:id/status', authenticate, authorize('operator', 'admin'), updateServiceStatus);

export default router;
