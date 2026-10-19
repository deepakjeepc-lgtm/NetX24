import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

export default function OrdersView() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        let snap;
        try {
          const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
          snap = await getDocs(q);
        } catch {
          snap = await getDocs(collection(db, 'orders'));
        }
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a: any, b: any) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
        setOrders(data);
      } catch (e: any) {
        console.warn('Orders fetch note:', e?.message || e);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="py-12 text-xs uppercase tracking-[0.2em] text-zinc-400">
        Loading Orders...
      </div>
    );
  }

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#141418] border border-[#E5E5E0] dark:border-[#26262B] overflow-hidden">
      <div className="px-6 py-5 border-b border-[#E5E5E0] dark:border-[#26262B] flex items-center justify-between">
        <div>
          <h2 className="font-editorial text-xl font-semibold text-[#111111] dark:text-white">
            Order Ledger
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Customer book &amp; stationery acquisitions
          </p>
        </div>
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 tabular-nums">
          Total: {orders.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-[10px] uppercase tracking-[0.18em] text-zinc-400 border-b border-[#ECECE7] dark:border-[#222227]">
            <tr>
              <th className="px-6 py-4">Order ID &amp; Date</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Edition / Item</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ECECE7] dark:divide-[#222227]">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-14 text-center text-zinc-500">
                  No orders recorded yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#18181D]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-[#111111] dark:text-white tabular-nums">
                      {order.orderId}
                    </div>
                    <div className="text-[11px] text-zinc-500 tabular-nums mt-0.5">
                      {order.createdAt?.toDate
                        ? new Date(order.createdAt.toDate()).toLocaleDateString('en-IN')
                        : 'Recent'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-[#111111] dark:text-white">
                      {order.customerName}
                    </div>
                    <div className="text-[11px] text-zinc-500 tabular-nums">
                      {order.customerPhone}
                    </div>
                    {order.customerAddress && (
                      <div className="text-[11px] text-zinc-400 max-w-xs truncate mt-0.5">
                        {order.customerAddress}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-[#111111] dark:text-zinc-200">
                      {order.itemName}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-400 mt-0.5">
                      {order.itemType}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#111111] dark:text-white tabular-nums">
                    ₹{Number(order.amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[#111111] dark:text-zinc-300">
                    {order.status || 'Confirmed'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
