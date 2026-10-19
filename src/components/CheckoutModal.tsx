import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, CheckCircle2, FileDown } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { CatalogItem, useCatalog } from '../context/CatalogContext';
import ProductImage6x9 from './ProductImage6x9';
import { useToast } from '../context/ToastContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  directItem?: CatalogItem | null;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  directItem = null,
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

  React.useEffect(() => {
    if (isOpen) {
      setStep(directItem ? 'checkout' : 'bag');
    }
  }, [isOpen, directItem]);

  if (!isOpen) return null;

  const activeItems = directItem
    ? [{ product: directItem, quantity: 1 }]
    : cart;

  const totalAmount = directItem
    ? Number(directItem.price)
    : cartTotal;

  const summaryTitle =
    activeItems.length === 1
      ? activeItems[0].product.title
      : `${activeItems[0]?.product.title || 'Order'} + ${activeItems.length - 1} more`;

  const summaryCategory =
    activeItems.length === 1 ? activeItems[0].product.category : 'Books & Stationery';

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
    setOrderId(newOrderId);
    setConfirmedAmount(totalAmount);
    setConfirmedTitle(summaryTitle);

    const path = 'orders';
    try {
      await addDoc(collection(db, path), {
        orderId: newOrderId,
        paymentId: paymentId.slice(0, 100),
        customerName: formData.name.trim().slice(0, 150),
        customerPhone: formData.phone.trim().slice(0, 50),
        customerAddress: formData.address.trim().slice(0, 500),
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
        message: `Order ${newOrderId} confirmed.`,
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
                    Explore our 6×9 hardcover editions and stationery collection to add items.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {cart.map(({ product, quantity }) => (
                    <div
                      key={product.id}
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
                              onClick={() => removeFromCart(product.id)}
                              className="text-zinc-400 hover:text-[#111111] dark:hover:text-white cursor-pointer"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5 tabular-nums">
                            {product.specs.format}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="inline-flex items-center border border-[#E5E5E0] dark:border-[#26262B]">
                            <button
                              onClick={() => updateCartQuantity(product.id, quantity - 1)}
                              className="p-1.5 text-zinc-500 hover:text-[#111111] dark:hover:text-white cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3 text-xs font-semibold tabular-nums">
                              {quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(product.id, quantity + 1)}
                              className="p-1.5 text-zinc-500 hover:text-[#111111] dark:hover:text-white cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="text-xs font-bold tabular-nums">
                            ₹{(product.price * quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
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
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums mt-1">
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
                    DELIVERY ADDRESS
                  </label>
                  <textarea
                    rows={3}
                    required
                    maxLength={500}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street address, city, state, and PIN code"
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
            <div className="py-12 space-y-6">
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
