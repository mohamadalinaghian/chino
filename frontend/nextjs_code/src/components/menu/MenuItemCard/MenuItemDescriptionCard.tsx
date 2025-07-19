"use client";

import React, { useState } from "react";
import { highlightText } from "../search/highlight";

interface Props {
  description: string;
  query: string;
}

export default function MenuItemDescription({ description, query }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-1 text-sm text-gray-700">
      <div
        className={`transition-all duration-300 ease-in-out whitespace-pre-wrap break-words ${
          expanded ? "" : "line-clamp-3"
        }`}
      >
        {highlightText(description, query)}
      </div>

      {description.length > 80 && (
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
