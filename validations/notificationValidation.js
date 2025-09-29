import { Joi, Segments } from "celebrate";

const roles = ["ADMIN", "USER"];
const notificationTypes = [
  "REQ_SUBMITTED",
  "RTM_GENERATED",
  "RTM_APPROVED",
  "RTM_REVIEWED",
  "SYSTEM_UPDATE"
];

// GET /notifications?role=ADMIN|USER
export const getNotifications = {
  [Segments.QUERY]: Joi.object({
    role: Joi.string().valid(...roles).required(),
  }),
};

// POST /notifications
export const createNotification = {
  [Segments.BODY]: Joi.object({
    id: Joi.string().required(), 
    toRole: Joi.string().valid(...roles).required(),
    projectId: Joi.string().required(),
    notification_type: Joi.string().valid(...notificationTypes).required(),
    message: Joi.string().required(),
    createdAt: Joi.date().iso().default(() => new Date().toISOString()),
    read: Joi.boolean().default(false),
    meta: Joi.object().optional().allow(null),
  }),
};

// PUT /notifications/:id (update)
export const updateNotification = {
  [Segments.PARAMS]: Joi.object({
    id: Joi.string().required(),
  }),
  [Segments.BODY]: Joi.object({
    toRole: Joi.string().valid(...roles).optional(),
    projectId: Joi.string().optional(),
    notification_type: Joi.string().valid(...notificationTypes).optional(),
    message: Joi.string().optional(),
    read: Joi.boolean().optional(),
    meta: Joi.object().optional().allow(null),
  }).min(1), // require at least one field to update
};

// DELETE /notifications/:id
export const deleteNotification = {
  [Segments.PARAMS]: Joi.object({
    id: Joi.string().required(),
  }),
};
