import {Segments, Joi} from 'celebrate';


// Validation for GET /api/v1/projects/:id
export const getProjectById = {
  [Segments.PARAMS]: Joi.object({
    id: Joi.string().required()
  })
};

// Validation for GET /api/v1/project-timelines
export const getProjectTimeline = {
  [Segments.QUERY]: Joi.object({
    project_id: Joi.string().required()
  })
};

// Validation for UPDATE /api/v1/update/project/:id
export const updateProject = {
  [Segments.PARAMS]: Joi.object({
    id: Joi.string().required()
  })
};
