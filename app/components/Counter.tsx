"use client";
import { useInView, useMotionValue, useSpring, motion } from "framer-motion";
import { useEffect, useRef } from "react";

interface CounterProps {
  from?: number;
  to: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

export function Counter({ from = 0, to, suffix = "", prefix = "", decimals = 0, duration = 2, className = "" }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const motionVal = useMotionValue(from);
  const spring = useSpring(motionVal, { duration: duration * 1000, bounce: 0 });

  useEffect(() => {
    if (inView) motionVal.set(to);
  }, [inView, motionVal, to]);

  return (
    <motion.span
      ref={ref}
      className={className}
      style={{ display: "inline-block" }}
    >
      {prefix}
      <motion.span>
        {spring.get().toFixed(decimals)}
      </motion.span>
      {suffix}
      <MotionCounter spring={spring} prefix={prefix} suffix={suffix} decimals={decimals} />
    </motion.span>
  );
}

function MotionCounter({ spring, prefix, suffix, decimals }: { spring: ReturnType<typeof useSpring>; prefix: string; suffix: string; decimals: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    return spring.on("change", (v) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${v.toFixed(decimals)}${suffix}`;
      }
    });
  }, [spring, prefix, suffix, decimals]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
}
