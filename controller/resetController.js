import fs from 'fs';
import path from 'path';

/**
 * POST /api/v1/reset-data
 * Resets all data files by copying from data-copy to data folder
 */
export const resetData = async (req, res) => {
    try {
        const dataCopyDir = path.join(process.cwd(), 'data-copy');
        const dataDir = path.join(process.cwd(), 'data');

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

        // Prepare response
        const response = {
            success: errors.length === 0,
            message: errors.length === 0
                ? 'Data reset completed successfully'
                : 'Data reset completed with some errors',
            copiedFiles,
            totalFiles: files.length,
            successCount: copiedFiles.length,
            errorCount: errors.length
        };

        if (errors.length > 0) {
            response.errors = errors;
        }

        const statusCode = errors.length === 0 ? 200 : 207; // 207 = Multi-Status
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
 */
export const getResetStatus = async (req, res) => {
    try {
        console.log("you triggered mi ");
        const dataCopyDir = path.join(process.cwd(), 'data-copy');
        const dataDir = path.join(process.cwd(), 'data');

        const status = {
            dataCopyExists: fs.existsSync(dataCopyDir),
            dataExists: fs.existsSync(dataDir),
            files: []
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