import * as dataHelper from "../helpers/dataHelper.js";

// File name (without .json)
const FILE_NAME = "requirements";
const NOTIFICATIONS_FILE = "notifications";
const PROJECT_EVENTS_FILE = "project-events";

// Generate unique IDs
const generateId = (prefix) => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};


// GET all requirements for a customer
export const getRequirements = (req, res) => {
  const { clientName } = req.query;

  // Load requirements.json
  const requirements = dataHelper.getData(FILE_NAME);
    console.log(requirements);
  // Filter by customer if provided
  // let filtered = requirements;
  // if (clientName) {
  //   filtered = requirements.filter(r => r.projectId === clientName);
  // }

  res.json(requirements);
};


export const generateRequirements =async (req,res) => {
    try {
        const { projectId, client } = req.body;

        // Validate required fields
        if (!projectId || !client) {
            return res.status(400).json({
                message: "projectId and client are required"
            });
        }

        // 1. Create notification for ADMIN
        const notification = {
            id: generateId("notif"),
            toRole: "ADMIN",
            projectId: projectId,
            notification_type: "REQ_SUBMITTED",
            message: `Requirement Files has been submitted by ${client}`,
            createdAt: new Date().toISOString(),
            read: false,
            meta: {
                requirementId: generateId("req"),
                client: client
            }
        };

        // 2. Create project event
        const projectEvent = {
            id: generateId("evt"),
            projectId: projectId,
            timestamp: new Date().toISOString(),
            projectevent_type: "REQ_SUBMITTED",
            actor: "ADMIN",
            messageAdmin: `Requirement submitted by ${client} Team.`,
            messageUser: "Your requirement has been submitted successfully."
        };

        // 3. Load existing data
        const notifications = dataHelper.getData(NOTIFICATIONS_FILE);
        const projectEvents = dataHelper.getData(PROJECT_EVENTS_FILE);

        // 4. Add new records
        notifications.push(notification);
        projectEvents.push(projectEvent);

        // 5. Save updated data
        dataHelper.setData(NOTIFICATIONS_FILE, notifications);
        dataHelper.setData(PROJECT_EVENTS_FILE, projectEvents);

        // 6. Send success response
        res.status(201).json({
            message: "Requirement generated successfully"
        });

    } catch (error) {
        console.error('Error generating requirements:', error);
        res.status(500).json({
            message: "Error generating requirements",
            error: error.message
        });
    }
}