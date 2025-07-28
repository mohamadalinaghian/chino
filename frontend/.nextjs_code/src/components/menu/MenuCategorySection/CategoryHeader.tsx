"use client";
import { useState, useEffect, useRef, forwardRef } from "react";
import { IMenuCategory } from "@/types/menu";

interface Props {
	category: IMenuCategory;
	isSticky?: boolean;
	isAtBottom?: boolean;
}

export const CategoryHeader = forwardRef<HTMLDivElement, Props>(
	({ category, isSticky = false, isAtBottom = false }, ref) => {
		const [expanded, setExpanded] = useState(false);
		const [canExpand, setCanExpand] = useState(false);
		const descRef = useRef<HTMLParagraphElement>(null);

		useEffect(() => {
			if (descRef.current && category.description) {
				const lineHeight = parseInt(
					getComputedStyle(descRef.current).lineHeight,
				);
				const maxHeight = lineHeight * 1.5;
				setCanExpand(descRef.current.scrollHeight > maxHeight);
			}
		}, [category.description]);

		return (
			<div
				ref={ref}
				className={`
  bg-gradient-to-r from-[#FAF3E0] to-[#F5E4C3]
  ${isSticky ? "fixed top-[90px] z-20 opacity-100 scale-100" : "relative opacity-0 scale-95"}
  transition-all duration-300 ease-in-out
  border-b-2 ${isAtBottom ? "border-transparent" : "border-[#C57E58]"}
`}
				style={{
					width: isSticky ? "100%" : "100%",
					maxWidth: isSticky ? "42rem" : "42rem", // یا 40rem برای کوچکتر
					marginLeft: "auto",
					marginRight: "auto",
					paddingLeft: isSticky ? "1rem" : "0",
					paddingRight: isSticky ? "1rem" : "0",
				}}
			>
				<div className="px-6 py-4">
					<h1 className="text-2xl text-[#5D4037] font-bold text-center mb-2">
						{category.title}
					</h1>
					{category.description && (
						<div className="mt-1">
							<p
								ref={descRef}
								className={`text-sm text-[#5D4037]/90 text-center transition-all duration-300 ${
									expanded ? "" : "line-clamp-1"
								}`}
							>
								{category.description}
							</p>
							{canExpand && (
								<button
									className="block mx-auto mt-1 text-xs text-[#C57E58] hover:underline font-medium"
									onClick={() => setExpanded(!expanded)}
								>
									{expanded ? "کمتر" : "بیشتر"}
								</button>
							)}
						</div>
					)}
				</div>
				{isSticky && !isAtBottom && (
					<div className="h-1 bg-gradient-to-r from-transparent via-[#C57E58] to-transparent mx-6 mb-1"></div>
				)}
			</div>
		);
	},
);

CategoryHeader.displayName = "CategoryHeader";
