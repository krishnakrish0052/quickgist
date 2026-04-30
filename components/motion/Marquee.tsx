"use client";

import { motion } from "motion/react";
import { type ReactNode } from "react";

interface MarqueeProps {
  children: ReactNode;
  /** px/s scroll speed */
  speed?: number;
  className?: string;
  gap?: string;
}

export function Marquee({ children, speed = 60, className, gap = "2rem" }: MarqueeProps) {
  return (
    <div className={`overflow-hidden ${className ?? ""}`} aria-hidden>
      <motion.div
        className="flex"
        style={{ gap }}
        animate={{ x: [0, "-50%"] }}
        transition={{
          duration: 100 / speed,
          ease: "linear",
          repeat: Infinity
        }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}
