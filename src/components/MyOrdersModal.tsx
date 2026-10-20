import React from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  Download,
  FileDown,
  CheckCircle2,
} from 'lucide-react';
import {
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
import { haptic } from '../utils/haptics';

interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MyOrdersModal({ isOpen, onClose }: MyOrdersModalProps) {
  const { userOrders, catalog } = useCatalog();
  const { theme } = useTheme();
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleRedownloadEbook = async (
    order: UserOrderRecord,
    item: OrderedItemSnapshot
  ) => {
    haptic.medium();
    // Prefer latest catalog item if still in catalog (e.g. updated PDF URL), fallback to snapshot
    const liveItem = catalog.find((c) => c.id === item.productId);
    const source = liveItem
      ? {
          ...liveItem,
          ebookPdfUrl: liveItem.ebookPdfUrl || item.ebookPdfUrl,
          ebookFileName: liveItem.ebookFileName || item.ebookFileName,
          synopsisPdfUrl: liveItem.synopsisPdfUrl || item.synopsisPdfUrl,
          synopsisFileName: liveItem.synopsisFileName || item.synopsisFileName,
        }
      : item;

    const fileName = await triggerEbookPdfDownload(
      source,
      order.orderId,
      order.customerName
    );
    showToast({
      message: `Downloading ${fileName}...`,
      type: 'success',
      duration: 3000,
    });
  };

  const handleDownloadReceipt = async (order: UserOrderRecord) => {
    haptic.light();
    await downloadOrderReceiptPdf(order);
    showToast({
      message: `Receipt downloaded for Order #${order.orderId}`,
      type: 'info',
      duration: 2500,
    });
  };

  const formatOrderDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const fullScreenView = (
    <div className="fixed inset-0 z-[250] w-screen h-screen overflow-y-auto overflow-x-hidden bg-[#FAFAFA] dark:bg-[#0A0A0C] text-[#111111] dark:text-[#F5F5F7] flex flex-col justify-between">
      {/* Full-Screen Top Header matching Cart design language */}
      <header
        key={`orders-header-${theme}`}
        className="sticky top-0 z-[260] pt-[env(safe-area-inset-top)] bg-[#FAFAFA] dark:bg-[#0A0A0C] border-b border-[#ECECE7] dark:border-[#1E1E24] shrink-0"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 h-15 sm:h-20 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              haptic.light();
              onClose();
            }}
            className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.16em] text-[#111111] dark:text-[#F5F5F7] hover:opacity-70 transition-opacity cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400 tabular-nums whitespace-nowrap">
              MY ORDERS ({userOrders.length})
            </span>
          </div>
        </div>
      </header>

      {/* Main Full-Screen Content Area */}
      <main
        key={`orders-main-${theme}`}
        className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-16 py-8 sm:py-12 md:py-16"
      >
        <div className="pb-6 sm:pb-8 mb-6 sm:mb-10 border-b border-[#E5E5E0] dark:border-[#1E1E24] flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5">
              LEKHIX ORDER ARCHIVE &amp; DIGITAL LIBRARY
            </p>
            <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-semibold text-[#111111] dark:text-[#F5F5F7] tracking-tight">
              My Orders
            </h1>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 tabular-nums">
            {userOrders.length} {userOrders.length === 1 ? 'Order' : 'Orders'} Placed
          </p>
        </div>

        {userOrders.length === 0 ? (
          <div className="py-12 sm:py-16 px-6 bg-[#FFFFFF] dark:bg-[#121216] border border-[#E5E5E0] dark:border-[#242429] text-center max-w-2xl mx-auto space-y-5">
            <p className="font-editorial text-2xl sm:text-3xl font-semibold text-[#111111] dark:text-white">
              No Orders Placed Yet
            </p>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md mx-auto">
              Your purchased 6×9 hardcover editions, stationery sets, and instant downloadable PDF eBooks will appear here so you can view receipts and re-download your eBooks anytime.
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
          <div className="space-y-6 sm:space-y-8">
            {userOrders.map((order) => (
              <section
                key={order.orderId}
                className="bg-[#FFFFFF] dark:bg-[#121216] border border-[#E5E5E0] dark:border-[#242429]"
              >
                {/* Order Summary Top Strip */}
                <div className="p-4 sm:p-6 border-b border-[#ECECE7] dark:border-[#222227] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAFAFA] dark:bg-[#15151A]">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                    <div className="inline-flex items-center gap-2 font-bold uppercase tracking-[0.16em] text-[#111111] dark:text-white tabular-nums">
                      <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                      <span>ORDER #{order.orderId}</span>
                    </div>
                    <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">·</span>
                    <span className="text-zinc-500 dark:text-zinc-400 tabular-nums">
                      {formatOrderDate(order.createdAtIso)}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">·</span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-600 dark:text-zinc-300">
                      {order.customerName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#ECECE7] dark:border-[#222227]">
                    <div className="text-xs tabular-nums">
                      <span className="text-zinc-400 uppercase tracking-[0.14em] text-[10px] mr-2">
                        TOTAL PAID
                      </span>
                      <span className="font-bold text-sm text-[#111111] dark:text-white">
                        ₹{order.amount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadReceipt(order)}
                      className="px-3.5 py-2 border border-[#111111]/30 dark:border-white/30 text-[10px] font-bold uppercase tracking-[0.16em] text-[#111111] dark:text-white hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Receipt PDF</span>
                    </button>
                  </div>
                </div>

                {/* Order Line Items & eBook Re-Download Controls */}
                <div className="divide-y divide-[#ECECE7] dark:divide-[#222227]">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => {
                      const liveItem = catalog.find((c) => c.id === item.productId);
                      const coverImage = liveItem?.image || item.image;
                      const isEbook = item.selectedFormat === 'ebook';

                      return (
                        <div
                          key={`${order.orderId}-${item.productId}-${idx}`}
                          className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6"
                        >
                          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                            <div className="w-16 sm:w-20 aspect-[2/3] shrink-0 bg-[#F2F2EE] dark:bg-[#18181E] p-1.5">
                              <div className="w-full h-full shadow-sm overflow-hidden">
                                <ProductImage6x9
                                  src={coverImage}
                                  title={item.title}
                                  author={item.author}
                                  category={item.category}
                                  courseCode={liveItem?.ignouCourseCode}
                                  programCode={liveItem?.ignouProgramCode}
                                  year={liveItem?.ignouYear}
                                  releaseDate={liveItem?.specs?.releaseDate}
                                />
                              </div>
                            </div>

                            <div className="min-w-0 space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                                {isEbook
                                  ? item.category === 'IGNOU'
                                    ? 'IGNOU · PDF'
                                    : 'EBOOK PDF'
                                  : item.category === 'IGNOU'
                                  ? `IGNOU · ${getPhysicalFormatLabel(
                                      liveItem || item
                                    )}`
                                  : `PHYSICAL · ${item.formatSpec || '6 × 9 IN'}`}
                              </p>
                              <h3 className="font-editorial text-lg sm:text-2xl font-semibold text-[#111111] dark:text-white truncate">
                                {item.title}
                              </h3>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                                Qty: {item.quantity} · ₹
                                {(item.price * item.quantity).toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>

                          {/* eBook Instant Re-Download Button */}
                          <div className="flex items-center justify-end shrink-0">
                            {isEbook ? (
                              <button
                                type="button"
                                onClick={() => handleRedownloadEbook(order, item)}
                                className="w-full sm:w-auto px-5 py-3 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-[11px] font-bold uppercase tracking-[0.18em] hover:opacity-85 transition-opacity inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                              >
                                <Download className="w-3.5 h-3.5 shrink-0" />
                                <span>RE-DOWNLOAD PDF</span>
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 px-3 py-2 border border-[#E5E5E0] dark:border-[#26262B]">
                                PHYSICAL DISPATCH · {order.status.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 sm:p-6 flex items-center justify-between text-xs">
                      <span className="font-semibold">{order.itemName}</span>
                      <span className="tabular-nums font-bold">
                        ₹{order.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(fullScreenView, document.body)
    : fullScreenView;
}
