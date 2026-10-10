import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, CheckCircle2, FileDown } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';
import { addRecentDownload } from '../utils/recentDownloads';

export type CheckoutItem = {
  title: string;
  price: string | number;
  type: 'Service' | 'IGNOU Notes';
  downloads?: { name: string, url: string }[];
};

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CheckoutItem | null;
}

export default function CheckoutModal({ isOpen, onClose, item }: CheckoutModalProps) {
  const [step, setStep] = useState<'details' | 'payment' | 'processing' | 'success'>('details');
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [orderId, setOrderId] = useState('');
  const [downloadStatus, setDownloadStatus] = useState<Record<number, 'downloading' | 'downloaded'>>({});
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const { showToast } = useToast();

  React.useEffect(() => {
    if (isOpen) {
      try {
        const saved = JSON.parse(localStorage.getItem('netxpay_orders') || '[]');
        setRecentOrders(saved);
      } catch (e) {
        console.error("Failed to load local orders", e);
      }
    } else {
      // Reset step when modal closes
      setTimeout(() => setStep('details'), 300);
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  // Load Razorpay script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing'); // Show processing while creating order

    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      alert("Failed to load Razorpay SDK. Are you online?");
      setStep('details');
      return;
    }

    try {
      // 1. Create Order on Backend
      const response = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Number(item.price) * 100, // Razorpay works in paise
        }),
      });
      const data = await response.json();
      
      if (!data || data.error) {
        throw new Error(data.error || "Failed to create order");
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: data.isMock ? "rzp_test_mock" : import.meta.env.VITE_RAZORPAY_KEY_ID || "",
        amount: data.amount,
        currency: data.currency,
        name: "NetX24 Cyber Cafe",
        description: `Payment for ${item.title}`,
        order_id: data.isMock ? "" : data.id, // For mock, omit order_id
        handler: function (response: any) {
          // Success callback
          // response.razorpay_payment_id
          // response.razorpay_order_id
          // response.razorpay_signature
          handlePaymentSuccess(response.razorpay_payment_id);
        },
        prefill: {
          name: formData.name,
          contact: formData.phone,
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      
      paymentObject.on('payment.failed', function (response: any) {
        alert("Payment failed: " + response.error.description);
        setStep('details');
      });

      paymentObject.open();
      
      // We keep step as details so modal doesn't show loading forever if they close popup
      setStep('details');
      
    } catch (error) {
      console.error(error);
      alert("Error initializing payment");
      setStep('details');
    }
  };

  const handlePaymentSuccess = async (paymentId?: string) => {
    setStep('processing');
    try {
      // 1. Save order to Firebase
      const newOrderId = `ORD${Date.now()}`;
      setOrderId(newOrderId);
      
      await addDoc(collection(db, 'orders'), {
        orderId: newOrderId,
        paymentId: paymentId || "mock_payment",
        customerName: formData.name,
        customerPhone: formData.phone,
        itemName: item.title,
        itemType: item.type,
        amount: Number(item.price),
        status: 'Success',
        createdAt: serverTimestamp()
      });

      // Save to local storage for "Recent Requests"
      try {
        const localOrder = {
          orderId: newOrderId,
          itemName: item.title,
          itemType: item.type,
          amount: Number(item.price),
          date: new Date().toISOString(),
          downloads: item.downloads
        };
        const savedOrders = JSON.parse(localStorage.getItem('netxpay_orders') || '[]');
        savedOrders.unshift(localOrder);
        localStorage.setItem('netxpay_orders', JSON.stringify(savedOrders.slice(0, 3))); // Keep last 3
      } catch (e) {
        console.error("Failed to save local order", e);
      }

      // 2. Move to success step
      setStep('success');
      
      if (item.type === 'Service') {
        showToast({ message: 'Your document has been sent to the print queue.', type: 'info', duration: 4000 });
      } else {
        showToast({ message: 'Payment successful. Ready to download.', type: 'success', duration: 4000 });
      }
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Error updating order. Please contact support.");
      setStep('details');
    }
  };

  const generatePDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    // Add Cafe Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Indigo 600
    doc.text('NetX24 Cyber Cafe', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Payment Receipt / Order Confirmation', 105, 30, { align: 'center' });
    
    // Divider line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 40, 190, 40);

    // Order Details
    doc.setFontSize(14);
    doc.setTextColor(20, 20, 20);
    doc.text('Order Details:', 20, 55);
    
    doc.setFontSize(12);
    doc.text(`Order ID: ${orderId}`, 20, 65);
    doc.text(`Date: ${new Date().toLocaleString()}`, 20, 75);
    doc.text(`Item: ${item.title}`, 20, 85);
    doc.text(`Category: ${item.type}`, 20, 95);
    
    doc.setFontSize(16);
    doc.text(`Amount Paid: Rs. ${item.price}`, 20, 110);
    
    // Customer Details
    doc.setFontSize(14);
    doc.text('Customer Details:', 120, 55);
    
    doc.setFontSize(12);
    doc.text(`Name: ${formData.name}`, 120, 65);
    doc.text(`Phone: ${formData.phone}`, 120, 75);

    doc.line(20, 125, 190, 125);
    
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for choosing NetX24 Cyber Cafe!', 105, 140, { align: 'center' });
    doc.text('This is a computer generated receipt.', 105, 148, { align: 'center' });

    doc.save(`Receipt_${orderId}.pdf`);

    addRecentDownload({
      title: `Receipt - ${item.title}`,
      category: 'Receipt'
    });
  };

  const downloadNotesPDF = async () => {
    // If no real downloads are provided, fallback to sample generated PDF
    if (!item?.downloads || item.downloads.length === 0) {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      doc.setFontSize(24);
      doc.setTextColor(40, 40, 40);
      doc.text('IGNOU Notes & Assignments', 105, 30, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text('Subject: ' + item?.title, 105, 50, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      const content = 'This is a sample generated PDF containing the notes for your purchased subject. In a real application, this would download the actual PDF file from secure cloud storage. Thank you for purchasing from NetX24 Cyber Cafe!';
      const lines = doc.splitTextToSize(content, 170);
      doc.text(lines, 20, 80);
      
      doc.save(`IGNOU_Notes_${orderId}.pdf`);

      addRecentDownload({
        title: item?.title || 'IGNOU Notes',
        category: 'IGNOU Notes'
      });
      return;
    }
  };

  const handleRealDownload = (url: string, name: string, index: number) => {
    setDownloadStatus(prev => ({ ...prev, [index]: 'downloading' }));
    
    let linkToDownload = url;
    // Auto-convert Google Drive sharing link to direct download link
    if (linkToDownload.includes('drive.google.com/file/d/')) {
      const match = linkToDownload.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        linkToDownload = `https://drive.google.com/uc?export=download&id=${match[1]}`;
      }
    }

    addRecentDownload({
      title: name || item?.title || 'IGNOU Document',
      category: 'IGNOU Notes',
      url: linkToDownload
    });
    
    // Use standard anchor tag download which works reliably for Drive links
    const a = document.createElement('a');
    a.href = linkToDownload;
    a.download = `${name}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Set to downloaded state after fake delay to give visual feedback
    setTimeout(() => {
      setDownloadStatus(prev => ({ ...prev, [index]: 'downloaded' }));
    }, 3500);
  };

  const handleClose = () => {
    setStep('details');
    setFormData({ name: '', phone: '' });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={step === 'details' ? handleClose : undefined}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-xl w-full max-w-md relative z-10 overflow-hidden"
        >
          {step === 'details' && (
            <>
              <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md">
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-xl">Checkout</h3>
                <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-slate-800 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm border border-slate-200 dark:border-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 sm:p-6 bg-white dark:bg-[#1C1D20]">
                <div className="bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-5 mb-6">
                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1.5 uppercase tracking-wider">{item.type}</div>
                  <div className="font-bold text-slate-900 dark:text-white text-base sm:text-lg mb-3 leading-tight">{item.title}</div>
                  <div className="flex items-baseline gap-1">
                    <div className="text-3xl font-display font-black text-indigo-600 dark:text-indigo-400 leading-none">₹{item.price}</div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">total</span>
                  </div>
                </div>

                <form onSubmit={handleProceedToPayment} className="space-y-4">
                  <div>
                    <input 
                      type="text" required
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      placeholder="Full Name"
                    />
                  </div>
                  <div>
                    <input 
                      type="tel" required
                      value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      placeholder="Phone Number"
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold py-4 px-4 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    Proceed to Pay ₹{item.price}
                  </button>
                </form>
                <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 mt-5 font-medium flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Secured by NetXPay
                </p>

                {recentOrders.length > 0 && (
                  <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Recent Requests</h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto hide-scrollbar pr-1">
                      {recentOrders.map((order, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50 flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{order.itemName}</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">{new Date(order.date).toLocaleDateString()} &middot; {order.orderId}</span>
                            </div>
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">₹{order.amount}</span>
                          </div>
                          {order.downloads && order.downloads.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {order.downloads.map((d: any, dIdx: number) => {
                                const dStatus = downloadStatus[1000 + idx * 10 + dIdx];
                                return (
                                  <button
                                    key={dIdx}
                                    disabled={dStatus === 'downloading'}
                                    onClick={() => handleRealDownload(d.url, d.name, 1000 + idx * 10 + dIdx)}
                                    className="text-[10px] flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors font-medium disabled:opacity-50"
                                  >
                                    {dStatus === 'downloading' ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
                                    {d.name}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {step === 'processing' && (
            <div className="p-12 text-center flex flex-col items-center justify-center min-h-[400px] bg-white dark:bg-[#1C1D20]">
              <Loader2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Processing Payment...</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Please do not close this window or press back.</p>
            </div>
          )}

          {step === 'success' && (
            <div className="p-10 text-center flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-b from-emerald-50/50 to-white dark:from-emerald-900/20 dark:to-[#1C1D20]">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Payment Successful!</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8">Your order <span className="font-semibold text-slate-900 dark:text-white">{orderId}</span> has been confirmed.</p>
              
              <div className="relative w-full">
                <div 
                  className="w-full space-y-3 max-h-64 overflow-y-auto hide-scrollbar pb-12 pt-4 rounded-2xl"
                  style={{
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 24px, black calc(100% - 32px), transparent)',
                    maskImage: 'linear-gradient(to bottom, transparent, black 24px, black calc(100% - 32px), transparent)'
                  }}
                >
                  {item.type === 'IGNOU Notes' && item.downloads && item.downloads.length > 0 ? (
                    item.downloads.map((d, idx) => {
                      const status = downloadStatus[idx];
                      
                      let btnClass = "w-full flex items-center justify-center gap-2 font-bold py-3.5 px-4 rounded-xl transition-all ";
                      let btnContent;

                      if (status === 'downloading') {
                        btnClass += "bg-indigo-600/70 dark:bg-indigo-500/70 text-white cursor-wait";
                        btnContent = <><Loader2 className="w-5 h-5 animate-spin" /> Downloading...</>;
                      } else if (status === 'downloaded') {
                        btnClass += "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20";
                        btnContent = <><CheckCircle2 className="w-5 h-5" /> Downloaded</>;
                      } else {
                        btnClass += "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-md shadow-indigo-600/20";
                        btnContent = <><FileDown className="w-5 h-5" /> Download {d.name}</>;
                      }

                      return (
                        <button 
                          key={idx}
                          onClick={() => handleRealDownload(d.url, d.name, idx)}
                          disabled={status === 'downloading'}
                          className={btnClass}
                        >
                          {btnContent}
                        </button>
                      );
                    })
                  ) : item.type === 'IGNOU Notes' && (
                    <button 
                      onClick={downloadNotesPDF}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all"
                    >
                      <FileDown className="w-5 h-5" /> Download Notes PDF
                    </button>
                  )}
                  <button 
                    onClick={generatePDF}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all"
                  >
                    <FileDown className="w-5 h-5" /> Download Receipt PDF
                  </button>
                  <button 
                    onClick={handleClose}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-xl transition-all"
                  >
                    Close & Continue
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
