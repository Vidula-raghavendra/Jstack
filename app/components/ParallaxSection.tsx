"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ParallaxProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export function Parallax({ children, speed = 0.3, className = "" }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * -100}px`, `${speed * 100}px`]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

export function ParallaxText({ text, speed = 60 }: { text: string; speed?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -speed * 4]);

  const repeated = Array(8).fill(text).join(" · ");

  return (
    <div ref={ref} className="overflow-hidden select-none py-6">
      <motion.div style={{ x }} className="flex gap-8 whitespace-nowrap">
        <span className="text-[clamp(48px,6vw,80px)] font-extrabold tracking-tight opacity-5 text-[#F4F3FF]" style={{ fontFamily: "'Satoshi', sans-serif" }}>
          {repeated}
        </span>
      </motion.div>
    </div>
  );
}
