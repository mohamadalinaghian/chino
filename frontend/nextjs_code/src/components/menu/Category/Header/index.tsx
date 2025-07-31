// src/components/menu/Category/Header/index.tsx
import Title from "./Title";
import ExpandableDescription from "./ExpandableDescription";

interface HeaderProps {
	title: string;
	description?: string | null;
}

/**
 * Category Header Component
 * - Sticky positioning
 * - Backdrop blur effect
 * - Smooth transitions
 */
export default function Header({ title, description }: HeaderProps) {
	return (
		<header
			id={`heading-${title}`}
			className={`
        sticky top-16 z-10 py-4
        border-b border-gray-200 dark:border-gray-700
        bg-white/90 dark:bg-gray-900/90
        backdrop-blur-sm
        transition-colors duration-300
      `}
		>
			<Title>{title}</Title>
			{description && <ExpandableDescription text={description} />}
		</header>
	);
}
