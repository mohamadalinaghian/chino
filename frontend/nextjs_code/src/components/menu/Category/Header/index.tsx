import Title from "./Title";
import ExpandableDescription from "./ExpandableDescription";

export default function Header({
	title,
	description,
}: {
	title: string;
	description?: string | null;
}) {
	return (
		<header
			id={`heading-${title}`}
			className="sticky top-16 z-10 py-4 border-b border-border bg-background/90 backdrop-blur-md animate-fade-in-up"
		>
			<Title>{title}</Title>
			{description && <ExpandableDescription text={description} />}
		</header>
	);
}
