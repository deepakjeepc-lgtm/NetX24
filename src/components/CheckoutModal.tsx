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
  getPhysicalFormatLabel,
  useCatalog,
} from '../context/CatalogContext';
import { useTheme } from '../context/ThemeContext';
import ProductImage6x9 from './ProductImage6x9';
import ThemeToggle from './ThemeToggle';
import { useToast } from '../context/ToastContext';
import {
  downloadOrderReceiptPdf,
  OrderedItemSnapshot,
  triggerEbookPdfDownload,
  UserOrderRecord,
} from '../utils/ebookDownload';

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
    addUserOrder,
    setIsOrdersOpen,
  } = useCatalog();
  const { theme } = useTheme();
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
      ? `${entry.product.title} (PDF)`
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

    const itemSnapshots: OrderedItemSnapshot[] = activeItems.map((entry) => ({
      productId: entry.product.id,
      title: entry.product.title,
      category: entry.product.category,
      image: entry.product.image,
      price: getEffectivePrice(entry.product, entry.selectedFormat),
      quantity: entry.quantity,
      selectedFormat: entry.selectedFormat,
      author: entry.product.specs?.author,
      publisher: entry.product.specs?.publisher,
      isbn: entry.product.specs?.isbn,
      formatSpec: entry.product.specs?.format,
      description: entry.product.description,
      ebookPdfUrl: entry.product.ebookPdfUrl,
      ebookFileName: entry.product.ebookFileName,
      synopsisPdfUrl: entry.product.synopsisPdfUrl,
      synopsisFileName: entry.product.synopsisFileName,
      ignouMaterialType: entry.product.ignouMaterialType,
    }));

    const resolvedAddress = (
      formData.address.trim() ||
      (isDigitalOnlyOrder ? 'Digital eBook (Instant PDF Delivery)' : '')
    ).slice(0, 500);

    const newUserOrder: UserOrderRecord = {
      orderId: newOrderId,
      paymentId: paymentId.slice(0, 100),
      customerName: formData.name.trim().slice(0, 150),
      customerPhone: formData.phone.trim().slice(0, 50),
      customerAddress: resolvedAddress,
      itemName: summaryTitle.slice(0, 500),
      itemType: summaryCategory.slice(0, 100),
      amount: Number(totalAmount),
      status: 'Success',
      createdAtIso: new Date().toISOString(),
      items: itemSnapshots,
    };

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
        customerAddress: resolvedAddress,
        itemName: summaryTitle.slice(0, 500),
        itemType: summaryCategory.slice(0, 100),
        amount: Number(totalAmount),
        status: 'Success',
        createdAt: serverTimestamp(),
      });

      // Save to My Orders so user can view & re-download eBooks anytime
      addUserOrder(newUserOrder);

      if (!directItem) {
        clearCart();
      }
      setStep('success');

      // Immediately auto-download purchased eBook PDFs upon confirmation
      if (purchasedEbooks.length > 0) {
        for (const ebook of purchasedEbooks) {
          await triggerEbookPdfDownload(
            ebook,
            newOrderId,
            formData.name.trim()
          );
        }
      }

      showToast({
        message:
          purchasedEbooks.length > 0
            ? `Order ${newOrderId} confirmed! Downloading your eBook PDF now (also saved in My Orders).`
            : `Order ${newOrderId} confirmed and saved to My Orders.`,
        type: 'success',
        duration: 4500,
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
    const fileName = await triggerEbookPdfDownload(
      ebook,
      orderId,
      formData.name
    );
    showToast({
      message: `Downloading ${fileName}...`,
      type: 'success',
      duration: 3000,
    });
  };

  const downloadReceiptPDF = async () => {
    await downloadOrderReceiptPdf({
      orderId,
      customerName: formData.name,
      customerPhone: formData.phone,
      customerAddress: formData.address,
      itemName: confirmedTitle,
      amount: confirmedAmount,
    });
  };

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
                  Explore our books, IGNOU study materials, instant downloadable PDF eBooks, and architectural stationery.
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
                              courseCode={product.ignouCourseCode}
                              programCode={product.ignouProgramCode}
                              year={product.ignouYear}
                              releaseDate={product.specs?.releaseDate}
                            />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 mb-1">
                                {selectedFormat === 'ebook'
                                  ? product.category === 'IGNOU'
                                    ? 'IGNOU · PDF'
                                    : 'EBOOK PDF'
                                  : product.category === 'IGNOU'
                                  ? `IGNOU · ${getPhysicalFormatLabel(product)}`
                                  : 'PHYSICAL EDITION'}
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
              <div className="lg:col-span-7 p-6 sm:p-8 bg-[#FFFFFF] dark:bg-[#121216] border border-[#E5E5E0] dark:border-[#242429] space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] pb-3 border-b border-[#ECECE7] dark:border-[#222227]">
                  READER &amp; DELIVERY INFORMATION
                </h2>

                <div>
                  <input
                    type="text"
                    required
                    maxLength={150}
                    aria-label="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="FULL NAME"
                    className="w-full px-4 py-3 text-xs text-[#111111] dark:text-[#F5F5F7] bg-[#FAFAFA] dark:bg-[#17171D] border border-[#D4D4D0] dark:border-[#2E2E36] focus:border-[#111111] dark:focus:border-white outline-none transition-colors placeholder:text-[10px] placeholder:font-semibold placeholder:uppercase placeholder:tracking-[0.16em] placeholder:text-zinc-400/75 dark:placeholder:text-zinc-500"
                  />
                </div>

                <div>
                  <input
                    type="tel"
                    required
                    maxLength={50}
                    aria-label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="PHONE NUMBER (10-DIGIT MOBILE)"
                    className="w-full px-4 py-3 text-xs text-[#111111] dark:text-[#F5F5F7] bg-[#FAFAFA] dark:bg-[#17171D] border border-[#D4D4D0] dark:border-[#2E2E36] focus:border-[#111111] dark:focus:border-white outline-none transition-colors tabular-nums placeholder:text-[10px] placeholder:font-semibold placeholder:uppercase placeholder:tracking-[0.16em] placeholder:text-zinc-400/75 dark:placeholder:text-zinc-500"
                  />
                </div>

                <div>
                  <textarea
                    rows={3}
                    required={!isDigitalOnlyOrder}
                    maxLength={500}
                    aria-label="Delivery Address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder={
                      isDigitalOnlyOrder
                        ? 'DELIVERY ADDRESS OR EMAIL (OPTIONAL FOR PDF)'
                        : 'DELIVERY ADDRESS (STREET, CITY, STATE & PIN CODE)'
                    }
                    className="w-full px-4 py-3 text-xs text-[#111111] dark:text-[#F5F5F7] bg-[#FAFAFA] dark:bg-[#17171D] border border-[#D4D4D0] dark:border-[#2E2E36] focus:border-[#111111] dark:focus:border-white outline-none transition-colors resize-none placeholder:text-[10px] placeholder:font-semibold placeholder:uppercase placeholder:tracking-[0.16em] placeholder:text-zinc-400/75 dark:placeholder:text-zinc-500"
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
                              ? 'PDF · Instant Download'
                              : getPhysicalFormatLabel(entry.product)}{' '}
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
                    EBOOK (PDF) DOWNLOADED · AVAILABLE ANYTIME IN MY ORDERS
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
                        RE-DOWNLOAD PDF · {ebook.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  type="button"
                  onClick={downloadReceiptPDF}
                  className="w-full py-3.5 border border-[#111111] dark:border-white text-xs font-bold uppercase tracking-[0.16em] flex items-center justify-center gap-2 hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <FileDown className="w-4 h-4" /> Receipt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setIsOrdersOpen(true);
                  }}
                  className="w-full py-3.5 border border-[#111111] dark:border-white text-xs font-bold uppercase tracking-[0.16em] hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors cursor-pointer whitespace-nowrap"
                >
                  My Orders
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3.5 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-xs font-bold uppercase tracking-[0.16em] hover:opacity-85 transition-opacity cursor-pointer whitespace-nowrap"
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
