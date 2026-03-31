import { generatePdf } from "../utils/pdfGenerator.js";
import path from "path";
import fs from "fs";

const testPdf = async () => {
    try {
        const downloadsDir = path.join(process.cwd(), 'public', 'downloads');
        if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
        }

        const filePath = path.join(downloadsDir, 'test_output.pdf');
        console.log("Generating PDF at:", filePath);

        await generatePdf("Test Title", "This is a test content for the PDF generator.", filePath);
        console.log("PDF generated successfully!");
    } catch (error) {
        console.error("PDF Generation failed:", error);
    }
};

testPdf();
