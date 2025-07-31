import Title from "./Title";
import ExpandableDescription from "./ExpandableDescription";

interface HeaderProps {
	title: string;
	description?: string | null;
}

/**
 * Category Header Component
 * - Styled with unique background and rounded corners
 * - Contains title and expandable description
 */
export default function Header({ title, description }: HeaderProps) {
	return (
		<header
			id={`heading-${title}`}
			className={`
        sticky top-16 z-10 px-4 py-5 max-w-5xl mx-auto
        rounded-xl
        border border-gray-200 dark:border-gray-700
        bg-gradient-to-br from-[#fff9f2] to-[#fef6f9] dark:from-[#1f1f1f] dark:to-[#2b2b2b]
        backdrop-blur-md shadow-md
        transition-colors duration-300
      `}
		>
			<Title>{title}</Title>
			{description && <ExpandableDescription text={description} />}
		</header>
	);
}
