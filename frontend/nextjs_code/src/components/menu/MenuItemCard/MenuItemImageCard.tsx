import React, { useState } from "react";
import Image from "next/image";
import { IMenuItem } from "@/types/menu";

interface Props {
  item: IMenuItem;
}

export default function MenuItemImage({ item }: Props) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative min-w-[96px] w-[96px] h-[96px] sm:w-[110px] sm:h-[110px] rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
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
