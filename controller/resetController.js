import fs from 'fs';
import path from 'path';

/**
 * POST /api/v1/reset-data
 * Resets all data files by copying from data-copy to data folder
 * Also cleans up RTM files from files/rtm directory
 */
export const resetData = async (req, res) => {
    try {
        const dataCopyDir = path.join(process.cwd(), 'data-copy');
        const dataDir = path.join(process.cwd(), 'data');
        const rtmDir = path.join(process.cwd(), 'files', 'rtm');

        // Check if data-copy directory exists
        if (!fs.existsSync(dataCopyDir)) {
            return res.status(404).json({
                success: false,
                message: 'data-copy directory not found'
            });
        }

        // Ensure data directory exists
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Get all JSON files from data-copy
        const files = fs.readdirSync(dataCopyDir).filter(file =>
            file.endsWith('.json')
        );

        if (files.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No JSON files found in data-copy directory'
            });
        }

        const copiedFiles = [];
        const errors = [];

        // Copy each file from data-copy to data
        for (const file of files) {
            try {
                const sourcePath = path.join(dataCopyDir, file);
                const destPath = path.join(dataDir, file);

                // Read from data-copy
                const fileContent = fs.readFileSync(sourcePath, 'utf-8');

                // Write to data (overwrite if exists)
                fs.writeFileSync(destPath, fileContent, 'utf-8');

                copiedFiles.push(file);
            } catch (err) {
                console.error(`Error copying ${file}:`, err);
                errors.push({
                    file,
                    error: err.message
                });
            }
        }

        // **NEW: Clean up specific RTM file**
        const specificRtmFile = 'Indeed_RTM_proj-101.xlsx';
        let rtmFileDeleted = false;
        let rtmError = null;

        // Check if RTM directory exists
        if (fs.existsSync(rtmDir)) {
            const specificRtmPath = path.join(rtmDir, specificRtmFile);

            // Check if the specific file exists
            if (fs.existsSync(specificRtmPath)) {
                try {
                    fs.unlinkSync(specificRtmPath);
                    rtmFileDeleted = true;
                    console.log(`Deleted RTM file: ${specificRtmFile}`);
                } catch (err) {
                    console.error(`Error deleting RTM file ${specificRtmFile}:`, err);
                    rtmError = {
                        file: specificRtmFile,
                        error: err.message
                    };
                }
            } else {
                console.log(`RTM file ${specificRtmFile} does not exist, skipping deletion`);
            }
        } else {
            console.log('RTM directory does not exist, skipping RTM cleanup');
        }

        // Prepare response
        const response = {
            success: errors.length === 0 && !rtmError,
            message: errors.length === 0 && !rtmError
                ? 'Data reset completed successfully'
                : 'Data reset completed with some errors',
            copiedFiles,
            totalFiles: files.length,
            successCount: copiedFiles.length,
            errorCount: errors.length,
            rtmFileDeleted,
            rtmFileName: specificRtmFile
        };

        if (errors.length > 0) {
            response.errors = errors;
        }

        if (rtmError) {
            response.rtmError = rtmError;
        }

        const statusCode = (errors.length === 0 && !rtmError) ? 200 : 207; // 207 = Multi-Status
        res.status(statusCode).json(response);

    } catch (error) {
        console.error('Error resetting data:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting data',
            error: error.message
        });
    }
};

/**
 * GET /api/v1/reset-data/status
 * Check the status of data files and what would be reset
 * Also shows RTM files that would be deleted
 */
export const getResetStatus = async (req, res) => {
    try {
        console.log("you triggered mi ");
        const dataCopyDir = path.join(process.cwd(), 'data-copy');
        const dataDir = path.join(process.cwd(), 'data');
        const rtmDir = path.join(process.cwd(), 'files', 'rtm');

        const status = {
            dataCopyExists: fs.existsSync(dataCopyDir),
            dataExists: fs.existsSync(dataDir),
            rtmDirExists: fs.existsSync(rtmDir),
            files: [],
            specificRtmFile: null
        };

        if (!status.dataCopyExists) {
            return res.status(404).json({
                success: false,
                message: 'data-copy directory not found',
                status
            });
        }

        // Get files from data-copy
        const files = fs.readdirSync(dataCopyDir).filter(file =>
            file.endsWith('.json')
        );

        // Check each file
        for (const file of files) {
            const sourcePath = path.join(dataCopyDir, file);
            const destPath = path.join(dataDir, file);

            const fileInfo = {
                name: file,
                existsInSource: fs.existsSync(sourcePath),
                existsInDest: fs.existsSync(destPath),
                sourceSize: 0,
                destSize: 0
            };

            if (fileInfo.existsInSource) {
                const sourceStats = fs.statSync(sourcePath);
                fileInfo.sourceSize = sourceStats.size;
            }

            if (fileInfo.existsInDest) {
                const destStats = fs.statSync(destPath);
                fileInfo.destSize = destStats.size;
            }

            status.files.push(fileInfo);
        }

        // **NEW: Check specific RTM file**
        const specificRtmFile = 'Indeed_RTM_proj-101.xlsx';
        if (status.rtmDirExists) {
            const specificRtmPath = path.join(rtmDir, specificRtmFile);

            if (fs.existsSync(specificRtmPath)) {
                try {
                    const rtmStats = fs.statSync(specificRtmPath);
                    status.specificRtmFile = {
                        name: specificRtmFile,
                        exists: true,
                        size: rtmStats.size,
                        created: rtmStats.birthtime,
                        modified: rtmStats.mtime
                    };
                } catch (err) {
                    console.error('Error reading RTM file:', err);
                    status.specificRtmFile = {
                        name: specificRtmFile,
                        exists: true,
                        error: err.message
                    };
                }
            } else {
                status.specificRtmFile = {
                    name: specificRtmFile,
                    exists: false
                };
            }
        }

        res.json({
            success: true,
            status
        });

    } catch (error) {
        console.error('Error getting reset status:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting reset status',
            error: error.message
        });
    }
};