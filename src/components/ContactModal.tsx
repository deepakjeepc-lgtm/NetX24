import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Phone, MessageCircle } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            {/* Decorative background */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500/10 via-red-500/5 to-transparent dark:from-indigo-500/20 dark:via-red-500/10 pointer-events-none" />
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full backdrop-blur-sm transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-8 pt-10 text-center relative z-10">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-600 to-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 mb-6 border-4 border-white dark:border-slate-900">
                <Phone className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Get in Touch</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
                Choose how you'd like to connect with us.
              </p>
              
              <div className="space-y-3">
                <a 
                  href="tel:9229877290" 
                  className="flex items-center justify-center gap-3 w-full py-4 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-all shadow-md hover:shadow-lg"
                >
                  <Phone className="w-5 h-5" />
                  Call +91 9229877290
                </a>
                
                <a 
                  href="https://wa.me/919229877290" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full py-4 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-all shadow-md hover:shadow-lg shadow-green-600/20"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
