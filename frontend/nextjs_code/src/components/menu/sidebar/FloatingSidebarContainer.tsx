import { ReactNode } from "react";

type Props = {
	visible: boolean;
	children: ReactNode;
};

export default function FloatingSidebarContainer({ visible, children }: Props) {
	return (
		<nav
			className={`fixed bottom-20 left-0 z-40 p-4 rounded-xl shadow-xl
border border-[#EADBC8] bg-[#C4B29E] 
transition-transform duration-300 transform
  ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}
  w-fit max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#C4B29E] scrollbar-track-[#eee]`}
		>
			{children}
		</nav>
	);
}
