import * as dataHelper from "../helpers/dataHelper.js";
import path from 'path';
import fs from 'fs';
import multer from 'multer';

// File name (without .json)
const REQUIREMENTS_FILE = "requirements";
const NOTIFICATIONS_FILE = "notifications";
const PROJECT_EVENTS_FILE = "project-events";

// Generate unique IDs
const generateId = (prefix) => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'files', 'requirements');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept only specific file types
    const allowedTypes = ['.xlsx', '.docx', '.csv', '.pdf', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only .xlsx, .docx, .csv, .pdf, and .txt files are allowed.'));
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});




// GET all requirements for a customer
export const getRequirements = (req, res) => {
    try {
        const requirementsData = dataHelper.getData(REQUIREMENTS_FILE);

        // Flatten the requirements array from all projects
        let allRequirements = [];

        if (Array.isArray(requirementsData)) {
            allRequirements = requirementsData.flatMap(project =>
                project.requirements || []
            );
        }

        res.json(requirementsData);
    } catch (error) {
        console.error('Error fetching requirements:', error);
        res.status(500).json({ message: "Error fetching requirements" });
    }
};

// GET requirement by ID
export const getRequirementById = (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Requirement ID is required" });
        }

        const requirementsData = dataHelper.getData(REQUIREMENTS_FILE);

        // Find requirement across all projects
        let foundRequirement = null;

        if (Array.isArray(requirementsData)) {
            for (const project of requirementsData) {
                const requirement = project.requirements?.find(req => req.id === id);
                if (requirement) {
                    foundRequirement = requirement;
                    break;
                }
            }
        }

        if (!foundRequirement) {
            return res.status(404).json({ message: "Requirement not found" });
        }

        res.json(foundRequirement);
    } catch (error) {
        console.error('Error fetching requirement by ID:', error);
        res.status(500).json({ message: "Error fetching requirement" });
    }
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

// GET - Download requirement file
export const downloadRequirementFile = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Requirement ID is required" });
        }

        const requirementsData = dataHelper.getData(REQUIREMENTS_FILE);

        // Find requirement
        let foundRequirement = null;

        for (const project of requirementsData) {
            const requirement = project.requirements?.find(r => r.id === id);
            if (requirement) {
                foundRequirement = requirement;
                break;
            }
        }

        if (!foundRequirement) {
            return res.status(404).json({ message: "Requirement not found" });
        }

        if (!foundRequirement.filePath) {
            return res.status(404).json({ message: "No file attached to this requirement" });
        }

        // Get file path
        const filePath = path.join(process.cwd(), foundRequirement.filePath.slice(1));

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                message: "File not found on server",
                filePath: foundRequirement.filePath
            });
        }

        // Get file stats
        const stat = fs.statSync(filePath);

        // Determine content type based on file extension
        const ext = path.extname(filePath).toLowerCase();
        const contentTypes = {
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.csv': 'text/csv',
            '.pdf': 'application/pdf',
            '.txt': 'text/plain'
        };

        const contentType = contentTypes[ext] || 'application/octet-stream';

        // Set headers
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Content-Disposition', `attachment; filename="${foundRequirement.fileName}"`);
        res.setHeader('Cache-Control', 'no-cache');

        // Create read stream and pipe to response
        const fileStream = fs.createReadStream(filePath);

        fileStream.on('error', (error) => {
            console.error('Error reading file:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    message: 'Error reading file',
                    error: error.message
                });
            }
        });

        fileStream.pipe(res);

    } catch (error) {
        console.error('Error downloading requirement file:', error);
        res.status(500).json({
            message: "Error downloading file",
            error: error.message
        });
    }
};


