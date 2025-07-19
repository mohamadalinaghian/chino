"use client";

import { useEffect, useState } from "react";

export default function useSearchQuery(delay = 300) {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setQuery(input.trim().toLowerCase());
    }, delay);

    return () => clearTimeout(handler);
  }, [input, delay]);

  return { input, query, setInput };
}
