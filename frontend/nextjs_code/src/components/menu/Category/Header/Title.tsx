interface TitleProps {
	children: string;
}

/**
 * Category Title Component
 * - Responsive and prominent
 */
export default function Title({ children }: TitleProps) {
	return (
		<h2
			className={`
        text-2xl md:text-3xl font-extrabold text-center
        text-amber-700 dark:text-amber-400
        mb-2 tracking-tight
      `}
		>
			{children}
		</h2>
	);
}
