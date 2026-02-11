import express from 'express';
import {
    getAllIncidents,
    getIncidentById,
    createIncident,
    addIncidentUpdate,
    getIncidentUpdates,
    resolveIncident
} from '../controllers/incidentController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { togglePublish } from '../controllers/incidentController.js';


const router = express.Router();

// همه کاربران احراز‌شده می‌توانند لیست ببینند
router.get('/', authenticate, getAllIncidents);
router.get('/:id', authenticate, getIncidentById);

// فقط engineer و admin می‌توانند رخداد ثبت کنند
router.post('/', authenticate, authorize('engineer', 'admin'), createIncident);

// فقط engineer و admin می‌توانند update اضافه کنند
router.post('/:id/updates', authenticate, authorize('engineer', 'admin'), addIncidentUpdate);
router.get('/:id/updates', authenticate, getIncidentUpdates);

// فقط engineer و admin می‌توانند رخداد را حل کنند
router.patch('/:id/resolve', authenticate, authorize('engineer', 'admin'), resolveIncident);

// ✅ Route برای تغییر وضعیت انتشار (فقط admin)
router.patch('/:id/publish', authenticate, togglePublish);

export default router;
