"use client";

import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EvalisLogoProps {
  className?: string;
}

export function EvalisLogo({ className }: EvalisLogoProps) {
  const pathVariants: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: [0, 1, 1],
      transition: {
        pathLength: { delay: i * 0.1, type: "spring" as const, duration: 0.8, bounce: 0 },
        opacity: { delay: i * 0.1, duration: 0.1 }
      }
    }),
    hover: (i: number) => ({
      pathLength:[1, 0, 1],
      transition: { duration: 0.6, ease: "easeInOut" as const, delay: i * 0.05 }
    })
  };

  return (
    <Link href="/" className={cn("group relative inline-flex flex-col items-center", className)}>
      
      <div className="font-serif text-4xl text-[#1C1C1A] tracking-tight flex items-baseline z-10">
        <span className="font-semibold">E</span>
        <span className="italic font-light pr-[2px]">v</span>
        <span className="font-medium">al</span>
        <span className="italic font-light pr-[1px]">i</span>
        <span className="font-medium">s</span>
      </div>

      <motion.svg
        initial="hidden"
        animate="visible"
        whileHover="hover"
        className="absolute -bottom-3 left-[-5%] w-[110%] h-[18px] overflow-visible"
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          custom={0}
          variants={pathVariants}
          d="M 2,10 Q 25,12 50,9 T 98,11"
          fill="transparent"
          stroke="#84A942"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.4"
        />
        
        <motion.path
          custom={1}
          variants={pathVariants}
          d="M 3,11 Q 30,8 55,11 T 96,10"
          fill="transparent"
          stroke="#74963A"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.8"
        />

        <motion.path
          custom={2}
          variants={pathVariants}
          d="M 4,9 Q 20,7 45,10 T 95,8"
          fill="transparent"
          stroke="#5D7A2E"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.9"
        />
      </motion.svg>
    </Link>
  );
}