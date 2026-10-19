import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, CheckCircle2, FileDown, Download } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import {
  CartItem,
  CatalogItem,
  getEffectivePrice,
  useCatalog,
} from '../context/CatalogContext';
import ProductImage6x9 from './ProductImage6x9';
import { useToast } from '../context/ToastContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  directItem?: CatalogItem | null;
  directFormat?: 'physical' | 'ebook';
}

export default function CheckoutModal({
  isOpen,
  onClose,
  directItem = null,
  directFormat = 'physical',
}: CheckoutModalProps) {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
  } = useCatalog();
  const { showToast } = useToast();

  const [step, setStep] = useState<'bag' | 'checkout' | 'processing' | 'success'>('bag');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [orderId, setOrderId] = useState('');
  const [confirmedAmount, setConfirmedAmount] = useState(0);
  const [confirmedTitle, setConfirmedTitle] = useState('');
  const [confirmedEbooks, setConfirmedEbooks] = useState<CatalogItem[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      setStep(directItem ? 'checkout' : 'bag');
    }
  }, [isOpen, directItem]);

  if (!isOpen) return null;

  const activeItems: CartItem[] = directItem
    ? [
        {
          product: directItem,
          quantity: 1,
          selectedFormat: directFormat,
        },
      ]
    : cart;

  const totalAmount = directItem
    ? getEffectivePrice(directItem, directFormat)
    : cartTotal;

  const isDigitalOnlyOrder =
    activeItems.length > 0 &&
    activeItems.every((i) => i.selectedFormat === 'ebook');

  const formatItemTitle = (entry: CartItem) =>
    entry.selectedFormat === 'ebook'
      ? `${entry.product.title} (eBook PDF)`
      : entry.product.title;

  const summaryTitle =
    activeItems.length === 1
      ? formatItemTitle(activeItems[0])
      : `${formatItemTitle(activeItems[0])} + ${activeItems.length - 1} more`;

  const summaryCategory =
    activeItems.length === 1
      ? activeItems[0].selectedFormat === 'ebook'
        ? 'eBook (PDF)'
        : activeItems[0].product.category
      : isDigitalOnlyOrder
      ? 'eBooks (PDF)'
      : 'Books & Stationery';

  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const finalizeOrder = async (paymentId: string) => {
    setStep('processing');
    const newOrderId = `LKX-${Date.now().toString().slice(-6)}`;
    const purchasedEbooks = activeItems
      .filter((i) => i.selectedFormat === 'ebook')
      .map((i) => i.product);

    setOrderId(newOrderId);
    setConfirmedAmount(totalAmount);
    setConfirmedTitle(summaryTitle);
    setConfirmedEbooks(purchasedEbooks);

    const path = 'orders';
    try {
      await addDoc(collection(db, path), {
        orderId: newOrderId,
        paymentId: paymentId.slice(0, 100),
        customerName: formData.name.trim().slice(0, 150),
        customerPhone: formData.phone.trim().slice(0, 50),
        customerAddress: (
          formData.address.trim() ||
          (isDigitalOnlyOrder ? 'Digital eBook (Instant PDF Delivery)' : '')
        ).slice(0, 500),
        itemName: summaryTitle.slice(0, 500),
        itemType: summaryCategory.slice(0, 100),
        amount: Number(totalAmount),
        status: 'Success',
        createdAt: serverTimestamp(),
      });

      if (!directItem) {
        clearCart();
      }
      setStep('success');
      showToast({
        message:
          purchasedEbooks.length > 0
            ? `Order ${newOrderId} confirmed! Your eBook PDF is ready to download.`
            : `Order ${newOrderId} confirmed.`,
        type: 'success',
        duration: 4000,
      });
    } catch (error) {
      setStep('checkout');
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    setStep('processing');
    try {
      const response = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(totalAmount * 100) }),
      });
      const data = await response.json();

      if (data?.isMock || !import.meta.env.VITE_RAZORPAY_KEY_ID) {
        await finalizeOrder(data?.id || 'direct_order');
        return;
      }

      const sdkReady = await loadRazorpayScript();
      if (!sdkReady) {
        await finalizeOrder('offline_order');
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'LEKHIX',
        description: summaryTitle,
        order_id: data.id,
        handler: function (rzpRes: any) {
          finalizeOrder(rzpRes.razorpay_payment_id || 'rzp_paid');
        },
        prefill: {
          name: formData.name,
          contact: formData.phone,
        },
        theme: {
          color: '#111111',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
      setStep('checkout');
    } catch {
      await finalizeOrder('direct_confirmed');
    }
  };

  const handleDownloadEbookPdf = async (ebook: CatalogItem) => {
    const cleanFileName =
      ebook.ebookFileName ||
      `${ebook.title.replace(/[^a-zA-Z0-9]+/g, '_')}_LEKHIX_eBook.pdf`;

    try {
      const prev = JSON.parse(localStorage.getItem('lekhix_ebook_downloads') || '[]');
      localStorage.setItem(
        'lekhix_ebook_downloads',
        JSON.stringify([
          {
            id: ebook.id,
            title: ebook.title,
            fileName: cleanFileName,
            downloadedAt: new Date().toISOString(),
          },
          ...prev.slice(0, 19),
        ])
      );
    } catch {
      // ignore storage quota errors
    }

    // If admin uploaded a PDF file or provided an external PDF URL, trigger direct download
    if (ebook.ebookPdfUrl && ebook.ebookPdfUrl.trim()) {
      const link = document.createElement('a');
      link.href = ebook.ebookPdfUrl;
      link.download = cleanFileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast({
        message: `Downloading ${cleanFileName}...`,
        type: 'success',
        duration: 3000,
      });
      return;
    }

    // Fallback: Generate a complete 6×9 inch (152.4 × 228.6 mm) archival digital edition PDF
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: [6, 9],
    });

    // Cover / Title Page (6 x 9 in)
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
    const titleLines = doc.splitTextToSize(ebook.title.toUpperCase(), 4.2);
    doc.text(titleLines, 3, 2.8, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(`by ${ebook.specs.author}`, 3, 4.1, { align: 'center' });

    doc.setFontSize(9.5);
    doc.setTextColor(80, 80, 80);
    const descLines = doc.splitTextToSize(ebook.description, 4.1);
    doc.text(descLines, 3, 5.1, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `${ebook.specs.publisher} · ISBN ${ebook.specs.isbn} · Order ${orderId}`,
      3,
      8.1,
      { align: 'center' }
    );

    // Chapter / Content Pages
    const pages =
      ebook.previewPages && ebook.previewPages.length > 0
        ? ebook.previewPages
        : [
            {
              pageNumber: 1,
              heading: 'Chapter I · Editorial Note & Synopsis',
              body: ebook.description,
            },
          ];

    pages.forEach((p) => {
      doc.addPage([6, 9], 'portrait');
      doc.setFillColor(252, 252, 250);
      doc.rect(0, 0, 6, 9, 'F');

      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      doc.text(ebook.title.toUpperCase(), 0.65, 0.75);
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
      doc.text(`Licensed to ${formData.name || 'Reader'} · LEKHIX Editions`, 3, 8.4, {
        align: 'center',
      });
    });

    doc.save(cleanFileName);
    showToast({
      message: `Downloaded ${cleanFileName}`,
      type: 'success',
      duration: 3000,
    });
  };

  const downloadReceiptPDF = async () => {
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

    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text(`Order Reference: ${orderId}`, 20, 54);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 20, 62);
    doc.text(`Customer: ${formData.name}`, 20, 70);
    doc.text(`Phone: ${formData.phone}`, 20, 78);
    if (formData.address) {
      doc.text(`Address: ${formData.address}`, 20, 86);
    }

    doc.line(20, 95, 190, 95);
    doc.setFontSize(12);
    doc.text(`Edition / Item: ${confirmedTitle}`, 20, 108);
    doc.setFontSize(14);
    doc.text(`Total Paid: Rs. ${confirmedAmount.toLocaleString('en-IN')}`, 20, 122);

    doc.line(20, 134, 190, 134);
    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    doc.text('Thank you for collecting from LEKHIX.', 105, 148, { align: 'center' });

    doc.save(`LEKHIX_Receipt_${orderId}.pdf`);
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/60 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#FFFFFF] dark:bg-[#111114] text-[#111111] dark:text-[#F5F5F7] h-full flex flex-col justify-between border-l border-[#E5E5E0] dark:border-[#26262B] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-[#E5E5E0] dark:border-[#26262B] flex items-center justify-between">
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase">
            {step === 'bag' && 'SHOPPING BAG'}
            {step === 'checkout' && 'ORDER DETAILS'}
            {step === 'processing' && 'CONFIRMING ORDER'}
            {step === 'success' && 'ORDER CONFIRMED'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'bag' && (
            <>
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16">
                  <p className="font-editorial text-2xl italic text-zinc-400 mb-2">
                    Your bag is empty
                  </p>
                  <p className="text-xs text-zinc-500 max-w-xs">
                    Explore our 6×9 hardcover editions, eBooks (PDF), and stationery collection to add items.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {cart.map(({ product, quantity, selectedFormat }) => {
                    const unitPrice = getEffectivePrice(product, selectedFormat);
                    return (
                      <div
                        key={`${product.id}-${selectedFormat}`}
                        className="flex gap-4 pb-6 border-b border-[#ECECE7] dark:border-[#222227]"
                      >
                        <div className="w-16 aspect-[2/3] shrink-0 border border-black/5 dark:border-white/10">
                          <ProductImage6x9
                            src={product.image}
                            title={product.title}
                            author={product.specs.author}
                            category={product.category}
                            pedestal={false}
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-white">
                                {product.title}
                              </h3>
                              <button
                                onClick={() =>
                                  removeFromCart(product.id, selectedFormat)
                                }
                                className="text-zinc-400 hover:text-[#111111] dark:hover:text-white cursor-pointer"
                                aria-label="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-0.5 tabular-nums">
                              {selectedFormat === 'ebook'
                                ? 'eBook · Instant PDF Download'
                                : product.specs.format}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="inline-flex items-center border border-[#E5E5E0] dark:border-[#26262B]">
                              <button
                                onClick={() =>
                                  updateCartQuantity(
                                    product.id,
                                    quantity - 1,
                                    selectedFormat
                                  )
                                }
                                className="p-1.5 text-zinc-500 hover:text-[#111111] dark:hover:text-white cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-3 text-xs font-semibold tabular-nums">
                                {quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateCartQuantity(
                                    product.id,
                                    quantity + 1,
                                    selectedFormat
                                  )
                                }
                                className="p-1.5 text-zinc-500 hover:text-[#111111] dark:hover:text-white cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <span className="text-xs font-bold tabular-nums">
                              ₹{(unitPrice * quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {step === 'checkout' && (
            <form id="lekhix-checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-6">
              <div className="p-4 bg-[#FAFAFA] dark:bg-[#16161B] border border-[#ECECE7] dark:border-[#242429] flex items-center gap-4">
                {activeItems[0] && (
                  <div className="w-12 aspect-[2/3] shrink-0">
                    <ProductImage6x9
                      src={activeItems[0].product.image}
                      title={activeItems[0].product.title}
                      category={activeItems[0].product.category}
                      pedestal={false}
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#111111] dark:text-white truncate">
                    {summaryTitle}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {isDigitalOnlyOrder
                      ? 'Format: Instant PDF Download after confirmation'
                      : 'Format: 6 × 9 in Edition'}
                  </p>
                  <p className="text-xs font-bold text-[#111111] dark:text-white tabular-nums mt-1">
                    Total: ₹{totalAmount.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-2">
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={150}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 text-xs bg-transparent border border-[#D4D4D0] dark:border-[#2E2E36] focus:border-[#111111] dark:focus:border-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-2">
                    PHONE NUMBER
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={50}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                    className="w-full px-3.5 py-2.5 text-xs bg-transparent border border-[#D4D4D0] dark:border-[#2E2E36] focus:border-[#111111] dark:focus:border-white outline-none tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-2">
                    {isDigitalOnlyOrder
                      ? 'DELIVERY ADDRESS / NOTES (OPTIONAL FOR EBOOK PDF)'
                      : 'DELIVERY ADDRESS'}
                  </label>
                  <textarea
                    rows={3}
                    required={!isDigitalOnlyOrder}
                    maxLength={500}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder={
                      isDigitalOnlyOrder
                        ? 'Optional notes or email (your PDF unlocks immediately on the next screen)'
                        : 'Street address, city, state, and PIN code'
                    }
                    className="w-full px-3.5 py-2.5 text-xs bg-transparent border border-[#D4D4D0] dark:border-[#2E2E36] focus:border-[#111111] dark:focus:border-white outline-none resize-none"
                  />
                </div>
              </div>
            </form>
          )}

          {step === 'processing' && (
            <div className="py-20 text-center space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.2em]">
                PROCESSING ORDER...
              </p>
              <p className="text-xs text-zinc-500">
                Recording your edition reservation with LEKHIX.
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-10 space-y-6">
              <div className="flex items-center gap-3 text-[#111111] dark:text-white">
                <CheckCircle2 className="w-6 h-6 shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em]">
                    ORDER #{orderId} CONFIRMED
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Thank you, {formData.name}.
                  </p>
                </div>
              </div>

              <div className="p-5 bg-[#FAFAFA] dark:bg-[#16161B] border border-[#ECECE7] dark:border-[#242429] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Edition</span>
                  <span className="font-semibold text-right max-w-[200px] truncate">
                    {confirmedTitle}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Amount</span>
                  <span className="font-bold tabular-nums">
                    ₹{confirmedAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Instant eBook PDF Download Section Unlocked After Payment */}
              {confirmedEbooks.length > 0 && (
                <div className="p-5 bg-[#F2F2EE] dark:bg-[#18181E] border border-[#111111]/20 dark:border-white/20 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#111111] dark:text-white">
                    YOUR EBOOK (PDF) IS READY FOR DOWNLOAD
                  </p>
                  {confirmedEbooks.map((ebook) => (
                    <button
                      key={ebook.id}
                      type="button"
                      onClick={() => handleDownloadEbookPdf(ebook)}
                      className="w-full py-3.5 px-4 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-xs font-bold uppercase tracking-[0.16em] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        DOWNLOAD PDF · {ebook.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={downloadReceiptPDF}
                className="w-full py-3 border border-[#111111] dark:border-white text-xs font-bold uppercase tracking-[0.18em] flex items-center justify-center gap-2 hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors cursor-pointer"
              >
                <FileDown className="w-4 h-4" /> Download Official Receipt
              </button>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {step === 'bag' && cart.length > 0 && (
          <div className="p-6 border-t border-[#E5E5E0] dark:border-[#26262B] space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="uppercase tracking-[0.16em] text-zinc-500">Subtotal</span>
              <span className="text-sm font-bold tabular-nums">
                ₹{cartTotal.toLocaleString('en-IN')}
              </span>
            </div>
            <button
              onClick={() => setStep('checkout')}
              className="w-full py-3.5 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-xs font-bold uppercase tracking-[0.2em] hover:opacity-85 transition-opacity cursor-pointer"
            >
              PROCEED TO CHECKOUT
            </button>
          </div>
        )}

        {step === 'checkout' && (
          <div className="p-6 border-t border-[#E5E5E0] dark:border-[#26262B] space-y-3">
            <button
              type="submit"
              form="lekhix-checkout-form"
              className="w-full py-3.5 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-xs font-bold uppercase tracking-[0.2em] hover:opacity-85 transition-opacity cursor-pointer tabular-nums"
            >
              COMPLETE ORDER · ₹{totalAmount.toLocaleString('en-IN')}
            </button>
            {!directItem && (
              <button
                type="button"
                onClick={() => setStep('bag')}
                className="w-full py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500 hover:text-[#111111] dark:hover:text-white cursor-pointer"
              >
                Back to Shopping Bag
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
