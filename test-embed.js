import { PDFDocument, PageSizes } from 'pdf-lib';

async function run() {
  const doc = await PDFDocument.create();
  const pdf1 = await PDFDocument.create();
  pdf1.addPage([100, 100]);
  pdf1.addPage([200, 200]);
  const pdfBytes = await pdf1.save();
  
  const embedded = await doc.embedPdf(pdfBytes, [0, 1]);
  console.log(embedded.length);
  console.log(embedded[0].width, embedded[1].width);
}
run();
