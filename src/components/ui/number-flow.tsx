"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NumberFlowProps {
  value: number;
  className?: string;
  format?: any;
}

export default function NumberFlow({ value, className }: NumberFlowProps) {
  const [prevValue, setPrevValue] = useState(value);

  useEffect(() => {
    setPrevValue(value);
  }, [value]);

  const direction = value > prevValue ? 1 : -1;

  // Split number into string to render characters
  const formattedValue = value.toFixed(0);

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        overflow: "hidden",
        position: "relative",
        verticalAlign: "middle",
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: direction * 24, opacity: 0, filter: "blur(2px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -direction * 24, opacity: 0, filter: "blur(2px)" }}
          transition={{ type: "spring", stiffness: 350, damping: 26 }}
          style={{ display: "inline-block" }}
        >
          {formattedValue}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
