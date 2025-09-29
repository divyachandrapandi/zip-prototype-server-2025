import * as dataHelper from "../helpers/dataHelper.js";

// File name (without .json)
const FILE_NAME = "notifications";

// GET notifications filtered by role
export const getNotifications = (req, res) => {
  const { role } = req.query;

  // load notifications.json
  const notifications = dataHelper.getData(FILE_NAME);

  // filter by role
  const filtered = notifications.filter(n => n.toRole === role);

  res.json(filtered);
};

// Marks a notification as read by id
export const markNotificationRead = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Notification id is required" });
  }

  const notifications = dataHelper.getData("notifications");
  const index = notifications.findIndex(n => n.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Notification not found" });
  }

  notifications[index].read = true;
  dataHelper.setData("notifications", notifications);

  res.json({ message: "Notification marked as read", notification: notifications[index] });
};
