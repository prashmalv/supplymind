// Client-side PDF text extraction for the Knowledge Bot. Lets a user drop a PDF
// (contract, tender, spec, report) and ask the AI questions grounded in it.
import * as pdfjsLib from 'pdfjs-dist';
// Vite bundles the worker and returns its URL (self-contained, no CDN).
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/** Extract plain text from a PDF file (up to `maxPages` pages). */
export async function extractPdfText(file: File, maxPages = 25): Promise<string> {
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = Math.min(pdf.numPages, maxPages);
  const out: string[] = [];
  for (let i = 1; i <= pages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((it: any) => (typeof it.str === 'string' ? it.str : '')).join(' ');
    if (text.trim()) out.push(text);
  }
  return out.join('\n\n').replace(/[ \t]+/g, ' ').trim();
}
