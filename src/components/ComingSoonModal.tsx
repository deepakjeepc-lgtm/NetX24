import React from 'react';
import { X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export default function ComingSoonModal({ isOpen, onClose, title = "Coming Soon" }: ComingSoonModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl overflow-hidden text-center border border-slate-200 dark:border-slate-800"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-indigo-500" />
            </div>
            
            <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-3">
              {title}
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              We are working hard to bring this feature to you soon. Please check back later!
            </p>
            
            <button 
              onClick={onClose}
              className="mt-8 w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3 px-6 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              Okay, got it
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
