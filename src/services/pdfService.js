/**
 * PDF Extraction Service
 * Extracts plain text from uploaded PDF lecture slides, syllabus, and study notes in the browser.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Ensure worker is properly configured
try {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/build/pdf.worker.min.mjs`;
  }
} catch (err) {
  console.warn('[PDF Service] Error setting up workerSrc:', err);
}

/**
 * Extracts all text content from a PDF file
 * @param {File} file - PDF file object
 * @param {Function} onProgress - Callback (current, total)
 * @returns {Promise<string>}
 */
export async function extractTextFromPDF(file, onProgress = () => {}) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useWorkerFetch: true,
      isEvalSupported: false
    });

    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    let fullText = '';

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      onProgress(pageNum, numPages);
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageStrings = textContent.items
        .map(item => item.str)
        .filter(str => Boolean(str && str.trim()));
      
      // Join strings into paragraphs
      const pageText = pageStrings.join(' ');
      if (pageText.trim()) {
        fullText += `\n\n--- Page ${pageNum} ---\n` + pageText;
      }
    }

    if (!fullText.trim()) {
      throw new Error('No readable text could be found in this PDF. It may contain scanned images without embedded text.');
    }

    return fullText.trim();
  } catch (err) {
    console.error('[PDF Extraction Error]:', err);
    throw new Error(`Failed to extract text from "${file.name}": ${err.message}`);
  }
}

