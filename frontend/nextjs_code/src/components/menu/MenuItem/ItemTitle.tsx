export default function ItemTitle({ children }: { children: string }) {
	return (
		<h3
			className="
      text-lg font-bold 
      text-gray-800 dark:text-white
      mb-1
      line-clamp-2 break-words
    "
		>
			{children}
		</h3>
	);
}
