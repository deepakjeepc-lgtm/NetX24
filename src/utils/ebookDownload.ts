import { CatalogItem } from '../context/CatalogContext';

export interface OrderedItemSnapshot {
  productId: string;
  title: string;
  category: string;
  image: string;
  price: number;
  quantity: number;
  selectedFormat: 'physical' | 'ebook';
  author?: string;
  publisher?: string;
  isbn?: string;
  formatSpec?: string;
  description?: string;
  ebookPdfUrl?: string;
  ebookFileName?: string;
  synopsisPdfUrl?: string;
  synopsisFileName?: string;
  ignouMaterialType?: 'Assignment' | 'Project';
}

export interface UserOrderRecord {
  orderId: string;
  paymentId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  itemName: string;
  itemType: string;
  amount: number;
  status: string;
  createdAtIso: string;
  items: OrderedItemSnapshot[];
}

export function triggerDemoPdfDownload(
  product: CatalogItem,
  which: 'main' | 'synopsis' = 'main'
): string | null {
  const demoUrl =
    which === 'synopsis'
      ? product.synopsisDemoPdfUrl?.trim()
      : product.demoPdfUrl?.trim();
  if (!demoUrl) return null;

  const suffix = which === 'synopsis' ? 'Synopsis_Demo' : 'Demo';
  const fileName =
    (which === 'synopsis'
      ? product.synopsisDemoFileName?.trim()
      : product.demoFileName?.trim()) ||
    `${(product.title || 'LEKHIX').replace(/[^a-zA-Z0-9]+/g, '_')}_${suffix}.pdf`;

  const link = document.createElement('a');
  link.href = demoUrl;
  link.download = fileName;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return fileName;
}

export function triggerSynopsisPdfDownload(
  ebook: CatalogItem | OrderedItemSnapshot
): string | null {
  const synopsisUrl =
    'synopsisPdfUrl' in ebook ? ebook.synopsisPdfUrl?.trim() : undefined;
  if (!synopsisUrl) return null;

  const title = ebook.title || 'LEKHIX_Project';
  const fileName =
    ('synopsisFileName' in ebook && ebook.synopsisFileName?.trim()) ||
    `${title.replace(/[^a-zA-Z0-9]+/g, '_')}_Synopsis.pdf`;

  const link = document.createElement('a');
  link.href = synopsisUrl;
  link.download = fileName;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return fileName;
}

