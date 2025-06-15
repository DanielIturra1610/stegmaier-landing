// src/hooks/useScrollProgress.ts
import { useEffect, useState } from "react";

export const useScrollProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const total = document.body.scrollHeight - window.innerHeight;
      const current = window.scrollY;
      setProgress(Math.min(1, current / total));
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return progress;
};
