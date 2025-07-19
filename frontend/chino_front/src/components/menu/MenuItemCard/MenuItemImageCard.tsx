import React from "react";

import Image from "next/image";
import { IMenuItem } from "@/types/menu";

interface Props {
  item: IMenuItem;
}

export default function MenuItemImage({ item }: Props) {
  return (
    <div className="relative w-[96px] sm:w-[120px] aspect-square rounded overflow-hidden bg-gray-100 shrink-0 grow-0 flex-none h-[96px] sm:h-[120px]">
      <Image
        src={item.thumbnail || "/fallback-thumbnail.jpg"}
        alt={item.title}
        fill
        sizes="120px"
        className="object-cover object-center"
        placeholder="blur"
        priority
        blurDataURL="/blur.png"
      />
    </div>
  );
}
