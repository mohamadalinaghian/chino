"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { IMenuItem } from "@/types/menu";

interface Props {
  item: IMenuItem;
}

export default function MenuItemCard({ item }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);

  const toggleExpanded = () => setExpanded((prev) => !prev);

  useEffect(() => {
    const descEl = descriptionRef.current;
    if (descEl && descEl.scrollHeight > descEl.clientHeight + 4) {
      setShowToggle(true);
    }
  }, []);

  return (
    <article
      className="flex gap-4 border-b border-gray-200 py-4 last:border-0 sm:gap-6"
      itemScope
      itemType="https://schema.org/Product"
    >
      {/* تصویر ثابت و مستقل */}
      <div className="relative w-[96px] sm:w-[120px] h-[96px] sm:h-[120px] rounded overflow-hidden bg-gray-100 shrink-0 grow-0 flex-none">
        <Image
          src={item.thumbnail || "/fallback-thumbnail.jpg"}
          alt={item.title}
          fill
          sizes="120px"
          className="object-cover object-center"
          placeholder="blur"
          blurDataURL="/blur.png"
        />
      </div>

      {/* محتوا */}
      <div className="flex flex-col justify-between flex-1 min-w-0 overflow-hidden">
        <div>
          <h3 className="text-base font-semibold" itemProp="name">
            {item.title}
          </h3>

          {item.description && (
            <div className="text-sm text-gray-600 mt-1" itemProp="description">
              <p
                ref={descriptionRef}
                className={`transition-all duration-300 ease-in-out whitespace-pre-line break-words min-w-0 ${
                  expanded ? "" : "line-clamp-2 sm:line-clamp-3 md:line-clamp-4"
                }`}
              >
                {item.description}
              </p>
              {showToggle && (
                <button
                  onClick={toggleExpanded}
                  className="text-xs text-blue-600 mt-1 hover:underline"
                >
                  {expanded ? "کمتر" : "بیشتر"}
                </button>
              )}
            </div>
          )}
        </div>

        <div
          className="text-sm font-semibold text-green-700 mt-2 ltr:text-left rtl:text-right"
          itemProp="offers"
          itemScope
          itemType="https://schema.org/Offer"
        >
          <span itemProp="price">{item.price}</span>
          <meta itemProp="priceCurrency" content="IRR" />
          <span className="ml-1">هزار تومان</span>
        </div>
      </div>
    </article>
  );
}
