"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import React from "react";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "primary" | "outline";
  showArrow?: boolean;
  children?: React.ReactNode;
}

export function Button({ children, variant = "primary", showArrow = false, className, ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "px-6 py-3 rounded-full font-sans font-medium transition-colors duration-200 cursor-pointer inline-flex items-center justify-center gap-2",
        variant === "primary" 
          ? "bg-[#3D8528] text-white hover:bg-[#2F6A1E]" // Matching the exact Ancestry bright green
          : "border-2 border-[#3D8528] text-[#3D8528] hover:bg-[#3D8528] hover:text-white bg-transparent",
        className
      )}
      {...props}
    >
      {children}
      {showArrow && <ArrowRight size={18} />}
    </motion.button>
  );
}