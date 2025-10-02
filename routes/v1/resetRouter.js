import express from 'express';
import {resetData, getResetStatus} from '../../controller/resetController.js';

const router = express.Router();

/**
 * POST /api/v1/reset-data
 * Reset all data files by copying from data-copy to data
 */
router.post('/', resetData);

/**
 * GET /api/v1/reset-data/status
 * Get status of data files before resetting
 */
router.get('/status', getResetStatus);

export default router;