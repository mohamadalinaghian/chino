// hooks/useInView.ts
import { useEffect, useRef, useState } from "react";

export default function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      options || { threshold: 0.2 },
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}
