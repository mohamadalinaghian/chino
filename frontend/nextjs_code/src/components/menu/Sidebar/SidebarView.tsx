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
        bg-background
        border border-border
        rounded-lg shadow-md
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
			}}
		>
			<div ref={contentRef} className="p-4 h-full overflow-y-auto">
				<h2 className="font-bold text-md mb-4 text-center text-text">
					دستهبندیها
				</h2>
				<ul className="space-y-2">
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
