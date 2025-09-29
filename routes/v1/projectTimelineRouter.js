import express from 'express';
import { celebrate } from 'celebrate';
import * as projectController from '../../controller/projectController.js';
import * as projectValidation from '../../validations/projectValidation.js';

const router = express.Router();

// GET /api/v1/project-timelines?project_id=:project_id - Get project timeline
router.get(
  '/',
  celebrate(projectValidation.getProjectTimeline),
  projectController.getProjectTimeline
);

export default router;
