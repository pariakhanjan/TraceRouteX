import express from 'express';
import { getPublicStatus } from '../controllers/publicController.js';

const router = express.Router();

// بدون نیاز به authentication
router.get('/status', getPublicStatus);

export default router;
