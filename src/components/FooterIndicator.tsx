import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

export default function FooterIndicator() {
  return (
    <div className="w-full flex justify-center pb-12 pt-16 mt-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.5 }}
        viewport={{ once: false, margin: "50px" }}
        className="flex flex-col items-center gap-3"
      >
        <div className="h-1 w-12 rounded-full bg-slate-200 dark:bg-slate-800"></div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 font-medium text-sm backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50">
          <CheckCircle2 className="w-4 h-4" />
          <span>You've reached the end</span>
        </div>
      </motion.div>
    </div>
  );
}
