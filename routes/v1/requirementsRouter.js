import express from 'express';
import { celebrate } from 'celebrate';
import * as requirementsController from "../../controller/requirementsController.js";
import * as requirementsValidation from "../../validations/requirementsValidation.js";

const router = express.Router();

// GET /api/v1/requirements - get all requirements for that customer including doc
router.get(
  "/",
  celebrate(requirementsValidation.getRequirements),
  requirementsController.getRequirements
);

// UPDATE /api/v1/update/requirement/:id - Add notification under admin role, add new requirement object to requirements array in json
router.put(
  "/update/:id",
  celebrate(requirementsValidation.updateRequirement),
  requirementsController.updateRequirement
);

export default router;
