import * as dataHelper from "../helpers/dataHelper.js";

// File name (without .json)
const FILE_NAME = "requirements";

// GET all requirements for a customer
export const getRequirements = (req, res) => {
  const { customer } = req.query;

  // Load requirements.json
  const requirements = dataHelper.getData(FILE_NAME);

  // Filter by customer if provided
  let filtered = requirements;
  if (customer) {
    filtered = requirements.filter(r => r.client === customer);
  }

  res.json(filtered);
};

// UPDATE requirement by ID - Add notification under admin role and add new requirement object
export const updateRequirement = (req, res) => {
  const { id } = req.params;
  console.log('THE REQUEST BODY IS ', req);
  const { title, description, status, priority, submittedBy, fileName, filePath } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Requirement id is required" });
  }

  // Load requirements data
  const requirements = dataHelper.getData(FILE_NAME);
  
  // Find the project that contains the requirement
  let projectIndex = -1;
  let requirementIndex = -1;
  
  for (let i = 0; i < requirements.length; i++) {
    const reqIndex = requirements[i].requirements.findIndex(r => r.id === id);
    if (reqIndex !== -1) {
      projectIndex = i;
      requirementIndex = reqIndex;
      break;
    }
  }

  if (projectIndex === -1 || requirementIndex === -1) {
    return res.status(404).json({ message: "Requirement not found" });
  }

  // Update the requirement
  const updatedRequirement = {
    ...requirements[projectIndex].requirements[requirementIndex],
    ...(title && { title }),
    ...(description && { description }),
    ...(status && { status }),
    ...(priority && { priority }),
    ...(submittedBy && { submittedBy }),
    ...(fileName && { fileName }),
    ...(filePath && { filePath }),
    updatedAt: new Date().toISOString()
  };

  requirements[projectIndex].requirements[requirementIndex] = updatedRequirement;

  // Save updated requirements
  dataHelper.setData(FILE_NAME, requirements);

  // Create notification for admin role
  const notifications = dataHelper.getData("notifications");
  const newNotification = {
    id: `notif-${Date.now()}`,
    toRole: "ADMIN",
    projectId: requirements[projectIndex].projectId,
    notification_type: "REQ_SUBMITTED",
    message: `Requirement "${updatedRequirement.title}" has been updated by ${submittedBy || 'ADMIN'}`,
    createdAt: new Date().toISOString(),
    read: false,
    meta: {
      requirementId: id,
      client: requirements[projectIndex].client
    }
  };

  notifications.push(newNotification);
  dataHelper.setData("notifications", notifications);

  res.json({ 
    message: "Requirement updated successfully", 
    requirement: updatedRequirement,
    notification: newNotification
  });
};
