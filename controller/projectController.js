import * as dataHelper from "../helpers/dataHelper.js";

// File names (without .json)
const PROJECTS_FILE = "projects";
const PROJECT_EVENTS_FILE = "project-events";
const NOTIFICATIONS_FILE = "notifications";

// Generate unique IDs
const generateId = (prefix) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// GET /api/v1/projects - Get all projects
export const getProjects = (req, res) => {
  try {
    const projects = dataHelper.getData(PROJECTS_FILE);
      console.log("triggered");
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: "Error fetching projects" });
  }
};

// GET /api/v1/projects/:id - Get project by ID with related events
export const getProjectById = (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    const projects = dataHelper.getData(PROJECTS_FILE);
    const project = projects.find(p => p.id === id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Get related events for this project
    const events = dataHelper.getData(PROJECT_EVENTS_FILE);
    const projectEvents = events.filter(e => e.projectId === id);

    // Return project with events
    const projectWithEvents = {
      ...project,
      events: projectEvents
    };

    res.json(projectWithEvents);
  } catch (error) {
    console.error('Error fetching project by ID:', error);
    res.status(500).json({ message: "Error fetching project" });
  }
};

// GET /api/v1/project-timelines?project_id=:project_id - Get project timeline
export const getProjectTimeline = (req, res) => {
  try {
    const { project_id } = req.query;
    
    if (!project_id) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    const projects = dataHelper.getData(PROJECTS_FILE);
    const project = projects.find(p => p.id === project_id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Get events for this project timeline
    const events = dataHelper.getData(PROJECT_EVENTS_FILE);
    const projectEvents = events.filter(e => e.projectId === project_id);

    // Sort events by timestamp
    const sortedEvents = projectEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({
      projectId: project_id,
      projectName: project.name,
      timeline: sortedEvents
    });
  } catch (error) {
    console.error('Error fetching project timeline:', error);
    res.status(500).json({ message: "Error fetching project timeline" });
  }
};

// UPDATE /api/v1/update/project/:id - Update project and add notification/event
export const updateProject = (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    // Get current data
    const projects = dataHelper.getData(PROJECTS_FILE);
    const events = dataHelper.getData(PROJECT_EVENTS_FILE);
    const notifications = dataHelper.getData(NOTIFICATIONS_FILE);

    // Find the project
    const projectIndex = projects.findIndex(p => p.id === id);
    
    if (projectIndex === -1) {
      return res.status(404).json({ message: "Project not found" });
    }

    const project = projects[projectIndex];

    // Update project phase and phase_type
    project.phase = "Requirements Gathering";
    project.phase_type = "REQ_REQUESTED";
    project.updatedAt = new Date().toISOString();

    // Create new project event
    const newEvent = {
      id: generateId("evt"),
      projectId: id,
      timestamp: new Date().toISOString(),
      projectevent_type: "REQ_REQUESTED",
      actor: "USER",
      messageAdmin: `${project.name} - User requested new requirements.`,
      messageUser: "You have requested new requirements for your project."
    };

    // Create new notification for USER role
    const newNotification = {
      id: generateId("noti"),
      toRole: "USER",
      projectId: id,
      notification_type: "REQ_REQUESTED",
      message: "Your requirements request has been submitted successfully.",
      createdAt: new Date().toISOString(),
      read: false,
      meta: {
        projectId: id,
        phase: "REQ_REQUESTED"
      }
    };

    // Save updated data
    projects[projectIndex] = project;
    events.push(newEvent);
    notifications.push(newNotification);

    dataHelper.setData(PROJECTS_FILE, projects);
    dataHelper.setData(PROJECT_EVENTS_FILE, events);
    dataHelper.setData(NOTIFICATIONS_FILE, notifications);

    res.json({
      message: "Project updated successfully",
      project: project,
      event: newEvent,
      notification: newNotification
    });

  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: "Error updating project" });
  }
};
