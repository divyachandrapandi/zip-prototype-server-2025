import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import puppeteer from "puppeteer-core";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/generate-pdf", async (req, res) => {
   try {
       const { customerName, subscriptionId, invoiceDate, amount, dueDate } = req.body;

       const templatePath = path.join(process.cwd(), "templates", "template.html");
       const templateHtml = fs.readFileSync(templatePath, "utf-8");
       console.log("template Path - ", req.body);

       const template = handlebars.compile(templateHtml);

       const html = template({ customerName, subscriptionId, invoiceDate, amount, dueDate });
       // console.log("template  - ", html);

       const browser = await puppeteer.launch({
           executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // Mac path
           headless: true
       });

       const page = await browser.newPage();
       await page.setContent(html, { waitUntil: "networkidle0" });
       const pdfBuffer = await page.pdf({
           format: "A4",
           printBackground: true, // ✅ includes CSS background colors
           margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
       });

       await browser.close();

       res.setHeader("Content-Type", "application/pdf");
       res.setHeader("Content-Disposition", "attachment; filename=output.pdf");
       res.status(201).send(pdfBuffer);
   } catch (error) {
       console.error("Error generating PDF:", error);
       res.status(500).send("PDF generation failed");
   }
});

app.listen(5000, () => console.log("⚡ Server running at http://localhost:5000"));