// POST - Re-upload requirement file
export const reUploadRequirementFile = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Requirement ID is required" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const requirementsData = dataHelper.getData(REQUIREMENTS_FILE);

        // Find the requirement and its project
        let projectIndex = -1;
        let requirementIndex = -1;

        for (let i = 0; i < requirementsData.length; i++) {
            const reqIndex = requirementsData[i].requirements?.findIndex(r => r.id === id);
            if (reqIndex !== -1) {
                projectIndex = i;
                requirementIndex = reqIndex;
                break;
            }
        }

        if (projectIndex === -1 || requirementIndex === -1) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: "Requirement not found" });
        }

        const requirement = requirementsData[projectIndex].requirements[requirementIndex];

        // Delete old file if it exists
        if (requirement.filePath) {
            const oldFilePath = path.join(process.cwd(), requirement.filePath.slice(1));
            if (fs.existsSync(oldFilePath)) {
                try {
                    fs.unlinkSync(oldFilePath);
                } catch (err) {
                    console.warn('Could not delete old file:', err.message);
                }
            }
        }

        // Generate versioned filename
        const ext = path.extname(req.file.originalname);
        const nameWithoutExt = path.basename(req.file.originalname, ext);

        // Extract base name and current version
        const versionMatch = nameWithoutExt.match(/^(.+?)(?:_v(\d+))?$/);
        const baseName = versionMatch[1];
        const currentVersion = versionMatch[2] ? parseInt(versionMatch[2]) : 0;
        const newVersion = currentVersion + 1;

        // Create new versioned filename
        const newFileName = `${baseName}_v${newVersion}${ext}`;
        const newFilePath = path.join(process.cwd(), 'files', 'requirements', newFileName);

        // Rename the uploaded file to versioned name
        fs.renameSync(req.file.path, newFilePath);

        // Update requirement with new file info
        requirement.fileName = newFileName;
        requirement.filePath = `/files/requirements/${newFileName}`;
        requirement.updatedAt = new Date().toISOString();
        requirement.status = "In Review"; // Reset status on re-upload

        // Save updated data
        dataHelper.setData(REQUIREMENTS_FILE, requirementsData);

        res.json({
            message: "File uploaded successfully",
            requirement
        });

    } catch (error) {
        console.error('Error re-uploading requirement file:', error);

        // Clean up uploaded file on error
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (err) {
                console.warn('Could not delete uploaded file:', err.message);
            }
        }

        res.status(500).json({
            message: "Error uploading file",
            error: error.message
        });
    }
};

// PATCH - Update requirement status
export const updateRequirementStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Requirement ID is required" });
        }

        if (!status) {
            return res.status(400).json({ message: "Status is required" });
        }

        const requirementsData = dataHelper.getData(REQUIREMENTS_FILE);

        // Find and update requirement
        let updatedRequirement = null;

        for (let i = 0; i < requirementsData.length; i++) {
            const reqIndex = requirementsData[i].requirements?.findIndex(r => r.id === id);
            if (reqIndex !== -1) {
                requirementsData[i].requirements[reqIndex].status = status;
                requirementsData[i].requirements[reqIndex].updatedAt = new Date().toISOString();
                updatedRequirement = requirementsData[i].requirements[reqIndex];
                break;
            }
        }

        if (!updatedRequirement) {
            return res.status(404).json({ message: "Requirement not found" });
        }

        // Save updated data
        dataHelper.setData(REQUIREMENTS_FILE, requirementsData);

        // Send notification only when status is changed to "Submitted"
        if (status.toLowerCase() === 'submitted') {
            const notifications = dataHelper.getData(NOTIFICATIONS_FILE);

            const notification = {
                id: generateId("notif"),
                toRole: "ADMIN",
                projectId: updatedRequirement.projectId,
                notification_type: "REQ_SUBMITTED",
                message: `Requirement "${updatedRequirement.title}" has been submitted by ${updatedRequirement.client}`,
                createdAt: new Date().toISOString(),
                read: false,
                meta: {
                    requirementId: updatedRequirement.id,
                    client: updatedRequirement.client
                }
            };

            notifications.push(notification);
            dataHelper.setData(NOTIFICATIONS_FILE, notifications);

            return res.json({
                message: "Requirement status updated successfully",
                status,
                notification
            });
        }

        res.json({
            message: "Requirement status updated successfully",
            status
        });

    } catch (error) {
        console.error('Error updating requirement status:', error);
        res.status(500).json({
            message: "Error updating requirement status",
            error: error.message
        });
    }
};