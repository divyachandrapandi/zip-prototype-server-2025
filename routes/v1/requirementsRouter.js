import express from 'express';
import { celebrate } from 'celebrate';
import * as requirementsController from '../../controller/requirementsController.js';
import * as requirementsValidation from '../../validations/requirementsValidation.js';

const router = express.Router();

// GET /api/v1/requirements - get all requirements for that customer including doc
router.get(
    '/',
    // celebrate(requirementsValidation.getRequirements),
    requirementsController.getRequirements
);

// GET /api/v1/requirements/:id - Get requirement by ID
router.get(
    '/:id',
    requirementsController.getRequirementById
);

router.post(
    '/generate',
    requirementsController.generateRequirements
);


// POST /api/v1/requirements/:id/upload - Re-upload requirement file
router.post(
    '/:id/upload',
    requirementsController.upload.single('file'),
    requirementsController.reUploadRequirementFile
);

// GET /api/v1/requirements/:id/download - Download requirement file
router.get(
    '/:id/download',
    requirementsController.downloadRequirementFile
);

// PATCH /api/v1/requirements/:id/status - Update requirement status
router.patch(
    '/:id/status',
    requirementsController.updateRequirementStatus
);

export default router;
