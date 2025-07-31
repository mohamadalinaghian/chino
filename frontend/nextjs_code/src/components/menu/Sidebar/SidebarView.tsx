import { IMenuCategory } from "@/types/menu";
import CategoryLink from "./CategoryLink";

interface SidebarViewProps {
	categories: IMenuCategory[];
	contentRef: React.RefObject<HTMLDivElement>;
	contentWidth: number;
	isOpen: boolean;
	mobile: boolean;
	onCategoryClick: (title: string) => void;
}

export const SidebarView = ({
	categories,
	contentRef,
	contentWidth,
	isOpen,
	mobile,
	onCategoryClick,
}: SidebarViewProps) => {
	return (
		<div
			className={`
        fixed left-4 bottom-20
        bg-gradient-to-b from-[#2d3436] to-[#1e272e]
        border border-[#ffffff20]
        rounded-2xl shadow-xl
        backdrop-blur-sm
        transition-all duration-300 ease-in-out
        z-40 overflow-hidden
        ${mobile ? "md:hidden" : "hidden md:block"}
        ${
					isOpen
						? "opacity-100 translate-y-0 max-h-[60vh]"
						: "opacity-0 translate-y-4 pointer-events-none max-h-0"
				}
      `}
			style={{
				width: `${contentWidth}px`,
				minWidth: "250px", // حداقل عرض
			}}
		>
			<div
				ref={contentRef}
				className="p-6 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-[#ffffff30] scrollbar-track-transparent"
			>
				<h2 className="font-bold text-lg mb-6 text-center text-white/90 bg-[#ffffff10] py-3 rounded-xl whitespace-nowrap">
					دستهبندیها
				</h2>
				<ul className="space-y-3">
					{categories.map((category) => (
						<li key={category.title}>
							<CategoryLink
								title={category.title}
								onClick={() => onCategoryClick(category.title)}
							/>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
};
