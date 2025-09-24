import path from 'path';
import fs from 'fs';
import handlebars from 'handlebars';
import puppeteer from 'puppeteer-core';

const generatePDF = async (req, res, next ) => {
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
        console.log("/pdf-generate 200 sent");
        res.status(201).send(pdfBuffer);
    } catch (error) {
        console.error('/pdf-generate Error:', error);
        res.status(500).send('PDF generation failed');
    }
}

export const rtmController = {
    generatePDF
}