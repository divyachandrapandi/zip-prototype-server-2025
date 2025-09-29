import express from 'express';
import {celebrate} from 'celebrate';
import * as notificationController from "../../controller/notificationController.js";
import * as notificationValidation from "../../validations/notificationValidation.js";

const router = express.Router();

router.get(
  "/",
  celebrate(notificationValidation.getNotifications),
  notificationController.getNotifications
);

router.post('/read/:id', notificationController.markNotificationRead);

/* for future use
router.post(
  "/notifications",
  celebrate(notificationValidation.createNotification),
  notificationController.createNotification
);
*/

export default router;