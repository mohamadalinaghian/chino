"use client";
import { toAnchorId } from "./toAnchorId";

type Props = {
	title: string;
	active?: boolean;
	onClick?: () => void;
};

export default function SidebarItem({ title, active, onClick }: Props) {
	const anchorId = toAnchorId(title);

	const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
		e.preventDefault();
		const el = document.getElementById(anchorId);
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "start" });
			history.replaceState(null, "", `#${anchorId}`);
		}
		onClick?.();
	};

	return (
		<li>
			<a
				href={`#${anchorId}`}
				onClick={handleClick}
				className={`block px-4 py-2 text-[10px] sm:text-[12px] md:text-[13px] lg:text-[14px]
          text-center rounded font-medium transition-all duration-200
          ${
						active
							? "bg-[#B08968] text-white shadow"
							: "text-[#5C4033] hover:bg-[#EADBC8]"
					}`}
			>
				{title}
			</a>
		</li>
	);
}
