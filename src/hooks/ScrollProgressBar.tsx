// src/components/ui/ScrollProgressBar.tsx
import { motion } from "framer-motion";
import { useScrollProgress } from "./useScrollProgress";

export const ScrollProgressBar = () => {
  const progress = useScrollProgress();
  return (
    <motion.div
      className="fixed top-0 left-0 h-1 bg-primary-600 z-[60]"
      style={{ scaleX: progress, transformOrigin: "0 50%" }}
    />
  );
};
