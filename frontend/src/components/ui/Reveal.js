"use client";

import { motion } from "framer-motion";

export function Reveal({ delay = 0, children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.45, 
        ease: "easeOut",
        delay: delay / 1000 // framer-motion uses seconds
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
