import React, { useState } from "react";
import Image from "next/image";
import { IMenuItem } from "@/types/menu";

interface Props {
  item: IMenuItem;
}

export default function MenuItemImage({ item }: Props) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative w-[96px] sm:w-[120px] aspect-square rounded overflow-hidden bg-gray-100 flex items-center justify-center text-gray-500 text-xs h-[96px] sm:h-[120px]">
      {hasError ? (
        <span className="text-center p-2">{item.title}</span>
      ) : (
        <Image
          src={item.thumbnail ?? "/fallback-thumbnail.webp"}
          alt={item.title}
          fill
          sizes="120px"
          className="object-cover object-center"
          placeholder="empty"
          priority
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}
