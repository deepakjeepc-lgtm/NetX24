import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Loader2, Calendar, FileText } from 'lucide-react';

export default function OrdersView() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      let snap;
      try {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        snap = await getDocs(q);
      } catch (queryErr) {
        snap = await getDocs(collection(db, 'orders'));
      }
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

  if (loading) return <div className="p-4 text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading Orders...</div>;

  return (
    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md rounded-[2rem] shadow-lg shadow-indigo-500/5 border border-slate-200/60 dark:border-slate-800/80 overflow-hidden">
      <div className="px-6 py-6 md:px-8 md:py-8 border-b border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display font-extrabold text-[#1C1D20] dark:text-white text-xl">Payment & Order History</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Recent successful transactions</p>
        </div>
        <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full">
          Total Orders: <span className="text-[#1C1D20] dark:text-white">{orders.length}</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
          <thead className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800 uppercase tracking-widest font-bold">
            <tr>
              <th className="px-6 md:px-8 py-4">Date & ID</th>
              <th className="px-6 md:px-8 py-4">Customer</th>
              <th className="px-6 md:px-8 py-4">Item</th>
              <th className="px-6 md:px-8 py-4">Amount</th>
              <th className="px-6 md:px-8 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-slate-500 dark:text-slate-400 font-medium">
                  No orders yet.
                </td>
              </tr>
            ) : orders.map(order => (
              <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 md:px-8 py-5 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-[#1C1D20] dark:text-white font-bold mb-1">
                    {order.orderId}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    {order.createdAt ? new Date(order.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                  </div>
                </td>
                <td className="px-6 md:px-8 py-5">
                  <div className="font-bold text-[#1C1D20] dark:text-white">{order.customerName}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{order.customerPhone}</div>
                </td>
                <td className="px-6 md:px-8 py-5">
                  <div className="text-[#1C1D20] dark:text-slate-300 font-medium mb-1.5 line-clamp-2 max-w-xs">{order.itemName}</div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-[9px] font-bold tracking-widest uppercase">
                    {order.itemType}
                  </span>
                </td>
                <td className="px-6 md:px-8 py-5">
                  <div className="font-bold text-[#1C1D20] dark:text-white text-lg">₹{order.amount}</div>
                </td>
                <td className="px-6 md:px-8 py-5">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                    order.status === 'Success' 
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' 
                      : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                  }`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
