import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Trash2 } from 'lucide-react';

export default function ContactSubmissions() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        let snap;
        try {
          const q = query(collection(db, 'contactSubmissions'), orderBy('timestamp', 'desc'));
          snap = await getDocs(q);
        } catch {
          snap = await getDocs(collection(db, 'contactSubmissions'));
        }
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSubmissions(data);
      } catch (e: any) {
        console.warn('Contact submissions note:', e?.message || e);
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'contactSubmissions', id));
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-xs uppercase tracking-[0.2em] text-zinc-400">
        Loading Inquiries...
      </div>
    );
  }

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#141418] border border-[#E5E5E0] dark:border-[#26262B] overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-[#E5E5E0] dark:border-[#26262B]">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[#111111] dark:text-white">
          INQUIRIES
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-[10px] uppercase tracking-[0.18em] text-zinc-400 border-b border-[#ECECE7] dark:border-[#222227]">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Message</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ECECE7] dark:divide-[#222227]">
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-14 text-center text-zinc-500">
                  No inquiries yet.
                </td>
              </tr>
            ) : (
              submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#18181D]">
                  <td className="px-6 py-4 font-bold text-[#111111] dark:text-white">
                    {sub.name}
                  </td>
                  <td className="px-6 py-4 text-zinc-500 tabular-nums">
                    {sub.phone || sub.email}
                  </td>
                  <td className="px-6 py-4 max-w-md text-[#111111] dark:text-zinc-300">
                    {sub.message}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                      aria-label="Delete inquiry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
