import path from 'path';
import fs from 'fs';
import handlebars from 'handlebars';
import puppeteer from 'puppeteer-core';
import { getData } from '../helpers/dataHelper.js';
import { OpenAI } from 'openai';

import dotenv from 'dotenv';
import ExcelJS from 'exceljs';

dotenv.config();
const generatePDF = async (req, res, next) => {
    try {
        const { customerName, subscriptionId, invoiceDate, amount, dueDate } = req.body;

        const templatePath = path.join(process.cwd(), 'templates', 'template.html');
        const templateHtml = fs.readFileSync(templatePath, 'utf-8');

        const template = handlebars.compile(templateHtml);

        const html = template({ customerName, subscriptionId, invoiceDate, amount, dueDate });

        const browser = await puppeteer.launch({
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // Mac path
            headless: true
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true, // ✅ includes CSS background colors
            margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
        });

        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=output.pdf');
        // Logger info
        console.log('/pdf-generate 200 sent');
        res.status(201).send(pdfBuffer);
    } catch (error) {
        console.error('/pdf-generate Error:', error);
        res.status(500).send('PDF generation failed');
    }
};

const fetchRTMFile = async (req, res, next) => {
    const filePath = path.join(process.cwd(), 'generated', req.params.fileName);
    if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${ req.params.fileName }"`);
    fs.createReadStream(filePath).pipe(res);

};

// GET /api/v1/rtms

export const getRtms = (req, res) => {
    try {
        const rtms = getData('rtms');
        res.json(rtms);
    } catch(e) {
        console.log('error', e);
        res.status(500).json({message: 'Error while fetching rtms'});
    }
}

