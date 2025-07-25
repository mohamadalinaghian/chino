import React, { useState, useEffect, useRef } from "react";
import { highlightText } from "../search/highlight";

interface Props {
  description: string;
  query: string;
}

export default function MenuItemDescription({ description, query }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const el = ref.current;
      setClamped(el.scrollHeight > el.clientHeight + 1);
    }
  }, []);

  return (
    <div className="mt-1 text-xs sm:text-sm text-gray-700">
      <div
        ref={ref}
        className={`transition-all duration-300 ease-in-out whitespace-pre-wrap break-words ${
          expanded ? "" : "line-clamp-3"
        }`}
      >
        {highlightText(description, query)}
      </div>

      {clamped && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-1 text-xs text-blue-500 hover:underline"
        >
          {expanded ? "کمتر" : "بیشتر"}
        </button>
      )}
    </div>
  );
}
