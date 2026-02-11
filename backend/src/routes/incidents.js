import express from 'express';
import { getAllIncidents, getIncidentById, createIncident } from '../controllers/incidentController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', getAllIncidents);
router.get('/:id', getIncidentById);
router.post('/', authenticate, authorize('engineer', 'admin'), createIncident);

export default router;
