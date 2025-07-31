// src/components/menu/Category/Header/Title.tsx
interface TitleProps {
	children: string;
}

/**
 * Category Title Component
 * - Responsive typography
 * - Proper heading hierarchy
 */
export default function Title({ children }: TitleProps) {
	return (
		<h2
			className="
      text-2xl md:text-3xl text-center font-bold
      text-gray-800 dark:text-white
      mb-2
    "
		>
			{children}
		</h2>
	);
}
