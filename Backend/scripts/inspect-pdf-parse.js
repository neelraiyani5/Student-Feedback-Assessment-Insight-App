import * as pdfNamespace from 'pdf-parse';
import pdfDefault from 'pdf-parse';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfReq = require('pdf-parse');

console.log('--- Import * as ---');
console.log(pdfNamespace);
console.log('--- Import Default ---');
console.log(pdfDefault);
console.log('--- Require ---');
console.log(pdfReq);

try {
    const { PDFParse } = pdfNamespace;
    console.log('PDFParse from namespace:', PDFParse);
} catch (e) {
    console.log('Error accessing PDFParse:', e.message);
}
