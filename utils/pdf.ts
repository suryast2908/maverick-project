import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker';

pdfjsLib.GlobalWorkerOptions.workerPort = new pdfjsWorker();


export const extractTextFromPdfUrl = async (url: string): Promise<string> => {
    try {
        const loadingTask = pdfjsLib.getDocument({
            url,
            cMapUrl: `https://unpkg.com/pdfjs-dist@4.4.179/cmaps/`,
            cMapPacked: true,
            standardFontDataUrl: `https://unpkg.com/pdfjs-dist@4.4.179/standard_fonts/`,
        });
        const pdf = await loadingTask.promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
            fullText += pageText + '\n\n';
        }
        return fullText;
    } catch (error) {
        console.error("Error reading PDF from URL:", error);
        if (
            error instanceof Error &&
            (error.name === 'CorsNotAllowed' || error.message.includes('CORS') || error.message.includes('Failed to fetch'))
        ) {
            throw new Error("CORS error: Could not fetch the resume from Firebase Storage. Make sure CORS is configured correctly on your bucket.");
        }
        throw new Error("Failed to extract text from the provided PDF.");
    }
};