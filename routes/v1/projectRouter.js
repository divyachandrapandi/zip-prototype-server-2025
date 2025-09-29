import express from 'express';
import { celebrate } from 'celebrate';
import * as projectController from '../../controller/projectController.js';
import * as projectValidation from '../../validations/projectValidation.js';

const router = express.Router();

// GET /api/v1/projects - Get all projects
router.get('/', projectController.getProjects);

// GET /api/v1/projects/:id - Get project by ID with related events
router.get(
  '/:id',
  celebrate(projectValidation.getProjectById),
  projectController.getProjectById
);

// UPDATE /api/v1/update/project/:id - Update project and add notification/event
router.put(
  '/update/:id',
  celebrate(projectValidation.updateProject),
  projectController.updateProject
);

export default router;