// Initialize OpenAI API client with your API key (set in environment variable)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// const generateRTM1 = async (req, res) => {
//     try {
//         const { projectId } = req.body;
//         console.log(projectId);
//         if (!projectId) {
//             return res.status(400).json({ error: 'projectId is required' });
//         }
//
//         // **1. Load Knowledge Base Content from /kb directory**
//         // This will gather content from all .txt and .json files in the knowledge base directory.
//         const kbDir = path.join(process.cwd(), 'kb');  // path to knowledge base files
//         let contextText = '';
//         try {
//             const kbFiles = (await fs.promises.readdir(kbDir)).filter(file => file !== '.DS_Store');
//
//             for (const file of kbFiles) {
//                 const filePath = path.join(kbDir, file);
//                 const stat = await fs.promises.stat(filePath);
//
//                 if (!stat.isFile()) continue;  // skip directories or non-files
//
//                 const ext = path.extname(file).toLowerCase();
//                 if (ext === '.txt') {
//                     // Append text file content
//                     const textContent = await fs.promises.readFile(filePath, 'utf-8');
//                     contextText += `\n[Content of ${ file }]\n${ textContent }\n`;
//                 } else if (ext === '.json') {
//                     // Append JSON file content (converted to string for prompting)
//                     const jsonContent = JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));
//                     contextText += `\n[Content of ${ file }]\n${ JSON.stringify(jsonContent, null, 2) }\n`;
//                 }
//             }
//         } catch (err) {
//             console.error('Error reading knowledge base files:', err);
//             // If knowledge base directory or files are not accessible, return an error
//             return res.status(500).json({ error: 'Failed to load knowledge base content' });
//         }
//
//         // **2. Prepare AI Prompt with context and generate RTM data via OpenAI**
//         // We use a system message to instruct the assistant and a user message containing the projectId and knowledge base content.
//         const messages = [
//             {
//                 role: 'system',
//                 content: 'You are a helpful assistant that generates a Requirements Traceability Matrix (RTM) from provided knowledge base content. ' +
//                     'Use the information from the knowledge base to produce a comprehensive RTM for the project. ' +
//                     'Respond ONLY with the RTM data in JSON format (an array of objects), where each object represents one requirement mapping with all relevant fields (such as IDs, descriptions, sources, assumptions, comments, etc.). ' +
//                     'Do not include explanations or any text outside the JSON structure.',
//             },
//             {
//                 role: 'user',
//                 content: `Project ID: ${ projectId }\nGenerate the RTM for this project using the knowledge base content below:\n${ contextText }`
//             }
//         ];
//
//         let completion;
//         try {
//             // Call the OpenAI Chat Completion API (using a model with sufficient context length, e.g., GPT-3.5-Turbo-16k or GPT-4)
//             completion = await openai.chat.completions.create({
//                 model: 'gpt-4.1-mini',  // use a model that can handle large prompts
//                 messages: messages,
//                 temperature: 0  // use deterministic output for consistency
//             });
//         } catch (err) {
//             if (err.code === 'insufficient_quota') {
//                 return res.status(402).json({
//                     error: err
//                 });
//             }
//             if (err.status === 429) {
//                 return res.status(429).json({
//                     errorMessage: 'Rate limit exceeded. Try again later.',
//                     error:err
//                 });
//             }
//             throw err; // other errors
//         }
//
//         // Extract the assistant's reply
//         let aiResponse = completion.choices[0].message.content;
//         // The AI should respond with JSON only. Clean up in case there are code fences or extra text.
//         aiResponse = aiResponse.trim();
//         if (aiResponse.startsWith('```')) {
//             // Remove markdown code fences if present
//             aiResponse = aiResponse.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
//         }
//
//         let rtmData;
//         try {
//             rtmData = JSON.parse(aiResponse);
//         } catch (parseErr) {
//             console.error('Failed to parse AI response as JSON:', parseErr, aiResponse);
//             return res.status(500).json({ error: 'AI response is not valid JSON' });
//         }
//
//         // Ensure we have an array of RTM entries
//         if (!Array.isArray(rtmData)) {
//             return res.status(500).json({ error: 'AI response JSON is not an array of RTM entries' });
//         }
//         // console.log(rtmData);
//
//         // **3. Create Excel file from RTM JSON data**
//         const workbook = new ExcelJS.Workbook();
//         const worksheet = workbook.addWorksheet('RTM');
//
//         // Define columns based on keys of the RTM objects
//         if (rtmData.length > 0) {
//             const firstRowKeys = Object.keys(rtmData[0]);
//             worksheet.columns = firstRowKeys.map(key => ({
//                 header: key,    // use the object key as the column header
//                 key: key,       // key to access the value in each row object
//                 width: 30       // default column width (adjust as needed)
//             }));
//         }
//
//         // Add each RTM entry as a new row in the worksheet
//         for (const entry of rtmData) {
//             worksheet.addRow(entry);
//         }
//
//         // You can apply any additional formatting to the worksheet here if needed (e.g., bold headers)
//         worksheet.getRow(1).font = { bold: true };  // make the header row bold
//
//         // Prepare output directory and file name
//         const outputDir = path.join(process.cwd(), 'files', 'rtm');
//         await fs.promises.mkdir(outputDir, { recursive: true });  // ensure the output directory exists
//
//         // Construct a file name for the new RTM. Here we use "rtm_<projectId>.xlsx".
//         // You might include client name or timestamp if desired (e.g., client-specific name as in example).
//         const fileName = `rtm_${projectId}.xlsx`;
//         const filePath = path.join(outputDir, fileName);
//
//         // Write the Excel file to disk
//         await workbook.xlsx.writeFile(filePath);
//
//         // **4. Update RTM records JSON (rtm.json)**
//         const rtmJsonPath = path.join(process.cwd(), 'rtms.json');  // path to the JSON file storing RTM metadata
//         let allRtmRecords = [];
//         try {
//             const rtmJsonData = await fs.promises.readFile(rtmJsonPath, 'utf-8');
//             allRtmRecords = JSON.parse(rtmJsonData);
//         } catch (err) {
//             // If file not found or JSON invalid, initialize a new array
//             allRtmRecords = [];
//         }
//
//         // Determine a new unique RTM ID (increment the numeric part of the last ID if exists)
//         let newIdNumber = 1;
//         if (allRtmRecords.length > 0) {
//             // Extract numeric parts of existing IDs to find max
//             for (const record of allRtmRecords) {
//                 if (record.id && record.id.startsWith('rtm-')) {
//                     const numPart = parseInt(record.id.split('-')[1]);
//                     if (!isNaN(numPart) && numPart >= newIdNumber) {
//                         newIdNumber = numPart + 1;
//                     }
//                 }
//             }
//         }
//         const newRtmId = `rtm-${newIdNumber}`;
//
//         // (Optional) Retrieve client name from a project database or file, if available.
//         // For example, if you have a projects.json, you could find the project and get its client name.
//         let clientName = "";
//         // TODO: Fetch the client name using projectId if such data exists, e.g.:
//         // const projectData = getProjectById(projectId);
//         // clientName = projectData ? projectData.clientName : "";
//
//         // Create the new RTM record object (schema as required, excluding 'version' and dummy 'requirements')
//         const newRtmEntry = {
//             id: newRtmId,
//             projectId: projectId,
//             client: clientName || "",                  // client name if retrieved, otherwise empty or placeholder
//             name: fileName,
//             status: "Generated",                       // initial status upon generation
//             generatedBy: "ADMIN",                      // or use req.user if available for the current user
//             generatedDate: new Date().toISOString(),   // current timestamp in ISO format
//             filePath: `/files/rtm/${fileName}`         // relative path to the generated file
//             // Note: 'version' and 'requirements' fields are omitted as they are not needed
//         };
//
//         // Append the new record and save back to rtm.json
//         allRtmRecords.push(newRtmEntry);
//         try {
//             await fs.promises.writeFile(rtmJsonPath, JSON.stringify(allRtmRecords, null, 2));
//         } catch (err) {
//             console.error("Failed to write to rtm.json:", err);
//             // If metadata persistence fails, we can still proceed to send the response without halting.
//         }
//
//         // **5. Send response with the new RTM schema and the file content**
//         // Read the generated file and encode it to Base64 so it can be sent in JSON.
//         const fileData = await fs.promises.readFile(filePath);
//         const fileBase64 = fileData.toString('base64');
//
//         // Respond with JSON containing the RTM schema and the file data.
//         // The frontend can use the Base64 string to prompt a download, or a separate endpoint can serve the file if preferred.
//         res.json({
//             rtm: newRtmEntry,
//             fileName: fileName,
//             fileContent: fileBase64
//         });
//
//
//         // res.json(rtmData);
//     } catch (error) {
//         console.error('Error during RTM generation:', error);
//         res.status(500).json({ error: 'Internal server error during RTM generation' });
//     }
// };



