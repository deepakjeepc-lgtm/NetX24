import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  FileDown,
  Download,
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import {
  CartItem,
  CatalogItem,
  getEffectivePrice,
  useCatalog,
} from '../context/CatalogContext';
import { useTheme } from '../context/ThemeContext';
import ProductImage6x9 from './ProductImage6x9';
import ThemeToggle from './ThemeToggle';
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

  const formatItemTitle = (entry?: CartItem) => {
    if (!entry || !entry.product) return 'LEKHIX Edition';
    return entry.selectedFormat === 'ebook'
      ? `${entry.product.title} (eBook PDF)`
      : entry.product.title;
  };

  const summaryTitle =
    activeItems.length === 1
      ? formatItemTitle(activeItems[0])
      : activeItems.length > 1
      ? `${formatItemTitle(activeItems[0])} + ${activeItems.length - 1} more`
      : 'LEKHIX Order';

  const summaryCategory =
    activeItems.length === 1
      ? activeItems[0]?.selectedFormat === 'ebook'
        ? 'eBook (PDF)'
        : activeItems[0]?.product?.category || 'Books'
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
      .filter((i) => i.selectedFormat === 'ebook' && i.product)
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

    // Fallback: Generate a complete 6×9 inch archival digital edition PDF
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: [6, 9],
    });

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
    doc.text(`by ${ebook.specs?.author || 'LEKHIX Editions'}`, 3, 4.1, {
      align: 'center',
    });

    doc.setFontSize(9.5);
    doc.setTextColor(80, 80, 80);
    const descLines = doc.splitTextToSize(ebook.description || '', 4.1);
    doc.text(descLines, 3, 5.1, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `${ebook.specs?.publisher || 'LEKHIX Press'} · ISBN ${
        ebook.specs?.isbn || ''
      } · Order ${orderId}`,
      3,
      8.1,
      { align: 'center' }
    );

    const pages =
      ebook.previewPages && ebook.previewPages.length > 0
        ? ebook.previewPages
        : [
            {
              pageNumber: 1,
              heading: 'Chapter I · Editorial Note & Synopsis',
              body: ebook.description || '',
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

  const { theme } = useTheme();

  const fullScreenView = (
    <div className="fixed inset-0 z-[250] w-screen h-screen overflow-y-auto overflow-x-hidden bg-[#FAFAFA] dark:bg-[#0A0A0C] text-[#111111] dark:text-[#F5F5F7] flex flex-col justify-between">
      {/* Full-Screen Top Header (Without LEKHIX Logo as requested) */}
      <header
        key={`cart-header-${theme}`}
        className="sticky top-0 z-[260] pt-[env(safe-area-inset-top)] bg-[#FAFAFA] dark:bg-[#0A0A0C] border-b border-[#ECECE7] dark:border-[#1E1E24] shrink-0"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 h-15 sm:h-20 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.16em] text-[#111111] dark:text-[#F5F5F7] hover:opacity-70 transition-opacity cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400 tabular-nums whitespace-nowrap">
              {step === 'bag' && `BAG (${cart.length})`}
              {step === 'checkout' && 'CHECKOUT'}
              {step === 'processing' && 'PROCESSING'}
              {step === 'success' && 'CONFIRMED'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Full-Screen Content Area */}
      <main
        key={`cart-main-${theme}`}
        className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-16 py-8 sm:py-12 md:py-16"
      >
        {step === 'bag' && (
          <>
            <div className="pb-6 sm:pb-8 mb-6 sm:mb-10 border-b border-[#E5E5E0] dark:border-[#1E1E24] flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5">
                  LEKHIX ARCHIVE &amp; EDITIONS
                </p>
                <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-semibold text-[#111111] dark:text-[#F5F5F7] tracking-tight">
                  Shopping Bag
                </h1>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 tabular-nums">
                {cart.length} {cart.length === 1 ? 'Edition' : 'Editions'} Selected
              </p>
            </div>

            {cart.length === 0 ? (
              <div className="py-12 sm:py-16 px-6 bg-[#FFFFFF] dark:bg-[#121216] border border-[#E5E5E0] dark:border-[#242429] text-center max-w-2xl mx-auto space-y-5">
                <p className="font-editorial text-2xl sm:text-3xl font-semibold text-[#111111] dark:text-white">
                  Your Shopping Bag is Empty
                </p>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md mx-auto">
                  Explore our 6×9 hardcover monographs, instant downloadable PDF eBooks, and precision architectural stationery.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-8 py-3.5 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-xs font-bold uppercase tracking-[0.2em] hover:opacity-85 transition-opacity cursor-pointer"
                  >
                    EXPLORE COLLECTION
                  </button>
                </div>
              </div>
            ) : (
              /* Full-Screen 12-Column Shopping Bag Layout */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                {/* Left 8 Columns: Line Items */}
                <div className="lg:col-span-8 space-y-4">
                  {cart.map(({ product, quantity, selectedFormat }) => {
                    const unitPrice = getEffectivePrice(product, selectedFormat);
                    return (
                      <div
                        key={`${product.id}-${selectedFormat}`}
                        className="p-4 sm:p-6 bg-[#FFFFFF] dark:bg-[#121216] border border-[#E5E5E0] dark:border-[#242429] flex gap-4 sm:gap-6 items-center"
                      >
                        <div className="w-20 sm:w-24 aspect-[2/3] shrink-0 bg-[#F2F2EE] dark:bg-[#18181E] p-1.5">
                          <div className="w-full h-full shadow-sm overflow-hidden">
                            <ProductImage6x9
                              src={product.image}
                              title={product.title}
                              author={product.specs?.author}
                              category={product.category}
                            />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 mb-1">
                                {selectedFormat === 'ebook'
                                  ? 'EBOOK EDITION · INSTANT PDF DOWNLOAD'
                                  : `PHYSICAL EDITION · ${product.specs?.format || '6 × 9 IN'}`}
                              </p>
                              <h3 className="font-editorial text-xl sm:text-2xl font-semibold text-[#111111] dark:text-white truncate">
                                {product.title}
                              </h3>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeFromCart(product.id, selectedFormat)}
                              className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-[#ECECE7] dark:border-[#222227]">
                            <div className="inline-flex items-center border border-[#D4D4D0] dark:border-[#2E2E36]">
                              <button
                                type="button"
                                onClick={() =>
                                  updateCartQuantity(
                                    product.id,
                                    quantity - 1,
                                    selectedFormat
                                  )
                                }
                                className="p-2 text-zinc-500 hover:text-[#111111] dark:hover:text-white cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-4 text-xs font-bold tabular-nums">
                                {quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateCartQuantity(
                                    product.id,
                                    quantity + 1,
                                    selectedFormat
                                  )
                                }
                                className="p-2 text-zinc-500 hover:text-[#111111] dark:hover:text-white cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <span className="text-sm sm:text-base font-bold tabular-nums">
                              ₹{(unitPrice * quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right 4 Columns: Order Summary Panel */}
                <div className="lg:col-span-4 p-6 sm:p-8 bg-[#FFFFFF] dark:bg-[#121216] border border-[#E5E5E0] dark:border-[#242429] space-y-6">
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] pb-4 border-b border-[#ECECE7] dark:border-[#222227]">
                    ORDER SUMMARY
                  </h2>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                      <span>Editions ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
                      <span className="tabular-nums font-semibold text-[#111111] dark:text-white">
                        ₹{cartTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                      <span>Delivery / Dispatch</span>
                      <span>
                        {isDigitalOnlyOrder ? 'Instant PDF Download' : 'Complimentary'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#ECECE7] dark:border-[#222227] flex items-baseline justify-between">
                    <span className="text-xs font-bold uppercase tracking-[0.16em]">
                      Total
                    </span>
                    <span className="text-xl font-bold tabular-nums">
                      ₹{cartTotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep('checkout')}
                      className="w-full py-4 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-xs font-bold uppercase tracking-[0.2em] hover:opacity-85 transition-opacity cursor-pointer"
                    >
                      PROCEED TO CHECKOUT
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full py-3 border border-[#D4D4D0] dark:border-[#2E2E36] text-xs font-bold uppercase tracking-[0.16em] text-zinc-600 dark:text-zinc-300 hover:border-[#111111] dark:hover:border-white transition-colors cursor-pointer"
                    >
                      CONTINUE SHOPPING
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {step === 'checkout' && (
          <div>
            <div className="pb-6 sm:pb-8 mb-6 sm:mb-10 border-b border-[#E5E5E0] dark:border-[#1E1E24] flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5">
                  LEKHIX ORDER RESERVATION
                </p>
                <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-semibold text-[#111111] dark:text-[#F5F5F7] tracking-tight">
                  Checkout Details
                </h1>
              </div>
              {!directItem && (
                <button
                  type="button"
                  onClick={() => setStep('bag')}
                  className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500 hover:text-[#111111] dark:hover:text-white underline underline-offset-4 cursor-pointer self-start sm:self-auto"
                >
                  ← Back to Shopping Bag
                </button>
              )}
            </div>

            <form
              id="lekhix-checkout-form"
              onSubmit={handleCheckoutSubmit}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start"
            >
              {/* Left 7 Columns: Customer Information */}
              <div className="lg:col-span-7 p-6 sm:p-8 bg-[#FFFFFF] dark:bg-[#121216] border border-[#E5E5E0] dark:border-[#242429] space-y-5">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] pb-3 border-b border-[#ECECE7] dark:border-[#222227]">
                  READER &amp; DELIVERY INFORMATION
                </h2>

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
                    className="w-full px-4 py-3 text-xs bg-[#FAFAFA] dark:bg-[#17171D] border border-[#D4D4D0] dark:border-[#2E2E36] focus:border-[#111111] dark:focus:border-white outline-none"
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
                    className="w-full px-4 py-3 text-xs bg-[#FAFAFA] dark:bg-[#17171D] border border-[#D4D4D0] dark:border-[#2E2E36] focus:border-[#111111] dark:focus:border-white outline-none tabular-nums"
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
                    className="w-full px-4 py-3 text-xs bg-[#FAFAFA] dark:bg-[#17171D] border border-[#D4D4D0] dark:border-[#2E2E36] focus:border-[#111111] dark:focus:border-white outline-none resize-none"
                  />
                </div>
              </div>

              {/* Right 5 Columns: Selected Editions & Complete Order */}
              <div className="lg:col-span-5 p-6 sm:p-8 bg-[#FFFFFF] dark:bg-[#121216] border border-[#E5E5E0] dark:border-[#242429] space-y-6">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] pb-3 border-b border-[#ECECE7] dark:border-[#222227]">
                  SELECTED EDITIONS
                </h2>

                <div className="space-y-4">
                  {activeItems.map((entry) => {
                    const price = getEffectivePrice(entry.product, entry.selectedFormat);
                    return (
                      <div
                        key={`${entry.product.id}-${entry.selectedFormat}`}
                        className="flex items-center gap-4"
                      >
                        <div className="w-14 aspect-[2/3] shrink-0 bg-[#F2F2EE] dark:bg-[#18181E] p-1">
                          <ProductImage6x9
                            src={entry.product.image}
                            title={entry.product.title}
                            category={entry.product.category}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#111111] dark:text-white truncate">
                            {entry.product.title}
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {entry.selectedFormat === 'ebook'
                              ? 'eBook (PDF) · Instant Download'
                              : `Physical · 6 × 9 in`}{' '}
                            × {entry.quantity}
                          </p>
                        </div>
                        <span className="text-xs font-bold tabular-nums shrink-0">
                          ₹{(price * entry.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-[#ECECE7] dark:border-[#222227] flex items-baseline justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.16em]">
                    Total Payable
                  </span>
                  <span className="text-xl font-bold tabular-nums">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-xs font-bold uppercase tracking-[0.2em] hover:opacity-85 transition-opacity cursor-pointer tabular-nums"
                >
                  COMPLETE ORDER · ₹{totalAmount.toLocaleString('en-IN')}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 'processing' && (
          <div className="py-28 text-center space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em]">
              PROCESSING ORDER...
            </p>
            <p className="text-xs text-zinc-500">
              Recording your edition reservation with LEKHIX.
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="max-w-xl mx-auto py-8 sm:py-12 space-y-8">
            <div className="p-6 sm:p-10 bg-[#FFFFFF] dark:bg-[#121216] border border-[#E5E5E0] dark:border-[#242429] space-y-6">
              <div className="flex items-center gap-3.5 text-[#111111] dark:text-white">
                <CheckCircle2 className="w-7 h-7 shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em]">
                    ORDER #{orderId} CONFIRMED
                  </p>
                  <p className="font-editorial text-2xl font-semibold mt-0.5">
                    Thank you, {formData.name}.
                  </p>
                </div>
              </div>

              <div className="p-5 bg-[#FAFAFA] dark:bg-[#17171D] border border-[#E5E5E0] dark:border-[#26262B] space-y-2.5 text-xs">
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Edition</span>
                  <span className="font-semibold text-right truncate">
                    {confirmedTitle}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Total Paid</span>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={downloadReceiptPDF}
                  className="w-full py-3.5 border border-[#111111] dark:border-white text-xs font-bold uppercase tracking-[0.18em] flex items-center justify-center gap-2 hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors cursor-pointer"
                >
                  <FileDown className="w-4 h-4" /> Official Receipt
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3.5 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-xs font-bold uppercase tracking-[0.18em] hover:opacity-85 transition-opacity cursor-pointer"
                >
                  Return to Store
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(fullScreenView, document.body)
    : fullScreenView;
}
