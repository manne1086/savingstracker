import PDFDocument from 'pdfkit';
import fs from 'fs';

/**
 * Generates a PDF file at the specified path.
 * @param {string} title - Title of the document.
 * @param {string} content - Main content text.
 * @param {string} outputPath - Full path to save the PDF.
 * @returns {Promise<void>}
 */
export const generatePdf = (title, content, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument();
            const stream = fs.createWriteStream(outputPath);

            doc.pipe(stream);

            // Title
            doc.fontSize(20).text(title, { align: 'center' });
            doc.moveDown();

            // Content
            doc.fontSize(12).text(content, {
                align: 'left',
                paragraphGap: 10,
                indent: 20
            });

            doc.end();

            stream.on('finish', () => resolve());
            stream.on('error', (err) => reject(err));
        } catch (error) {
            reject(error);
        }
    });
};
