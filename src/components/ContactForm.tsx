import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ContactForm() {
  const [formData, setFormData] = useState({ name: '', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      await addDoc(collection(db, 'contactSubmissions'), {
        ...formData,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      setStatus('success');
      setFormData({ name: '', phone: '', message: '' });
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error("Error submitting form", error);
      setStatus('error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="group">
        <label htmlFor="name" className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest group-focus-within:text-white transition-colors">Name</label>
        <input 
          type="text" 
          id="name" 
          required 
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full px-5 py-4 rounded-2xl border border-white/10 focus:border-white/40 focus:ring-0 transition-all bg-white/5 focus:bg-white/10 text-white font-medium placeholder:text-slate-500 backdrop-blur-sm outline-none"
          placeholder="Your Name"
        />
      </div>
      <div className="group">
        <label htmlFor="phone" className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest group-focus-within:text-white transition-colors">Phone Number</label>
        <input 
          type="tel" 
          id="phone" 
          required 
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          className="w-full px-5 py-4 rounded-2xl border border-white/10 focus:border-white/40 focus:ring-0 transition-all bg-white/5 focus:bg-white/10 text-white font-medium placeholder:text-slate-500 backdrop-blur-sm outline-none"
          placeholder="+91 00000 00000"
        />
      </div>
      <div className="group">
        <label htmlFor="message" className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest group-focus-within:text-white transition-colors">Message</label>
        <textarea 
          id="message" 
          required 
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({...formData, message: e.target.value})}
          className="w-full px-5 py-4 rounded-2xl border border-white/10 focus:border-white/40 focus:ring-0 transition-all bg-white/5 focus:bg-white/10 text-white font-medium resize-none placeholder:text-slate-500 backdrop-blur-sm outline-none"
          placeholder="How can we help you today?"
        ></textarea>
      </div>
      <button 
        type="submit" 
        disabled={status === 'submitting' || status === 'success'}
        className="w-full mt-2 py-4 px-8 bg-white hover:bg-slate-200 text-[#1C1D20] font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl hover:shadow-white/10 disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center text-sm uppercase tracking-widest"
      >
        {status === 'submitting' ? 'Sending...' : status === 'success' ? 'Message Sent!' : 'Send Message'}
      </button>
      {status === 'error' && (
        <p className="text-red-400 text-sm mt-4 text-center font-medium">Failed to send message. Please try again.</p>
      )}
    </form>
  );
}
