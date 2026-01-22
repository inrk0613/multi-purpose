import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  React.useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => onDone(), 2800);
    return () => window.clearTimeout(t);
  }, [message, onDone]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="fixed left-1/2 bottom-6 -translate-x-1/2 z-50"
        >
          <div className="rounded-xl bg-ink text-white px-4 py-2 text-sm shadow-soft">
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
