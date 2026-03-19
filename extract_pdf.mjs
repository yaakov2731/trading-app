// Helper ESM module to extract text from PDF using pdfjs-dist
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workerPath = join(__dirname, 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
GlobalWorkerOptions.workerSrc = workerPath;

const pdfPath = process.argv[2];
const buf = readFileSync(pdfPath);
const data = new Uint8Array(buf);

const doc = await getDocument({ data, disableWorker: true }).promise;
let text = '';
for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i);
  const content = await page.getTextContent();
  // Preserve column structure by sorting items by y then x
  const items = content.items.sort((a, b) => {
    const dy = Math.round(b.transform[5]) - Math.round(a.transform[5]);
    return dy !== 0 ? dy : a.transform[4] - b.transform[4];
  });
  let lastY = null;
  for (const item of items) {
    const y = Math.round(item.transform[5]);
    if (lastY !== null && Math.abs(y - lastY) > 3) text += '\n';
    text += item.str + '  ';
    lastY = y;
  }
  text += '\n';
}
process.stdout.write(text);
