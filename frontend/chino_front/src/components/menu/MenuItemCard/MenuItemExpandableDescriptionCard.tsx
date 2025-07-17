"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  description: string;
}

export default function MenuItemExpandableDescription({ description }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const descEl = descriptionRef.current;
    if (descEl && descEl.scrollHeight > descEl.clientHeight + 4) {
      setShowToggle(true);
    }
  }, []);

  const toggleExpanded = () => setExpanded((prev) => !prev);

  return (
    <div className="text-sm text-gray-600 mt-1" itemProp="description">
      <p
        ref={descriptionRef}
        className={`transition-all duration-300 ease-in-out whitespace-pre-line break-words min-w-0 ${
          expanded ? "" : "line-clamp-2 sm:line-clamp-3 md:line-clamp-4"
        }`}
      >
        {description}
      </p>
      {showToggle && (
        <button
          onClick={toggleExpanded}
          className="text-xs text-blue-600 mt-1 hover:underline"
          aria-expanded={expanded}
        >
          {expanded ? "کمتر" : "بیشتر"}
        </button>
      )}
    </div>
  );
}
