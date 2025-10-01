import express from 'express';
import { celebrate } from 'celebrate';
import * as requirementsController from '../../controller/requirementsController.js';
import * as requirementsValidation from '../../validations/requirementsValidation.js';

const router = express.Router();

// GET /api/v1/requirements - get all requirements for that customer including doc
router.get(
    '/',
    celebrate(requirementsValidation.getRequirements),
    requirementsController.getRequirements
);

router.post(
    '/generate',
    requirementsController.generateRequirements
);


export default router;
