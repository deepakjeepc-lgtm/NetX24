import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Trash2, Loader2, Calendar } from 'lucide-react';

export default function ContactSubmissions() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      let snap;
      try {
        const q = query(collection(db, 'contactSubmissions'), orderBy('createdAt', 'desc'));
        snap = await getDocs(q);
      } catch (queryErr) {
        snap = await getDocs(collection(db, 'contactSubmissions'));
      }
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis?.() || a.timestamp?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || b.timestamp?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setSubmissions(data);
    } catch (e: any) {
      console.warn('Contact submissions note:', e?.message || e);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this submission?")) {
      try {
        await deleteDoc(doc(db, 'contactSubmissions', id));
        setSubmissions(submissions.filter(s => s.id !== id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (loading) return <div className="p-4 text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading Submissions...</div>;

  return (
    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md rounded-[2rem] shadow-lg shadow-indigo-500/5 border border-slate-200/60 dark:border-slate-800/80 overflow-hidden">
      <div className="px-6 py-6 md:px-8 md:py-8 border-b border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display font-extrabold text-[#1C1D20] dark:text-white text-xl">Contact Submissions</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Inquiries from your website</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
          <thead className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800 uppercase tracking-widest font-bold">
            <tr>
              <th className="px-6 md:px-8 py-4">Date</th>
              <th className="px-6 md:px-8 py-4">Name</th>
              <th className="px-6 md:px-8 py-4">Contact</th>
              <th className="px-6 md:px-8 py-4">Service</th>
              <th className="px-6 md:px-8 py-4">Message</th>
              <th className="px-6 md:px-8 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-slate-500 dark:text-slate-400 font-medium">
                  No submissions yet.
                </td>
              </tr>
            ) : submissions.map(sub => (
              <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 md:px-8 py-5 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    {(sub.createdAt || sub.timestamp) ? new Date((sub.createdAt || sub.timestamp).toDate()).toLocaleDateString() : 'N/A'}
                  </div>
                </td>
                <td className="px-6 md:px-8 py-5 font-bold text-[#1C1D20] dark:text-white">{sub.name}</td>
                <td className="px-6 md:px-8 py-5">
                  <div className="font-medium text-slate-700 dark:text-slate-300">{sub.email}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-500 font-medium mt-0.5">{sub.phone}</div>
                </td>
                <td className="px-6 md:px-8 py-5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-[9px] font-bold tracking-widest uppercase">
                    {sub.service}
                  </span>
                </td>
                <td className="px-6 md:px-8 py-5 max-w-xs truncate text-[#1C1D20] dark:text-slate-300 font-medium" title={sub.message}>
                  {sub.message}
                </td>
                <td className="px-6 md:px-8 py-5 text-right">
                  <button onClick={() => handleDelete(sub.id)} className="p-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-red-100 dark:border-red-900/50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