const generateRTM = async (req, res) => {
    try {
        const { projectId, clientName } = req.body; // !!! NEW UPDATE: accept clientName from request body
        console.log(projectId);
        // if (!projectId || !clientName) { // !!! NEW UPDATE: require both projectId and clientName
        //     return res.status(400).json({ error: 'projectId and clientName are required' }); // !!! NEW UPDATE
        // }
        //
        // // **1. Load Knowledge Base Content from /kb directory**
        // // This will gather content from all .txt and .json files in the knowledge base directory.
        // const kbDir = path.join(process.cwd(), 'kb');  // path to knowledge base files
        // let contextText = '';
        // try {
        //     const kbFiles = (await fs.promises.readdir(kbDir)).filter(file => file !== '.DS_Store');
        //
        //     for (const file of kbFiles) {
        //         const filePath = path.join(kbDir, file);
        //         const stat = await fs.promises.stat(filePath);
        //
        //         if (!stat.isFile()) continue;  // skip directories or non-files
        //
        //         const ext = path.extname(file).toLowerCase();
        //         if (ext === '.txt') {
        //             // Append text file content
        //             const textContent = await fs.promises.readFile(filePath, 'utf-8');
        //             contextText += `\n[Content of ${ file }]\n${ textContent }\n`;
        //         } else if (ext === '.json') {
        //             // Append JSON file content (converted to string for prompting)
        //             const jsonContent = JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));
        //             contextText += `\n[Content of ${ file }]\n${ JSON.stringify(jsonContent, null, 2) }\n`;
        //         }
        //     }
        // } catch (err) {
        //     console.error('Error reading knowledge base files:', err);
        //     // If knowledge base directory or files are not accessible, return an error
        //     return res.status(500).json({ error: 'Failed to load knowledge base content' });
        // }
        //
        // // **2. Prepare AI Prompt with context and generate RTM data via OpenAI**
        // // We use a system message to instruct the assistant and a user message containing the projectId, clientName, and knowledge base content.
        // const messages = [
        //     {
        //         role: 'system',
        //         content: 'You are a helpful assistant that generates a Requirements Traceability Matrix (RTM) from provided knowledge base content. ' +
        //             'Use the information from the knowledge base to produce a comprehensive RTM for the given project and client. ' + // !!! NEW UPDATE: mention client in instructions
        //             'Focus only on requirements relevant to the specified client. ' + // !!! NEW UPDATE: ensure focus on given client
        //             'Respond ONLY with the RTM data in JSON format (an array of objects), where each object represents one requirement mapping with all relevant fields (such as IDs, descriptions, assumptions, comments, etc.). ' + // !!! NEW UPDATE: removed "sources" from field list
        //             'Do not include explanations or any text outside the JSON structure.',
        //     },
        //     {
        //         role: 'user',
        //         content: `Project ID: ${ projectId }\nClient Name: ${ clientName }\nGenerate the RTM for this project using the knowledge base content below:\n${ contextText }` // !!! NEW UPDATE: include client name in prompt
        //     }
        // ];
        //
        // let completion;
        // try {
        //     // Call the OpenAI Chat Completion API (using a model with sufficient context length, e.g., GPT-3.5-Turbo-16k or GPT-4)
        //     completion = await openai.chat.completions.create({
        //         model: 'gpt-4.1-mini',  // use a model that can handle large prompts
        //         messages: messages,
        //         temperature: 0  // use deterministic output for consistency
        //     });
        // } catch (err) {
        //     if (err.code === 'insufficient_quota') {
        //         return res.status(402).json({ error: err });
        //     }
        //     if (err.status === 429) {
        //         return res.status(429).json({
        //             errorMessage: 'Rate limit exceeded. Try again later.',
        //             error: err
        //         });
        //     }
        //     throw err; // other errors
        // }
        //
        // // Extract the assistant's reply
        // let aiResponse = completion.choices[0].message.content;
        // // The AI should respond with JSON only. Clean up in case there are code fences or extra text.
        // aiResponse = aiResponse.trim();
        // if (aiResponse.startsWith('```')) {
        //     // Remove markdown code fences if present
        //     aiResponse = aiResponse.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
        // }
        //
        // let rtmData;
        // try {
        //     rtmData = JSON.parse(aiResponse);
        // } catch (parseErr) {
        //     console.error('Failed to parse AI response as JSON:', parseErr, aiResponse);
        //     return res.status(500).json({ error: 'AI response is not valid JSON' });
        // }
        //
        // // Ensure we have an array of RTM entries
        // if (!Array.isArray(rtmData)) {
        //     return res.status(500).json({ error: 'AI response JSON is not an array of RTM entries' });
        // }
        // // console.log(rtmData);
        //
        // // **3. Create Excel file from RTM JSON data**
        // const workbook = new ExcelJS.Workbook();
        // const worksheet = workbook.addWorksheet('RTM');
        //
        // // Define columns based on keys of the RTM objects, excluding any "source" field
        // if (rtmData.length > 0) {
        //     const firstRowKeys = Object.keys(rtmData[0]).filter(key => key.toLowerCase() !== 'source'); // !!! NEW UPDATE: exclude "source" column
        //     worksheet.columns = firstRowKeys.map(key => ({
        //         header: key,
        //         key: key,
        //         width: 30       // default column width (adjust as needed)
        //     }));
        // }
        //
        // // Add each RTM entry as a new row in the worksheet (remove "source" field if present)
        // for (const entry of rtmData) {
        //     if ('source' in entry) delete entry.source; // !!! NEW UPDATE: remove source field from each entry
        //     worksheet.addRow(entry);
        // }
        //
        // // You can apply any additional formatting to the worksheet here if needed (e.g., bold headers)
        // worksheet.getRow(1).font = { bold: true };  // make the header row bold
        //
        // // Prepare output directory and file name
        // const outputDir = path.join(process.cwd(), 'files', 'rtm');
        // await fs.promises.mkdir(outputDir, { recursive: true });  // ensure the output directory exists
        //
        // // Construct a file name for the new RTM, including projectId and clientName
        // const fileName = `rtm_${projectId}_${clientName}.xlsx`; // !!! NEW UPDATE: include clientName in file name
        // const filePath = path.join(outputDir, fileName);
        //
        // // Write the Excel file to disk
        // await workbook.xlsx.writeFile(filePath);
        //
        // // **4. Update RTM records JSON (rtm.json)**
        // const rtmJsonPath = path.join(process.cwd(), 'rtms.json');  // path to the JSON file storing RTM metadata
        // let allRtmRecords = [];
        // try {
        //     const rtmJsonData = await fs.promises.readFile(rtmJsonPath, 'utf-8');
        //     allRtmRecords = JSON.parse(rtmJsonData);
        // } catch (err) {
        //     // If file not found or JSON invalid, initialize a new array
        //     allRtmRecords = [];
        // }
        //
        // // Determine a new unique RTM ID (increment the numeric part of the last ID if exists)
        // let newIdNumber = 1;
        // if (allRtmRecords.length > 0) {
        //     for (const record of allRtmRecords) {
        //         if (record.id && record.id.startsWith('rtm-')) {
        //             const numPart = parseInt(record.id.split('-')[1]);
        //             if (!isNaN(numPart) && numPart >= newIdNumber) {
        //                 newIdNumber = numPart + 1;
        //             }
        //         }
        //     }
        // }
        // const newRtmId = `rtm-${newIdNumber}`;
        //
        // // (Optional) Retrieve client name from a project database or file, if available.
        // // For example, if you have a projects.json, you could find the project and get its client name.
        // // let clientName = ""; // !!! NEW UPDATE: removed manual client name retrieval (clientName is provided in req.body)
        // // TODO: Fetch the client name using projectId if such data exists, e.g.:
        // // const projectData = getProjectById(projectId);
        // // clientName = projectData ? projectData.clientName : "";
        //
        // // Create the new RTM record object (schema as required, excluding 'version' and dummy 'requirements')
        // const newRtmEntry = {
        //     id: newRtmId,
        //     projectId: projectId,
        //     client: clientName, // !!! NEW UPDATE: use provided clientName in RTM record
        //     name: fileName,
        //     status: "Generated",                       // initial status upon generation
        //     generatedBy: "ADMIN",                      // or use req.user if available for the current user
        //     generatedDate: new Date().toISOString(),   // current timestamp in ISO format
        //     filePath: `/files/rtm/${fileName}`         // relative path to the generated file
        //     // Note: 'version' and 'requirements' fields are omitted as they are not needed
        // };
        //
        // // Append the new record and save back to rtms.json
        // allRtmRecords.push(newRtmEntry);
        // try {
        //     await fs.promises.writeFile(rtmJsonPath, JSON.stringify(allRtmRecords, null, 2));
        // } catch (err) {
        //     console.error("Failed to write to rtm.json:", err);
        //     // If metadata persistence fails, we can still proceed to send the response without halting.
        // }
        //
        // // **5. Send response with the new RTM schema and the file content**
        // const fileData = await fs.promises.readFile(filePath);
        // const fileBase64 = fileData.toString('base64');
        //
        // res.json({
        //     rtm: newRtmEntry,
        //     fileName: fileName,
        //     fileContent: fileBase64
        // });

        res.json({
            "rtm": {
                "id": "rtm-1",
                "projectId": "proj-101",
                "client": "Indeed",
                "name": "rtm_proj-101_Indeed.xlsx",
                "status": "Generated",
                "generatedBy": "ADMIN",
                "generatedDate": "2025-09-27T08:07:47.270Z",
                "filePath": "/files/rtm/rtm_proj-101_Indeed.xlsx"
            },
            "fileName": "rtm_proj-101_Indeed.xlsx",
            "fileContent": "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"
        });
    } catch (error) {
        console.error('Error during RTM generation:', error);
        res.status(500).json({ error: 'Internal server error during RTM generation' });
    }

}

export async function healthCheck(req, res) {
    try {
        // A cheap endpoint — e.g. list models (or list something you have permission for)
        const models = await client.models.list();
        // If models come back, you have access
        return res.json({ ok: true, models: models.data.map(m => m.id) });
    } catch (err) {
        console.error("OpenAI health check error:", err);
        // Return more info if possible
        const status = err.status ?? 500;
        return res.status(status).json({
            ok: false,
            error: err.message,
            code: err.code,
        });
    }
}
export const rtmController = {
    generatePDF,
    generateRTM,
    fetchRTMFile,
    healthCheck,
    getRtms
};