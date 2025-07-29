import React, { useState } from "react";
import Search from "@/components/menu/Sidebar/Search";
import CategoryLink from "@/components/menu/Sidebar/CategoryLink";
import SidebarToggleButton from "@/components/menu/Sidebar/SidebarToggleButton";
import { IMenuCategory, IMenuItem } from "@/types/menu";

interface Props {
	categories: IMenuCategory[];
	items: IMenuItem[];
	onCategoryClick: (anchorId: string) => void;
}

export default function Sidebar({ categories, items, onCategoryClick }: Props) {
	const [query, setQuery] = useState("");
	const [isOpen, setOpen] = useState(false);

	return (
		<>
			<SidebarToggleButton isOpen={isOpen} onToggle={() => setOpen(!isOpen)} />
			{isOpen && (
				<aside
					className="fixed top-0 left-0 h-full w-64 bg-background shadow-lg p-4 overflow-auto animate-fade-in-up z-50"
					data-testid="sidebar-content"
				>
					<Search
						query={query}
						onChange={setQuery}
						onReset={() => setQuery("")}
					/>
					<nav aria-label="Menu categories">
						{categories.map((cat) => {
							const id = cat.title.replace(/\s+/g, "-").toLowerCase();
							return (
								<CategoryLink
									key={id}
									title={cat.title}
									anchorId={id}
									onClick={() => {
										onCategoryClick(id);
										setOpen(false);
									}}
								/>
							);
						})}
					</nav>
				</aside>
			)}
		</>
	);
}
