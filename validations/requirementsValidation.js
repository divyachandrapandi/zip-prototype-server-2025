import { Joi, Segments } from "celebrate";

const statuses = ["Submitted", "In Review", "Processed", "Rejected"];
const priorities = ["Low", "Medium", "High", "Critical"];
const roles = ["ADMIN", "USER"];

// GET /requirements?customer=ClientName
export const getRequirements = {
  [Segments.QUERY]: Joi.object({
    customer: Joi.string().optional(),
  }),
};

// UPDATE /update/requirement/:id
export const updateRequirement = {
  [Segments.PARAMS]: Joi.object({
    id: Joi.string().required(),
  }),
  [Segments.BODY]: Joi.object({
    title: Joi.string().optional(),
    description: Joi.string().optional(),
    status: Joi.string().valid(...statuses).optional(),
    priority: Joi.string().valid(...priorities).optional(),
    submittedBy: Joi.string().valid(...roles).optional(),
    fileName: Joi.string().optional(),
    filePath: Joi.string().optional(),
  }).min(1), // require at least one field to update
};