export async function triggerEbookPdfDownload(
  ebook: CatalogItem | OrderedItemSnapshot,
  orderId: string,
  customerName?: string
): Promise<string> {
  const title = ebook.title || 'LEKHIX Edition';
  const ebookFileName =
    ('ebookFileName' in ebook && ebook.ebookFileName) ||
    `${title.replace(/[^a-zA-Z0-9]+/g, '_')}_LEKHIX_eBook.pdf`;

  const ebookPdfUrl = 'ebookPdfUrl' in ebook ? ebook.ebookPdfUrl : undefined;
  const synopsisPdfUrl =
    'synopsisPdfUrl' in ebook ? ebook.synopsisPdfUrl : undefined;

  if (synopsisPdfUrl && synopsisPdfUrl.trim()) {
    triggerSynopsisPdfDownload(ebook);
  }

  try {
    const prev = JSON.parse(localStorage.getItem('lekhix_ebook_downloads') || '[]');
    localStorage.setItem(
      'lekhix_ebook_downloads',
      JSON.stringify([
        {
          id: 'id' in ebook ? ebook.id : ebook.productId,
          title,
          fileName: ebookFileName,
          downloadedAt: new Date().toISOString(),
        },
        ...prev.slice(0, 29),
      ])
    );
  } catch {
    // ignore storage quota errors
  }

  if (ebookPdfUrl && ebookPdfUrl.trim()) {
    const link = document.createElement('a');
    link.href = ebookPdfUrl;
    link.download = ebookFileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return ebookFileName;
  }

  // Fallback: Generate a complete 6×9 inch archival digital edition PDF
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: [6, 9],
  });

  const author =
    'specs' in ebook
      ? ebook.specs?.author || 'LEKHIX Editions'
      : ebook.author || 'LEKHIX Editions';
  const publisher =
    'specs' in ebook
      ? ebook.specs?.publisher || 'LEKHIX Press'
      : ebook.publisher || 'LEKHIX Press';
  const isbn =
    'specs' in ebook ? ebook.specs?.isbn || '' : ebook.isbn || '';
  const description = ebook.description || '';

  doc.setFillColor(248, 248, 245);
  doc.rect(0, 0, 6, 9, 'F');
  doc.setDrawColor(24, 24, 27);
  doc.setLineWidth(0.02);
  doc.rect(0.45, 0.45, 5.1, 8.1);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('LEKHIX DIGITAL ARCHIVE · 6 × 9 IN EDITION', 3, 1.3, {
    align: 'center',
  });

  doc.setFontSize(20);
  doc.setTextColor(17, 17, 17);
  const titleLines = doc.splitTextToSize(title.toUpperCase(), 4.2);
  doc.text(titleLines, 3, 2.8, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`by ${author}`, 3, 4.1, {
    align: 'center',
  });

  doc.setFontSize(9.5);
  doc.setTextColor(80, 80, 80);
  const descLines = doc.splitTextToSize(description, 4.1);
  doc.text(descLines, 3, 5.1, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `${publisher}${isbn ? ` · ISBN ${isbn}` : ''} · Order ${orderId}`,
    3,
    8.1,
    { align: 'center' }
  );

  const pages =
    'previewPages' in ebook &&
    ebook.previewPages &&
    ebook.previewPages.length > 0
      ? ebook.previewPages
      : [
          {
            pageNumber: 1,
            heading: 'Chapter I · Editorial Note & Synopsis',
            body: description || '6 × 9 inch archival digital edition.',
          },
        ];

  pages.forEach((p) => {
    doc.addPage([6, 9], 'portrait');
    doc.setFillColor(252, 252, 250);
    doc.rect(0, 0, 6, 9, 'F');

    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(title.toUpperCase(), 0.65, 0.75);
    doc.text(`PAGE ${p.pageNumber}`, 5.35, 0.75, { align: 'right' });

    doc.setDrawColor(220, 220, 215);
    doc.setLineWidth(0.01);
    doc.line(0.65, 0.9, 5.35, 0.9);

    doc.setFontSize(13);
    doc.setTextColor(17, 17, 17);
    const headingLines = doc.splitTextToSize(p.heading, 4.7);
    doc.text(headingLines, 0.65, 1.5);

    doc.setFontSize(10.5);
    doc.setTextColor(45, 45, 45);
    const bodyLines = doc.splitTextToSize(p.body, 4.7);
    doc.text(bodyLines, 0.65, 2.25);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Licensed to ${customerName || 'Reader'} · LEKHIX Editions`,
      3,
      8.4,
      {
        align: 'center',
      }
    );
  });

  doc.save(ebookFileName);
  return ebookFileName;
}

export async function downloadOrderReceiptPdf(order: {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  itemName: string;
  amount: number;
  createdAtIso?: string;
}): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(17, 17, 17);
  doc.text('LEKHIX', 105, 24, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text('BOOKS & ARCHITECTURAL STATIONERY · OFFICIAL RECEIPT', 105, 32, {
    align: 'center',
  });

  doc.setDrawColor(210, 210, 205);
  doc.line(20, 40, 190, 40);

  const formattedDate = order.createdAtIso
    ? new Date(order.createdAtIso).toLocaleDateString('en-IN')
    : new Date().toLocaleDateString('en-IN');

  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text(`Order Reference: ${order.orderId}`, 20, 54);
  doc.text(`Date: ${formattedDate}`, 20, 62);
  doc.text(`Customer: ${order.customerName}`, 20, 70);
  doc.text(`Phone: ${order.customerPhone}`, 20, 78);
  if (order.customerAddress) {
    doc.text(`Address: ${order.customerAddress}`, 20, 86);
  }

  doc.line(20, 95, 190, 95);
  doc.setFontSize(12);
  doc.text(`Edition / Item: ${order.itemName}`, 20, 108);
  doc.setFontSize(14);
  doc.text(`Total Paid: Rs. ${order.amount.toLocaleString('en-IN')}`, 20, 122);

  doc.line(20, 134, 190, 134);
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text('Thank you for collecting from LEKHIX.', 105, 148, {
    align: 'center',
  });

  doc.save(`LEKHIX_Receipt_${order.orderId}.pdf`);
}
